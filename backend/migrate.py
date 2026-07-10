import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

async def migrate():
    pg_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:backendly2026@localhost:3000/postgres')
    conn = await asyncpg.connect(pg_url)

    # Drop all tables in reverse dependency order so we can recreate with correct schema
    print("Dropping old tables...")
    await conn.execute("""
        DROP TABLE IF EXISTS end_user_sessions CASCADE;
        DROP TABLE IF EXISTS end_users CASCADE;
        DROP TABLE IF EXISTS request_logs CASCADE;
        DROP TABLE IF EXISTS api_keys CASCADE;
        DROP TABLE IF EXISTS project_records CASCADE;
        DROP TABLE IF EXISTS project_tables CASCADE;
        DROP TABLE IF EXISTS team_invites CASCADE;
        DROP TABLE IF EXISTS password_resets CASCADE;
        DROP TABLE IF EXISTS user_sessions CASCADE;
        DROP TABLE IF EXISTS projects CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS status_checks CASCADE;
        DROP TABLE IF EXISTS contact_messages CASCADE;
        DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
    """)
    print("Old tables dropped.")

    # Now run the new schema
    schema_path = Path(__file__).parent / "schema.sql"
    with open(schema_path, "r") as f:
        schema_sql = f.read()

    print("Creating tables with fixed schema...")
    await conn.execute(schema_sql)
    print("Done! All tables recreated with correct column names.")

    # Verify
    rows = await conn.fetch("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
    print(f"\nTables in database ({len(rows)}):")
    for row in rows:
        print(f"  - {row['tablename']}")

    await conn.close()

asyncio.run(migrate())
