require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const { Client } = require('pg');
const http = require('http');
const crypto = require('crypto');

// Setup
const port = process.env.PORT || 3003;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Postgres for auth & table lookups
const pgClient = new Client(process.env.DATABASE_URL);
pgClient.connect().catch(console.error);

// Redis
const redisSub = new Redis(process.env.REDIS_URL);
redisSub.on('error', err => console.error('Redis error', err));

// State
// activeClients: Set of WebSocket objects
const activeClients = new Set();
// metrics
const metrics = { connections: 0, tableSubs: {} };
// Cache: table_id -> table_name mapping (so we don't query DB on every event)
// Map: project_id -> { table_id: table_name, name_to_id: { table_name: table_id } }
const tableCache = new Map();

// HTTP /metrics
app.get('/metrics', (req, res) => {
  res.json({
    active_connections: activeClients.size,
    subscriptions_per_table: metrics.tableSubs,
    total_connections_handled: metrics.connections
  });
});

async function getProjectTables(projectId) {
  if (!tableCache.has(projectId)) {
    const res = await pgClient.query('SELECT table_id, name FROM project_tables WHERE project_id = $1', [projectId]);
    const idToName = {};
    const nameToId = {};
    for (const row of res.rows) {
      idToName[row.table_id] = row.name;
      nameToId[row.name] = row.table_id;
    }
    tableCache.set(projectId, { idToName, nameToId });
  }
  return tableCache.get(projectId);
}

// Subscribe to postgres changes
redisSub.subscribe('changes:project_records', (err) => {
  if (err) console.error('Failed to subscribe to redis', err);
  else console.log('Subscribed to changes:project_records on Redis');
});

redisSub.on('message', async (channel, message) => {
  if (channel !== 'changes:project_records') return;
  
  try {
    const event = JSON.parse(message);
    const row = event.new || event.old;
    if (!row) return;

    const projectId = row.project_id;
    const tableId = row.table_id;

    // Get table name
    const projectCache = await getProjectTables(projectId);
    const tableName = projectCache.idToName[tableId];
    if (!tableName) return; // Unknown table or not cached

    // Find clients listening to this project and table (or all tables '*')
    for (const client of activeClients) {
      if (client.projectId === projectId && (client.subscriptions.has(tableName) || client.subscriptions.has('*'))) {
        const filter = client.subscriptions.get(tableName) || client.subscriptions.get('*');
        
        let match = true;
        if (filter && filter.column && filter.value !== undefined) {
          // data is inside row.data for project_records
          const val = row.data ? row.data[filter.column] : undefined;
          
          if (filter.operator === 'eq' || !filter.operator) {
            match = val === filter.value;
          } else if (filter.operator === 'neq') {
            match = val !== filter.value;
          } // ... other ops could go here
        }

        if (match) {
          // ENFORCE END-USER ISOLATION
          if (client.endUserId) {
            const rowEndUserId = row.data ? row.data.end_user_id : null;
            if (rowEndUserId !== client.endUserId) {
              match = false; // Deny: they don't own this row
            }
          }
        }

        if (match) {
          // Send simplified payload matching what the client expects for the dynamic table
          const clientPayload = {
            table: tableName,
            operation: event.operation.toUpperCase(),
            timestamp: event.timestamp,
            old: event.old ? { id: event.old.record_id, ...event.old.data } : null,
            new: event.new ? { id: event.new.record_id, ...event.new.data } : null
          };
          client.send(JSON.stringify(clientPayload));
        }
      }
    }

  } catch (err) {
    console.error('Error processing redis message', err);
  }
});

// Authentication Upgrade
server.on('upgrade', async (request, socket, head) => {
  if (!request.url.startsWith('/realtime')) {
    socket.destroy();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const apiKey = url.searchParams.get('apiKey');
  const token = url.searchParams.get('token');
  
  // Extract session cookie for dashboard developers
  let devSession = null;
  if (request.headers.cookie) {
    const match = request.headers.cookie.match(/backendly_session=([^;]+)/);
    if (match) devSession = match[1];
  }

  let projectId = null;
  let isDev = false;
  let endUserId = null;

  try {
    if (devSession) {
      // Validate developer session
      const res = await pgClient.query('SELECT user_id FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()', [devSession]);
      if (res.rows.length > 0) {
        const userId = res.rows[0].user_id;
        // The developer has access, but we need to know WHICH project they are trying to access.
        // We can pass project_id in the WS url: ?projectId=...
        const reqProjectId = url.searchParams.get('projectId');
        if (reqProjectId) {
          const projCheck = await pgClient.query('SELECT project_id FROM projects WHERE project_id = $1 AND user_id = $2', [reqProjectId, userId]);
          if (projCheck.rows.length > 0) {
            projectId = reqProjectId;
            isDev = true;
          }
        }
      }
    }
    
    if (!projectId && apiKey) {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const res = await pgClient.query('SELECT project_id FROM api_keys WHERE key_hash = $1', [keyHash]);
      if (res.rows.length > 0) {
        projectId = res.rows[0].project_id;
      }
    } else if (token) {
      // End user session token
      const res = await pgClient.query('SELECT project_id, end_user_id FROM end_user_sessions WHERE token = $1 AND expires_at > NOW()', [token]);
      if (res.rows.length > 0) {
        projectId = res.rows[0].project_id;
        endUserId = res.rows[0].end_user_id;
      }
    }
  } catch (err) {
    console.error('Auth error', err);
  }

  if (!projectId) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    ws.projectId = projectId;
    ws.endUserId = endUserId;
    ws.subscriptions = new Map(); // tableName -> filter
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  activeClients.add(ws);
  metrics.connections++;

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);
      
      if (msg.type === 'subscribe' && msg.table) {
        ws.subscriptions.set(msg.table, msg.filter || null);
        metrics.tableSubs[msg.table] = (metrics.tableSubs[msg.table] || 0) + 1;
        
        // Refresh cache for this project just in case it's a new table
        await getProjectTables(ws.projectId);
        
        ws.send(JSON.stringify({ type: 'subscribed', table: msg.table }));
      } 
      else if (msg.type === 'unsubscribe' && msg.table) {
        if (ws.subscriptions.has(msg.table)) {
          ws.subscriptions.delete(msg.table);
          metrics.tableSubs[msg.table] = Math.max(0, metrics.tableSubs[msg.table] - 1);
        }
        ws.send(JSON.stringify({ type: 'unsubscribed', table: msg.table }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    for (const table of ws.subscriptions.keys()) {
      metrics.tableSubs[table] = Math.max(0, metrics.tableSubs[table] - 1);
    }
    activeClients.delete(ws);
  });
});

server.listen(port, () => {
  console.log(`Realtime Gateway listening on port ${port}`);
});
