const Redis = require('ioredis');
const { Client } = require('pg');

async function test() {
  const redis = new Redis('redis://localhost:6379');
  
  redis.psubscribe('changes:*', (err, count) => {
    if (err) console.error(err);
    console.log(`Subscribed to ${count} patterns.`);
  });

  redis.on('pmessage', (pattern, channel, message) => {
    console.log('\n--- REDIS EVENT RECEIVED ---');
    console.log('Channel:', channel);
    console.log('Message:', JSON.parse(message));
    console.log('----------------------------\n');
    process.exit(0);
  });

  console.log('Connecting to PostgreSQL...');
  const pgClient = new Client('postgresql://postgres:backendly2026@localhost:3000/postgres');
  await pgClient.connect();

  console.log('Inserting test row...');
  await pgClient.query(`
    INSERT INTO status_checks (id, client_name) 
    VALUES ('test-' || gen_random_uuid(), 'phase1_test')
  `);
  
  await pgClient.end();
  console.log('Row inserted. Waiting for Redis event...');
  
  setTimeout(() => {
    console.error('Timed out waiting for Redis event.');
    process.exit(1);
  }, 5000);
}

test();
