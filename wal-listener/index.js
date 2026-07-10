require('dotenv').config();
const { LogicalReplicationService, PgoutputPlugin } = require('pg-logical-replication');
const Redis = require('ioredis');
const express = require('express');

// Configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  application_name: 'backendly_wal_listener'
};

const SLOT_NAME = 'backendly_slot';
const PUB_NAME = 'backendly_pub';

let currentLag = 0; // rough lag in bytes
let isConnected = false;

// Redis Client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('error', (err) => console.error('Redis Client Error', err));

// Express Health Check
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: isConnected ? 'ok' : 'error', lag_bytes: currentLag });
});
app.listen(process.env.PORT || 3002, () => {
  console.log(`WAL Listener health check on port ${process.env.PORT || 3002}`);
});

async function startReplication() {
  console.log('Connected to Redis');

  const plugin = new LogicalReplicationService(dbConfig, { acknowledge: { auto: true, timeoutSeconds: 10 } });

  plugin.on('data', (lsn, log) => {
    // track lag (very rough estimate by looking at LSN string diff if needed, 
    // but the library doesn't easily expose lag without querying pg_stat_replication.
    // For now we just log LSNs or mark connected).
    
    // Check if it's an insert, update, or delete
    if (log.tag === 'insert' || log.tag === 'update' || log.tag === 'delete') {
      const event = {
        table: log.relation.name,
        operation: log.tag,
        schema: log.relation.schema,
        old: log.old || null,
        new: log.new || null,
        timestamp: new Date().toISOString(),
        lsn: lsn
      };

      // Publish to Redis channel changes:{table}
      const channel = `changes:${event.table}`;
      redis.publish(channel, JSON.stringify(event))
        .catch(err => console.error(`Failed to publish to ${channel}`, err));
    }
  });

  plugin.on('error', (err) => {
    console.error('Logical Replication Error:', err);
    isConnected = false;
    setTimeout(startReplication, 5000); // exponential backoff could be added here
  });

  try {
    // 1. We need to create publication if not exists. We can do this using a normal pg client.
    const { Client } = require('pg');
    const pgClient = new Client(dbConfig);
    await pgClient.connect();
    
    const pubCheck = await pgClient.query(`SELECT pubname FROM pg_publication WHERE pubname = $1`, [PUB_NAME]);
    if (pubCheck.rows.length === 0) {
      console.log(`Creating publication ${PUB_NAME}...`);
      await pgClient.query(`CREATE PUBLICATION ${PUB_NAME} FOR ALL TABLES;`);
    } else {
      console.log(`Publication ${PUB_NAME} already exists.`);
    }

    const slotCheck = await pgClient.query(`SELECT slot_name FROM pg_replication_slots WHERE slot_name = $1`, [SLOT_NAME]);
    if (slotCheck.rows.length === 0) {
      console.log(`Creating replication slot ${SLOT_NAME}...`);
      await pgClient.query(`SELECT pg_create_logical_replication_slot($1, 'pgoutput')`, [SLOT_NAME]);
    } else {
      console.log(`Replication slot ${SLOT_NAME} already exists.`);
    }

    await pgClient.end();

    // 2. Start replication
    console.log(`Starting logical replication (slot: ${SLOT_NAME})...`);
    isConnected = true;
    const pluginInstance = new PgoutputPlugin({ protoVersion: 1, publicationNames: [PUB_NAME] });
    plugin.subscribe(pluginInstance, SLOT_NAME).catch((err) => {
      console.error('Replication subscription failed:', err);
      isConnected = false;
      setTimeout(startReplication, 5000);
    });

  } catch (err) {
    console.error('Failed to initialize replication:', err);
    isConnected = false;
    setTimeout(startReplication, 5000);
  }
}

startReplication();
