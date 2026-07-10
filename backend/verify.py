"""
End-to-end verification script for Backendly.
Tests: user creation → session → project → table → API key → record CRUD
"""
import asyncio
import asyncpg
import httpx
import uuid
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv(Path(__file__).parent / '.env')

BASE = "http://localhost:8000"

async def run():
    pg_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:backendly2026@localhost:3000/postgres')
    conn = await asyncpg.connect(pg_url)

    # 1. Create a test user directly in DB
    user_id = f"test_{uuid.uuid4().hex[:8]}"
    print(f"[1] Creating test user: {user_id}")
    await conn.execute(
        "INSERT INTO users (user_id, email, name, auth_provider, password_hash) VALUES ($1, $2, $3, $4, $5)",
        user_id, f"{user_id}@test.com", "Test User", "google", ""
    )
    print("    ✅ User created")

    # 2. Create a session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    print(f"[2] Creating session: {session_token[:16]}...")
    await conn.execute(
        "INSERT INTO user_sessions (session_token, user_id, expires_at) VALUES ($1, $2, $3)",
        session_token, user_id, expires_at
    )
    print("    ✅ Session created")
    await conn.close()

    # 3. Test /auth/me with cookie
    async with httpx.AsyncClient(base_url=BASE, cookies={"session_token": session_token}) as client:
        print("[3] Testing GET /api/auth/me")
        r = await client.get("/api/auth/me")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        me = r.json()
        assert me["user_id"] == user_id
        print(f"    ✅ Authenticated as: {me['name']} ({me['email']})")

        # 4. Create project
        print("[4] Creating project")
        r = await client.post("/api/projects", json={"name": "My Test App", "region": "us-east-1"})
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
        project = r.json()
        project_id = project["project_id"]
        print(f"    ✅ Project created: {project_id}")

        # 5. Create table
        print("[5] Creating table 'todos'")
        r = await client.post(f"/api/projects/{project_id}/tables", json={
            "name": "todos",
            "fields": [
                {"name": "task", "type": "string", "required": True},
                {"name": "done", "type": "boolean", "default": False},
                {"name": "priority", "type": "integer", "default": 0}
            ]
        })
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
        table = r.json()
        print(f"    ✅ Table created: {table['table_id']} with {len(table['fields'])} fields")

        # 6. List tables
        print("[6] Listing tables")
        r = await client.get(f"/api/projects/{project_id}/tables")
        assert r.status_code == 200
        tables = r.json()
        assert len(tables) == 1
        print(f"    ✅ Found {len(tables)} table(s)")

        # 7. Create API key
        print("[7] Creating API key")
        r = await client.post(f"/api/projects/{project_id}/api-keys", json={"name": "Test Key"})
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
        api_key_data = r.json()
        api_key = api_key_data["key"]
        print(f"    ✅ API key created: {api_key[:20]}...")

        # 8. List API keys
        print("[8] Listing API keys")
        r = await client.get(f"/api/projects/{project_id}/api-keys")
        assert r.status_code == 200
        keys = r.json()
        assert len(keys) == 1
        print(f"    ✅ Found {len(keys)} key(s)")

        # 9. Usage endpoint
        print("[9] Testing usage endpoint")
        r = await client.get(f"/api/projects/{project_id}/usage")
        assert r.status_code == 200
        usage = r.json()
        print(f"    ✅ Usage returned {len(usage['metrics'])} metrics")

    # 10-14: External API v1 (API key auth)
    async with httpx.AsyncClient(base_url=BASE, headers={"X-API-Key": api_key}) as ext:
        # 10. List tables via API v1
        print("[10] API v1: List tables")
        r = await ext.get("/api/v1/tables")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print(f"    ✅ Found {len(r.json())} table(s) via API")

        # 11. Create records
        print("[11] API v1: Create records")
        record_ids = []
        for task_name in ["Buy milk", "Write docs", "Deploy app"]:
            r = await ext.post("/api/v1/todos", json={"task": task_name, "done": False, "priority": 1})
            assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
            record_ids.append(r.json()["id"])
            print(f"    ✅ Created: {task_name} (id={r.json()['id']})")

        # 12. List records
        print("[12] API v1: List records")
        r = await ext.get("/api/v1/todos")
        assert r.status_code == 200
        body = r.json()
        assert body["meta"]["total"] == 3
        print(f"    ✅ Listed {body['meta']['total']} records")

        # 13. Get single record
        print("[13] API v1: Get single record")
        r = await ext.get(f"/api/v1/todos/{record_ids[0]}")
        assert r.status_code == 200
        print(f"    ✅ Got record: task='{r.json()['task']}'")

        # 14. Update record
        print("[14] API v1: Update record (mark done)")
        r = await ext.patch(f"/api/v1/todos/{record_ids[0]}", json={"done": True})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        assert r.json()["done"] == True
        print(f"    ✅ Updated: done={r.json()['done']}")

        # 15. Delete record
        print("[15] API v1: Delete record")
        r = await ext.delete(f"/api/v1/todos/{record_ids[2]}")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print(f"    ✅ Deleted record {record_ids[2]}")

        # 16. Verify deletion
        print("[16] API v1: Verify deletion")
        r = await ext.get("/api/v1/todos")
        assert r.json()["meta"]["total"] == 2
        print(f"    ✅ Now {r.json()['meta']['total']} records remaining")

    print("\n" + "="*60)
    print("🎉 ALL 16 TESTS PASSED — BACKENDLY IS FULLY FUNCTIONAL!")
    print("="*60)

asyncio.run(run())
