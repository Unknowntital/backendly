import asyncio, asyncpg, os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

async def check():
    pg_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:backendly2026@localhost:3000/postgres')
    conn = await asyncpg.connect(pg_url)
    
    wal = await conn.fetchval("SHOW wal_level")
    print(f"wal_level = {wal}")
    
    max_slots = await conn.fetchval("SHOW max_replication_slots")
    print(f"max_replication_slots = {max_slots}")
    
    max_senders = await conn.fetchval("SHOW max_wal_senders")
    print(f"max_wal_senders = {max_senders}")
    
    version = await conn.fetchval("SHOW server_version")
    print(f"server_version = {version}")
    
    data_dir = await conn.fetchval("SHOW data_directory")
    print(f"data_directory = {data_dir}")
    
    config_file = await conn.fetchval("SHOW config_file")
    print(f"config_file = {config_file}")
    
    port = await conn.fetchval("SHOW port")
    print(f"port = {port}")
    
    await conn.close()

asyncio.run(check())
