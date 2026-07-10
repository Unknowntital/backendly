import asyncio
from pg_motor_adapter import Database

async def check():
    db = Database("postgresql://postgres:postgres@localhost:3000/backendly")
    sessions = await db.user_sessions.find({}).to_list(length=None)
    print("Sessions:", sessions)
    users = await db.users.find({}).to_list(length=None)
    print("Users:", users)

asyncio.run(check())
