import asyncio
import asyncpg
import uuid
import httpx
from datetime import datetime, timezone, timedelta
import json

async def run():
    # Insert fake user and session directly into postgres
    conn = await asyncpg.connect("postgresql://postgres:backendly2026@localhost:3000/nglogle")
    
    user_id = str(uuid.uuid4())
    session_token = str(uuid.uuid4())
    
    user_doc = {
        "user_id": user_id,
        "email": "test@example.com",
        "name": "Test",
        "auth_provider": "google",
        "password_hash": ""
    }
    await conn.execute("INSERT INTO users (data) VALUES ($1)", json.dumps(user_doc))
    
    session_doc = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    }
    await conn.execute("INSERT INTO user_sessions (data) VALUES ($1)", json.dumps(session_doc))
    await conn.close()
    
    # Hit the API
    async with httpx.AsyncClient() as client:
        res = await client.post("http://localhost:8000/api/auth/session", json={"session_id": session_token})
        print(res.status_code, res.text)

asyncio.run(run())
