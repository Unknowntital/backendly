from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncpg
import os
import logging
import re
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any, Dict
import uuid
import bcrypt
import httpx
import secrets
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pg_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/postgres')

app = FastAPI(title="Backendly API")
api_router = APIRouter(prefix="/api")

pool = None

@app.on_event("startup")
async def startup_db():
    global pool
    pool = await asyncpg.create_pool(pg_url)
    # Initialize schema
    schema_path = ROOT_DIR / "schema.sql"
    if schema_path.exists():
        with open(schema_path, "r") as f:
            await pool.execute(f.read())

@app.on_event("shutdown")
async def shutdown_db():
    if pool:
        await pool.close()

SESSION_DAYS = 7
COOKIE_NAME = "session_token"
RESET_TOKEN_MINUTES = 30
