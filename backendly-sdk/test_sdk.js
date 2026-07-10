const { createRealtimeClient } = require('./dist/index.js');
const { Client } = require('pg');

async function test() {
  console.log('Testing SDK...');
  const pgClient = new Client('postgresql://postgres:backendly2026@localhost:3000/postgres');
  await pgClient.connect();
  
  // We reuse the same project and API key from phase 2
  // But let's fetch it to be sure
  const res = await pgClient.query("SELECT project_id, name FROM api_keys WHERE name = 'test_key' LIMIT 1");
  const projectId = res.rows[0].project_id;
  const rawKey = 'bkl_live_test_key_phase2'; // we hardcoded it in the DB

  const client = createRealtimeClient({ apiKey: rawKey, projectUrl: 'ws://localhost:3003/realtime' });
  
  let eventsReceived = 0;
  
  const sub = client.table('todos')
    .filter('task', 'eq', 'Buy Eggs')
    .on('INSERT', (row) => {
      console.log('\n--- SDK FILTERED EVENT RECEIVED ---');
      console.log(row);
      console.log('----------------------------------\n');
      eventsReceived++;
      if (eventsReceived === 1) {
        console.log('Success! SDK connected, filtered, and parsed correctly.');
        process.exit(0);
      }
    })
    .subscribe();

  client.on('resync-needed', () => {
    console.log('RESYNC NEEDED emitted');
  });

  // wait a moment for WS connection to establish
  setTimeout(async () => {
    console.log('Inserting row...');
    const tableRes = await pgClient.query("SELECT table_id FROM project_tables WHERE name = 'todos' LIMIT 1");
    const tableId = tableRes.rows[0].table_id;
    await pgClient.query(`INSERT INTO project_records (record_id, project_id, table_id, data) VALUES ($1, $2, $3, $4)`, ['rec_3', projectId, tableId, JSON.stringify({ task: 'Buy Eggs' })]);
  }, 1000);

  setTimeout(() => {
    console.error('Timeout waiting for event');
    process.exit(1);
  }, 5000);
}

test();
