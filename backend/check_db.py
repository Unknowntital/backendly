import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    pg_url = os.environ.get('DATABASE_URL')
    conn = await asyncpg.connect(pg_url)
    
    # Check if users table exists
    val = await conn.fetchval("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'users');")
    print("Users table exists:", val)
    
    # Check if there are any users
    if val:
        users = await conn.fetch("SELECT * FROM users")
        print("Users:", len(users))
        
    await conn.close()

asyncio.run(check())
