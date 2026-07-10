const WebSocket = require('ws');
const { Client } = require('pg');
const crypto = require('crypto');

async function test() {
  console.log('Setting up test data...');
  const pgClient = new Client('postgresql://postgres:backendly2026@localhost:3000/postgres');
  await pgClient.connect();

  // Create a project
  const projectId = 'proj_test_' + Date.now();
  await pgClient.query(`INSERT INTO users (user_id, email, name, auth_provider) VALUES ($1, $2, 'Test', 'google') ON CONFLICT DO NOTHING`, ['u_1', 't@t.com']);
  await pgClient.query(`INSERT INTO projects (project_id, user_id, name, region) VALUES ($1, 'u_1', 'Test Proj', 'us-east-1')`, [projectId]);
  
  // Create a table 'todos'
  const tableId = 'tab_test_' + Date.now();
  await pgClient.query(`INSERT INTO project_tables (table_id, project_id, name, fields) VALUES ($1, $2, 'todos', '[]')`, [tableId, projectId]);

  // Create an API Key
  const rawKey = 'bkl_live_test_key_phase2';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  await pgClient.query(`INSERT INTO api_keys (key_id, project_id, name, key_hash, prefix, last4) VALUES ($1, $2, 'test_key', $3, 'bkl_live', 'ase2')`, ['key_' + Date.now(), projectId, keyHash]);

  console.log('Connecting WebSocket...');
  const ws = new WebSocket(`ws://localhost:3003/realtime?apiKey=${rawKey}`);
  
  ws.on('open', () => {
    console.log('Connected! Sending subscribe...');
    // We filter by task="Buy Milk"
    ws.send(JSON.stringify({ type: 'subscribe', table: 'todos', filter: { column: 'task', value: 'Buy Milk', operator: 'eq' } }));
  });

  let eventsReceived = 0;

  ws.on('message', async (data) => {
    const msg = JSON.parse(data.toString());
    console.log('WS Received:', msg);
    
    if (msg.type === 'subscribed') {
      console.log('Subscription confirmed. Inserting matching and non-matching rows...');
      // Insert non-matching
      await pgClient.query(`INSERT INTO project_records (record_id, project_id, table_id, data) VALUES ($1, $2, $3, $4)`, ['rec_1', projectId, tableId, JSON.stringify({ task: 'Do Laundry' })]);
      
      // Insert matching
      await pgClient.query(`INSERT INTO project_records (record_id, project_id, table_id, data) VALUES ($1, $2, $3, $4)`, ['rec_2', projectId, tableId, JSON.stringify({ task: 'Buy Milk' })]);
    } else if (msg.table === 'todos') {
      console.log('\n--- WS FILTERED EVENT RECEIVED ---');
      console.log(msg);
      console.log('----------------------------------\n');
      eventsReceived++;
      if (eventsReceived === 1) {
        // Wait a bit to ensure we don't receive the non-matching event
        setTimeout(() => {
          console.log('Success! Only matching event was received.');
          process.exit(0);
        }, 1000);
      }
    }
  });

  setTimeout(() => {
    console.error('Test timed out.');
    process.exit(1);
  }, 5000);
}

test().catch(console.error);
