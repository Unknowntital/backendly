from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Cookie, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncpg
from pg_motor_adapter import Database
import os
import logging
import re
import hashlib
import uuid
import bcrypt
import httpx
import secrets
import smtplib
import asyncio
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any, Dict

# Configure logging early so it's available everywhere
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

db = None
pool = None

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

db_lock = None

def get_limiter_key(request: Request):
    if hasattr(request.state, "end_user_id") and request.state.end_user_id:
        return f"eu_{request.state.end_user_id}"
    if hasattr(request.state, "api_key_id") and request.state.api_key_id:
        return f"ak_{request.state.api_key_id}"
    return get_remote_address(request)

redis_url = os.environ.get("REDIS_URL")
if redis_url:
    limiter = Limiter(key_func=get_limiter_key, storage_uri=redis_url)
else:
    limiter = Limiter(key_func=get_limiter_key)

app = FastAPI(title="Backendly API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.middleware("http")
async def init_db_middleware(request: Request, call_next):
    global db, pool, db_lock
    if db is None:
        if db_lock is None:
            db_lock = asyncio.Lock()
        async with db_lock:
            if db is None:
                pg_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:backendly2026@localhost:3000/postgres')
                pool = await asyncpg.create_pool(pg_url)
                db = Database(pool)
    return await call_next(request)

api_router = APIRouter(prefix="/api")

SESSION_DAYS = 7
COOKIE_NAME = "session_token"
RESET_TOKEN_MINUTES = 30

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")


# ---------------- Models ----------------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=120)
    subject: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=4000)


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    company: Optional[str] = None
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewsletterCreate(BaseModel):
    email: EmailStr


class NewsletterSubscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: str


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionPayload(BaseModel):
    session_id: str


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    token: str = Field(min_length=16, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    region: Optional[str] = Field(default="us-east-1", max_length=32)


class Project(BaseModel):
    project_id: str
    user_id: str
    name: str
    region: str
    created_at: datetime


class TeamInviteCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="member")


class TeamMember(BaseModel):
    member_id: str
    email: str
    name: str
    role: str
    status: str  # 'active' | 'invited'
    joined_at: datetime


# ---------------- Auth helpers ----------------
def _mint_session_token() -> str:
    return secrets.token_urlsafe(48)


def _send_email_sync(to_email: str, subject: str, html: str, text: str) -> None:
    gmail_user = os.environ["GMAIL_USER"]
    gmail_pw = os.environ["GMAIL_APP_PASSWORD"].replace(" ", "")
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Backendly <{gmail_user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
        smtp.login(gmail_user, gmail_pw)
        smtp.sendmail(gmail_user, [to_email], msg.as_string())


async def send_email(to_email: str, subject: str, html: str, text: str) -> None:
    await asyncio.to_thread(_send_email_sync, to_email, subject, html, text)


async def _create_session(user_id: str) -> str:
    token = _mint_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return token


def _set_session_cookie(response: Response, token: str) -> None:
    # Use secure=False and samesite=lax for localhost dev (no HTTPS)
    # In production behind HTTPS, set secure=True and samesite=none
    is_prod = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        path="/",
    )


async def _get_user_from_token(token: str) -> Optional[User]:
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        return None
    return User(**user_doc)


async def current_user(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> User:
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await _get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return user


# ---------------- Health / legacy ----------------
@api_router.get("/")
async def root():
    return {"service": "Backendly API", "status": "ok"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check.get('timestamp'), str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ---------------- Contact / Newsletter ----------------
@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact_message(payload: ContactMessageCreate):
    msg = ContactMessage(**payload.model_dump())
    doc = msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    return msg


@api_router.get("/contact", response_model=List[ContactMessage])
async def list_contact_messages():
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for m in messages:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return messages


@api_router.post("/newsletter", response_model=NewsletterSubscriber, status_code=201)
async def subscribe_newsletter(payload: NewsletterCreate):
    existing = await db.newsletter_subscribers.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="This email is already subscribed.")
    sub = NewsletterSubscriber(email=payload.email)
    doc = sub.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.newsletter_subscribers.insert_one(doc)
    return sub


# ---------------- Auth: email + password ----------------
@api_router.post("/auth/register", response_model=User, status_code=201)
async def register(payload: RegisterPayload, response: Response):
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    pw_hash = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()
    now = datetime.now(timezone.utc).isoformat()
    await db.users.insert_one({
        "user_id": user_id,
        "email": payload.email,
        "name": payload.name,
        "picture": None,
        "auth_provider": "password",
        "password_hash": pw_hash,
        "created_at": now,
    })
    token = await _create_session(user_id)
    _set_session_cookie(response, token)
    return User(user_id=user_id, email=payload.email, name=payload.name, picture=None, auth_provider="password")


@api_router.post("/auth/login", response_model=User)
async def login(payload: LoginPayload, response: Response):
    doc = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if not doc or not doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not bcrypt.checkpw(payload.password.encode(), doc["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = await _create_session(doc["user_id"])
    _set_session_cookie(response, token)
    return User(
        user_id=doc["user_id"],
        email=doc["email"],
        name=doc["name"],
        picture=doc.get("picture"),
        auth_provider=doc.get("auth_provider", "password"),
    )


# ---------------- Auth: Google ----------------
@app.get("/api/auth/google/login")
async def google_login(redirect: str = "/dashboard"):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")
    
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        "response_type=code&"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={urllib.parse.quote(GOOGLE_REDIRECT_URI)}&"
        "scope=openid%20email%20profile&"
        f"state={urllib.parse.quote(redirect)}&"
        "access_type=offline&"
        "prompt=consent"
    )
    return RedirectResponse(auth_url)

@app.get("/api/auth/google/callback")
async def google_callback(code: str, state: str = "/dashboard"):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Credentials not configured")
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange token with Google")
            
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")
            
        user_info = user_res.json()
        
    email = user_info.get("email")
    name = user_info.get("name", email.split('@')[0])
    picture = user_info.get("picture", "")
    
    existing = await db.users.find_one({"email": email})
    
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = str(uuid.uuid4())
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "auth_provider": "google",
            "password_hash": ""
        })
        
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    # Redirect back to frontend with the session_token in the hash so AuthCallback can pick it up
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3001")
    if state.startswith("http"):
        final_url = f"{state}#session_id={session_token}"
    else:
        redirect_url = state if state.startswith("/") else f"/{state}"
        final_url = f"{frontend_url}{redirect_url}#session_id={session_token}"
    return RedirectResponse(final_url)


class SessionRequest(BaseModel):
    session_id: str

@api_router.post("/auth/session", response_model=User)
async def validate_session(req: SessionRequest, response: Response):
    session = await db.user_sessions.find_one({"session_token": req.session_id})
    
    # Need to handle timezone-aware vs naive depending on how it's stored in asyncpg JSONB
    # Usually it's stored as string if JSONB, so let's check format
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    user = await db.users.find_one({"user_id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    _set_session_cookie(response, req.session_id)
    return User(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        auth_provider=user.get("auth_provider", "google")
    )


@api_router.get("/auth/me", response_model=User)
async def me(user: User = Depends(current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(default=None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(COOKIE_NAME, path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------- Password reset ----------------
def _reset_email_html(name: str, reset_url: str) -> str:
    return f"""
<!doctype html>
<html>
<body style="margin:0;background:#08090C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#08090C;padding:40px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="480" style="background:#0A0C10;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
        <tr><td>
          <div style="font-family:'JetBrains Mono',monospace;color:#2DD4BF;font-weight:700;font-size:18px;">{{}} Backendly</div>
          <h1 style="color:#ffffff;font-size:24px;margin:24px 0 8px 0;letter-spacing:-0.02em;">Reset your password</h1>
          <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px 0;">Hi {name}, we received a request to reset the password on your Backendly account. Click the button below to choose a new one. The link is good for 30 minutes.</p>
          <a href="{reset_url}" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">Reset password</a>
          <p style="color:#71717a;font-size:13px;line-height:1.6;margin:32px 0 0 0;">Or copy this URL into your browser:<br><span style="color:#2DD4BF;word-break:break-all;">{reset_url}</span></p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;">
          <p style="color:#52525b;font-size:12px;line-height:1.6;margin:0;">Didn't ask for this? You can safely ignore this email — the link will expire on its own.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _reset_email_text(name: str, reset_url: str) -> str:
    return (
        f"Hi {name},\n\n"
        f"We received a request to reset the password on your Backendly account. "
        f"Open this link within the next 30 minutes to choose a new password:\n\n"
        f"{reset_url}\n\n"
        f"Didn't ask for this? You can safely ignore this email.\n\n— Backendly"
    )


@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordPayload):
    # Always respond OK to avoid leaking whether the email exists
    user = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_MINUTES)
        await db.password_resets.insert_one({
            "reset_token": token,
            "user_id": user["user_id"],
            "email": user["email"],
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        reset_url = f"{os.environ['FRONTEND_URL'].rstrip('/')}/reset-password?token={token}"
        try:
            await send_email(
                to_email=user["email"],
                subject="Reset your Backendly password",
                html=_reset_email_html(user.get("name") or "there", reset_url),
                text=_reset_email_text(user.get("name") or "there", reset_url),
            )
        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")
            # Still return 200 so we don't leak errors that hint the email exists
    return {"ok": True, "message": "If an account exists for that email, a reset link has been sent."}


@api_router.post("/auth/reset-password", response_model=User)
async def reset_password(payload: ResetPasswordPayload, response: Response):
    doc = await db.password_resets.find_one({"reset_token": payload.token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
    if doc.get("used"):
        raise HTTPException(status_code=400, detail="This reset link has already been used.")
    expires_at = doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired. Request a new one.")

    user_doc = await db.users.find_one({"user_id": doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid reset link.")

    new_hash = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"password_hash": new_hash}})
    await db.password_resets.update_one({"reset_token": payload.token}, {"$set": {"used": True}})
    # Invalidate all existing sessions for this user for safety
    await db.user_sessions.delete_many({"user_id": doc["user_id"]})

    # Log the user in with a fresh session
    token = await _create_session(doc["user_id"])
    _set_session_cookie(response, token)
    return User(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        picture=user_doc.get("picture"),
        auth_provider=user_doc.get("auth_provider", "password"),
    )


# ---------------- Projects (dashboard) ----------------
@api_router.get("/projects", response_model=List[Project])
async def list_projects(user: User = Depends(current_user)):
    docs = await db.projects.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, user: User = Depends(current_user)):
    d = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Project not found.")
    if isinstance(d.get("created_at"), str):
        d["created_at"] = datetime.fromisoformat(d["created_at"])
    return d


@api_router.post("/projects", response_model=Project, status_code=201)
async def create_project(payload: ProjectCreate, user: User = Depends(current_user)):
    project_id = f"prj_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    doc = {
        "project_id": project_id,
        "user_id": user.user_id,
        "name": payload.name,
        "region": payload.region or "us-east-1",
        "created_at": now.isoformat(),
    }
    await db.projects.insert_one(doc)
    return Project(project_id=project_id, user_id=user.user_id, name=payload.name, region=doc["region"], created_at=now)


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(current_user)):
    res = await db.projects.delete_one({"project_id": project_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found.")
    # Cascade delete: clean up all related data
    try:
        await db.project_tables.delete_many({"project_id": project_id})
        await db.project_records.delete_many({"project_id": project_id})
        await db.api_keys.delete_many({"project_id": project_id})
        await db.end_users.delete_many({"project_id": project_id})
        await db.end_user_sessions.delete_many({"project_id": project_id})
        await db.request_logs.delete_many({"project_id": project_id})
        await db.team_invites.delete_many({"owner_id": user.user_id})
    except Exception as e:
        logger.error(f"Cascade delete failed for project {project_id}: {e}")
    return {"ok": True}


# ---------------- Team ----------------
VALID_ROLES = {"owner", "admin", "member"}


@api_router.get("/team/members", response_model=List[TeamMember])
async def list_team(user: User = Depends(current_user)):
    # Owner (current user) is always the first member
    owner = TeamMember(
        member_id=user.user_id,
        email=user.email,
        name=user.name,
        role="owner",
        status="active",
        joined_at=datetime.now(timezone.utc),
    )
    docs = await db.team_invites.find({"owner_id": user.user_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    members = [owner]
    for d in docs:
        joined = d.get("created_at")
        if isinstance(joined, str):
            joined = datetime.fromisoformat(joined)
        members.append(TeamMember(
            member_id=d["invite_id"],
            email=d["email"],
            name=d.get("name") or d["email"].split("@")[0],
            role=d.get("role", "member"),
            status=d.get("status", "invited"),
            joined_at=joined,
        ))
    return members


@api_router.post("/team/invite", response_model=TeamMember, status_code=201)
async def invite_team_member(payload: TeamInviteCreate, user: User = Depends(current_user)):
    role = payload.role if payload.role in VALID_ROLES and payload.role != "owner" else "member"
    if payload.email == user.email:
        raise HTTPException(status_code=400, detail="You can't invite yourself.")
    existing = await db.team_invites.find_one({"owner_id": user.user_id, "email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="This email is already invited.")
    invite_id = f"tm_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    doc = {
        "invite_id": invite_id,
        "owner_id": user.user_id,
        "email": payload.email,
        "name": payload.email.split("@")[0],
        "role": role,
        "status": "invited",
        "created_at": now.isoformat(),
    }
    await db.team_invites.insert_one(doc)
    return TeamMember(
        member_id=invite_id,
        email=payload.email,
        name=doc["name"],
        role=role,
        status="invited",
        joined_at=now,
    )


@api_router.delete("/team/members/{member_id}")
async def remove_team_member(member_id: str, user: User = Depends(current_user)):
    if member_id == user.user_id:
        raise HTTPException(status_code=400, detail="You can't remove the owner.")
    res = await db.team_invites.delete_one({"invite_id": member_id, "owner_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found.")
    return {"ok": True}


# ---------------- Usage (real, metered) ----------------
class UsageMetric(BaseModel):
    label: str
    value: float
    limit: Optional[int] = None
    unit: str
    series: List[int]


class UsageResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    metrics: List[UsageMetric]


async def _project_ids_for_user(user_id: str, project_id: Optional[str] = None) -> List[str]:
    q = {"user_id": user_id}
    if project_id:
        q["project_id"] = project_id
    docs = await db.projects.find(q, {"_id": 0, "project_id": 1}).to_list(500)
    return [d["project_id"] for d in docs]


async def _usage_for_projects(project_ids: List[str]) -> UsageResponse:
    now = datetime.now(timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    api_days = [0] * 30
    read_days = [0] * 30
    write_days = [0] * 30
    total_requests = 0
    total_reads = 0
    total_writes = 0
    total_bandwidth_bytes = 0

    if project_ids:
        cur = db.request_logs.find(
            {"project_id": {"$in": project_ids}, "created_at": {"$gte": start.isoformat()}},
            {"_id": 0, "method": 1, "status": 1, "created_at": 1, "bytes": 1},
        )
        async for d in cur:
            ts = d.get("created_at")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            day = (ts - start).days
            if 0 <= day < 30:
                api_days[day] += 1
                if d.get("method") in ("POST", "PATCH", "PUT", "DELETE"):
                    write_days[day] += 1
                    total_writes += 1
                else:
                    read_days[day] += 1
                    total_reads += 1
                total_requests += 1
                total_bandwidth_bytes += int(d.get("bytes") or 0)

    # Records currently stored (all-time)
    row_count = 0
    if project_ids:
        row_count = await db.project_records.count_documents({"project_id": {"$in": project_ids}})

    bandwidth_gb = total_bandwidth_bytes / (1024 * 1024 * 1024)

    metrics = [
        UsageMetric(label="API requests", value=total_requests, limit=1_000_000, unit="req", series=api_days),
        UsageMetric(label="Rows stored", value=row_count, limit=500_000, unit="rows", series=read_days),
        UsageMetric(label="Write operations", value=total_writes, limit=200_000, unit="ops", series=write_days),
        UsageMetric(label="Bandwidth", value=round(bandwidth_gb, 3), limit=100, unit="GB", series=api_days),
    ]
    return UsageResponse(period_start=start, period_end=now, metrics=metrics)


@api_router.get("/usage", response_model=UsageResponse)
async def get_usage(user: User = Depends(current_user)):
    project_ids = await _project_ids_for_user(user.user_id)
    return await _usage_for_projects(project_ids)


@api_router.get("/projects/{project_id}/usage", response_model=UsageResponse)
async def get_project_usage(project_id: str, user: User = Depends(current_user)):
    ids = await _project_ids_for_user(user.user_id, project_id)
    if not ids:
        raise HTTPException(status_code=404, detail="Project not found.")
    return await _usage_for_projects(ids)


# ==================================================================
# Tables & API keys (dashboard) + API v1 record CRUD (external)
# Multi-tenant isolation:
#   Every project_tables / project_records / api_keys / request_logs
#   document has a project_id. Every read/write MUST filter by it.
# ==================================================================

FIELD_TYPES = {"string", "integer", "float", "boolean", "datetime", "json"}
SLUG_RE = re.compile(r"^[a-z][a-z0-9_]{0,39}$")


class SchemaField(BaseModel):
    name: str
    type: str
    required: bool = False
    default: Optional[Any] = None


class TableCreate(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    fields: List[SchemaField]


class TableModel(BaseModel):
    table_id: str
    project_id: str
    name: str
    fields: List[SchemaField]
    created_at: datetime


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)


class ApiKeyPublic(BaseModel):
    key_id: str
    project_id: str
    name: str
    prefix: str
    last4: str
    last_used_at: Optional[datetime] = None
    created_at: datetime


class ApiKeyCreated(ApiKeyPublic):
    key: str  # full plaintext, returned ONCE


async def _owned_project(project_id: str, user: User) -> Dict[str, Any]:
    p = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    return p


def _validate_slug(name: str, kind: str = "identifier") -> str:
    n = name.strip().lower()
    if not SLUG_RE.match(n):
        raise HTTPException(status_code=400, detail=f"Invalid {kind}. Use lowercase letters, digits, underscores, starting with a letter (max 40 chars).")
    return n


def _validate_fields(fields: List[SchemaField]) -> List[SchemaField]:
    if not fields:
        raise HTTPException(status_code=400, detail="A table needs at least one field.")
    seen = set()
    out: List[SchemaField] = []
    for f in fields:
        n = _validate_slug(f.name, "field name")
        if n in seen:
            raise HTTPException(status_code=400, detail=f"Duplicate field: {n}")
        if f.type not in FIELD_TYPES:
            raise HTTPException(status_code=400, detail=f"Unknown field type: {f.type}")
        seen.add(n)
        out.append(SchemaField(name=n, type=f.type, required=f.required, default=f.default))
    return out


# --------- Tables (dashboard, session-authed) ---------
@api_router.get("/projects/{project_id}/tables", response_model=List[TableModel])
async def list_tables(project_id: str, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    docs = await db.project_tables.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.post("/projects/{project_id}/tables", response_model=TableModel, status_code=201)
async def create_table(project_id: str, payload: TableCreate, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    name = _validate_slug(payload.name, "table name")
    fields = _validate_fields(payload.fields)
    if await db.project_tables.find_one({"project_id": project_id, "name": name}):
        raise HTTPException(status_code=409, detail=f"A table named '{name}' already exists in this project.")
    table_id = f"tbl_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    doc = {
        "table_id": table_id,
        "project_id": project_id,
        "name": name,
        "fields": [f.model_dump() for f in fields],
        "created_at": now.isoformat(),
    }
    await db.project_tables.insert_one(doc)
    return TableModel(table_id=table_id, project_id=project_id, name=name, fields=fields, created_at=now)


@api_router.delete("/projects/{project_id}/tables/{table_id}")
async def delete_table(project_id: str, table_id: str, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    res = await db.project_tables.delete_one({"project_id": project_id, "table_id": table_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found.")
    # Cascade: delete all records in that table (still scoped by project_id for safety)
    await db.project_records.delete_many({"project_id": project_id, "table_id": table_id})
    return {"ok": True}


# --------- API keys (dashboard) ---------
def _mint_api_key() -> Dict[str, str]:
    # Format: bkl_live_<32 url-safe chars>
    secret = secrets.token_urlsafe(24).replace("_", "").replace("-", "")[:24]
    full = f"bkl_live_{secret}"
    key_hash = hashlib.sha256(full.encode()).hexdigest()
    return {
        "key": full,
        "prefix": f"bkl_live_{secret[:4]}",
        "last4": secret[-4:],
        "key_hash": key_hash,
    }


@api_router.get("/projects/{project_id}/api-keys", response_model=List[ApiKeyPublic])
async def list_api_keys(project_id: str, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    docs = await db.api_keys.find({"project_id": project_id}, {"_id": 0, "key_hash": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        for f in ("created_at", "last_used_at"):
            if isinstance(d.get(f), str):
                d[f] = datetime.fromisoformat(d[f])
    return docs


@api_router.post("/projects/{project_id}/api-keys", response_model=ApiKeyCreated, status_code=201)
async def create_api_key(project_id: str, payload: ApiKeyCreate, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    minted = _mint_api_key()
    key_id = f"key_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    doc = {
        "key_id": key_id,
        "project_id": project_id,
        "name": payload.name,
        "prefix": minted["prefix"],
        "last4": minted["last4"],
        "key_hash": minted["key_hash"],
        "last_used_at": None,
        "created_at": now.isoformat(),
    }
    await db.api_keys.insert_one(doc)
    return ApiKeyCreated(
        key_id=key_id, project_id=project_id, name=payload.name,
        prefix=minted["prefix"], last4=minted["last4"],
        last_used_at=None, created_at=now, key=minted["key"],
    )


@api_router.delete("/projects/{project_id}/api-keys/{key_id}")
async def revoke_api_key(project_id: str, key_id: str, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    res = await db.api_keys.delete_one({"project_id": project_id, "key_id": key_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found.")
    return {"ok": True}


# --------- API v1: external record CRUD (API-key authed) ---------
api_v1 = APIRouter(prefix="/api/v1")


async def api_key_project(
    request: Request,
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> str:
    key = x_api_key
    if not key and authorization and authorization.lower().startswith("bearer "):
        key = authorization.split(" ", 1)[1].strip()
    if not key:
        raise HTTPException(status_code=401, detail="Missing Authentication.")
        
    if key.startswith("bkl_"):
        # Developer API Key
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        doc = await db.api_keys.find_one({"key_hash": key_hash}, {"_id": 0, "project_id": 1, "key_id": 1})
        if not doc:
            raise HTTPException(status_code=401, detail="Invalid API key.")
        request.state.project_id = doc["project_id"]
        request.state.api_key_id = doc["key_id"]
        request.state.end_user_id = None
        
        async def _touch():
            try:
                await db.api_keys.update_one(
                    {"key_id": doc["key_id"]},
                    {"$set": {"last_used_at": datetime.now(timezone.utc).isoformat()}},
                )
            except Exception:
                pass
        asyncio.create_task(_touch())
        return doc["project_id"]
    else:
        # End-User Token
        sess = await db.end_user_sessions.find_one({"token": key}, {"_id": 0})
        if not sess:
            raise HTTPException(status_code=401, detail="Invalid or expired user token.")
        expires_at = sess["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=401, detail="Invalid or expired user token.")
            
        request.state.project_id = sess["project_id"]
        request.state.api_key_id = None
        request.state.end_user_id = sess["end_user_id"]
        return sess["project_id"]


def _coerce(value: Any, ftype: str) -> Any:
    if value is None:
        return None
    try:
        if ftype == "string":
            return str(value)
        if ftype == "integer":
            return int(value)
        if ftype == "float":
            return float(value)
        if ftype == "boolean":
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                return value.lower() in ("true", "1", "yes")
            return bool(value)
        if ftype == "datetime":
            if isinstance(value, str):
                # accept ISO strings
                datetime.fromisoformat(value.replace("Z", "+00:00"))
                return value
            return str(value)
        if ftype == "json":
            return value
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"Value for a {ftype} field is not valid.")
    return value


def _validate_payload(fields: List[Dict[str, Any]], payload: Dict[str, Any], partial: bool = False) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object.")
    allowed = {f["name"] for f in fields}
    unknown = set(payload.keys()) - allowed
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown field(s): {', '.join(sorted(unknown))}")
    out: Dict[str, Any] = {}
    for f in fields:
        name = f["name"]
        if name in payload:
            out[name] = _coerce(payload[name], f["type"])
        elif not partial:
            if f.get("required"):
                if f.get("default") is not None:
                    out[name] = _coerce(f["default"], f["type"])
                else:
                    raise HTTPException(status_code=400, detail=f"Missing required field: {name}")
            elif f.get("default") is not None:
                out[name] = _coerce(f["default"], f["type"])
    return out


def _envelope(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc["record_id"],
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        **doc.get("data", {}),
    }


async def _get_table(project_id: str, table_name: str) -> Dict[str, Any]:
    table = await db.project_tables.find_one({"project_id": project_id, "name": table_name}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")
    return table


@api_v1.get("/tables")
@limiter.limit("100/minute")
async def api_v1_list_tables(request: Request, project_id: str = Depends(api_key_project)):
    docs = await db.project_tables.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return [{"name": d["name"], "fields": d["fields"]} for d in docs]


@api_v1.get("/{table_name}")
@limiter.limit("100/minute")
async def api_v1_list_records(
    request: Request,
    table_name: str,
    limit: int = 50,
    offset: int = 0,
    project_id: str = Depends(api_key_project),
):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    table = await _get_table(project_id, table_name)
    q = {"project_id": project_id, "table_id": table["table_id"]}
    if getattr(request.state, "end_user_id", None):
        q["data.end_user_id"] = request.state.end_user_id
    total = await db.project_records.count_documents(q)
    cur = db.project_records.find(q, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    return {
        "data": [_envelope(d) async for d in cur],
        "meta": {"total": total, "limit": limit, "offset": offset},
    }


@api_v1.post("/{table_name}", status_code=201)
@limiter.limit("100/minute")
async def api_v1_create_record(
    request: Request,
    table_name: str,
    payload: Dict[str, Any],
    project_id: str = Depends(api_key_project),
):
    table = await _get_table(project_id, table_name)
    if getattr(request.state, "end_user_id", None):
        payload["end_user_id"] = request.state.end_user_id
    data = _validate_payload(table["fields"], payload)
    record_id = f"rec_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "record_id": record_id,
        "project_id": project_id,
        "table_id": table["table_id"],
        "data": data,
        "created_at": now,
        "updated_at": now,
    }
    await db.project_records.insert_one(doc)
    return _envelope(doc)


@api_v1.get("/{table_name}/{record_id}")
@limiter.limit("100/minute")
async def api_v1_get_record(
    request: Request, table_name: str, record_id: str, project_id: str = Depends(api_key_project),
):
    table = await _get_table(project_id, table_name)
    q = {"project_id": project_id, "table_id": table["table_id"], "record_id": record_id}
    if getattr(request.state, "end_user_id", None):
        q["data.end_user_id"] = request.state.end_user_id
    doc = await db.project_records.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found.")
    return _envelope(doc)


@api_v1.patch("/{table_name}/{record_id}")
@limiter.limit("100/minute")
async def api_v1_update_record(
    request: Request,
    table_name: str,
    record_id: str,
    payload: Dict[str, Any],
    project_id: str = Depends(api_key_project),
):
    table = await _get_table(project_id, table_name)
    q = {"project_id": project_id, "table_id": table["table_id"], "record_id": record_id}
    if getattr(request.state, "end_user_id", None):
        q["data.end_user_id"] = request.state.end_user_id
        # Prevent end-user from changing their end_user_id
        if "end_user_id" in payload:
            payload["end_user_id"] = request.state.end_user_id
            
    data = _validate_payload(table["fields"], payload, partial=True)
    if not data:
        raise HTTPException(status_code=400, detail="No valid fields to update.")
    now = datetime.now(timezone.utc).isoformat()
    set_fields = {f"data.{k}": v for k, v in data.items()}
    set_fields["updated_at"] = now
    res = await db.project_records.update_one(q, {"$set": set_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Record not found.")
    doc = await db.project_records.find_one(q, {"_id": 0})
    return _envelope(doc)


@api_v1.delete("/{table_name}/{record_id}")
@limiter.limit("100/minute")
async def api_v1_delete_record(
    request: Request, table_name: str, record_id: str, project_id: str = Depends(api_key_project),
):
    table = await _get_table(project_id, table_name)
    q = {"project_id": project_id, "table_id": table["table_id"], "record_id": record_id}
    if getattr(request.state, "end_user_id", None):
        q["data.end_user_id"] = request.state.end_user_id
    res = await db.project_records.delete_one(q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found.")
    return {"ok": True}


# ==================================================================
# Auth-as-a-Service: end-user auth scoped by project
# ==================================================================
END_USER_SESSION_DAYS = 30
auth_v1 = APIRouter(prefix="/api/v1/auth")


class EndUserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = Field(default=None, max_length=80)
    metadata: Optional[Dict[str, Any]] = None


class EndUserLogin(BaseModel):
    email: EmailStr
    password: str


class EndUserPublic(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class EndUserAuthResponse(BaseModel):
    user: EndUserPublic
    token: str
    expires_at: datetime


async def _end_user_token_project(request: Request,
                                  x_api_key: Optional[str] = Header(default=None),
                                  authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    """Requires BOTH X-API-Key (project scope) AND Bearer token (end user)."""
    project_id = await api_key_project(request, x_api_key=x_api_key, authorization=None)
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <user_token>.")
    token = authorization.split(" ", 1)[1].strip()
    sess = await db.end_user_sessions.find_one({"token": token, "project_id": project_id}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid or expired user token.")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    end_user = await db.end_users.find_one({"project_id": project_id, "end_user_id": sess["end_user_id"]},
                                           {"_id": 0, "password_hash": 0})
    if not end_user:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return {"project_id": project_id, "end_user": end_user, "token": token}


def _end_user_envelope(doc: Dict[str, Any]) -> EndUserPublic:
    created = doc.get("created_at")
    if isinstance(created, str):
        created = datetime.fromisoformat(created)
    return EndUserPublic(
        id=doc["end_user_id"],
        email=doc["email"],
        name=doc.get("name"),
        metadata=doc.get("metadata"),
        created_at=created or datetime.now(timezone.utc),
    )


async def _create_end_user_session(project_id: str, end_user_id: str) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(40)
    expires_at = datetime.now(timezone.utc) + timedelta(days=END_USER_SESSION_DAYS)
    await db.end_user_sessions.insert_one({
        "token": token,
        "project_id": project_id,
        "end_user_id": end_user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return token, expires_at


@auth_v1.post("/signup", response_model=EndUserAuthResponse, status_code=201)
@limiter.limit("10/minute")
async def end_user_signup(request: Request, payload: EndUserSignup, project_id: str = Depends(api_key_project)):
    existing = await db.end_users.find_one({"project_id": project_id, "email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    end_user_id = f"eu_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "end_user_id": end_user_id,
        "project_id": project_id,
        "email": payload.email,
        "name": payload.name or payload.email.split("@")[0],
        "password_hash": bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode(),
        "metadata": payload.metadata or {},
        "email_verified": False,
        "created_at": now,
    }
    await db.end_users.insert_one(doc)
    token, expires_at = await _create_end_user_session(project_id, end_user_id)
    return EndUserAuthResponse(user=_end_user_envelope(doc), token=token, expires_at=expires_at)


@auth_v1.post("/login", response_model=EndUserAuthResponse)
@limiter.limit("10/minute")
async def end_user_login(request: Request, payload: EndUserLogin, project_id: str = Depends(api_key_project)):
    doc = await db.end_users.find_one({"project_id": project_id, "email": payload.email}, {"_id": 0})
    if not doc or not bcrypt.checkpw(payload.password.encode(), doc["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token, expires_at = await _create_end_user_session(project_id, doc["end_user_id"])
    return EndUserAuthResponse(user=_end_user_envelope(doc), token=token, expires_at=expires_at)


@auth_v1.get("/me", response_model=EndUserPublic)
@limiter.limit("100/minute")
async def end_user_me(request: Request, ctx: Dict[str, Any] = Depends(_end_user_token_project)):
    return _end_user_envelope(ctx["end_user"])


@auth_v1.post("/logout")
@limiter.limit("100/minute")
async def end_user_logout(request: Request, ctx: Dict[str, Any] = Depends(_end_user_token_project)):
    await db.end_user_sessions.delete_one({"token": ctx["token"]})
    return {"ok": True}


app.include_router(auth_v1)
app.include_router(api_v1)
app.include_router(api_router)

@api_router.get("/projects/{project_id}/end-users", response_model=List[EndUserPublic])
async def list_end_users(project_id: str, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    docs = await db.end_users.find({"project_id": project_id},
                                    {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return [_end_user_envelope(d) for d in docs]


@api_router.delete("/projects/{project_id}/end-users/{end_user_id}")
async def delete_end_user(project_id: str, end_user_id: str, user: User = Depends(current_user)):
    await _owned_project(project_id, user)
    res = await db.end_users.delete_one({"project_id": project_id, "end_user_id": end_user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    await db.end_user_sessions.delete_many({"project_id": project_id, "end_user_id": end_user_id})
    return {"ok": True}


# ---------------- Table templates for beginners ----------------
TABLE_TEMPLATES = {
    "users": {
        "name": "users",
        "description": "Basic user profile table — name, email, bio.",
        "fields": [
            {"name": "email", "type": "string", "required": True},
            {"name": "name", "type": "string", "required": True},
            {"name": "bio", "type": "string"},
            {"name": "avatar_url", "type": "string"},
        ],
    },
    "posts": {
        "name": "posts",
        "description": "Blog posts or a social feed.",
        "fields": [
            {"name": "author", "type": "string", "required": True},
            {"name": "title", "type": "string", "required": True},
            {"name": "body", "type": "string", "required": True},
            {"name": "published", "type": "boolean", "default": False},
            {"name": "tags", "type": "json"},
        ],
    },
    "orders": {
        "name": "orders",
        "description": "E-commerce orders with items and totals.",
        "fields": [
            {"name": "customer_email", "type": "string", "required": True},
            {"name": "total_cents", "type": "integer", "required": True},
            {"name": "status", "type": "string", "default": "pending"},
            {"name": "items", "type": "json"},
        ],
    },
    "todos": {
        "name": "todos",
        "description": "Classic to-do items — task, done flag, due date.",
        "fields": [
            {"name": "task", "type": "string", "required": True},
            {"name": "done", "type": "boolean", "default": False},
            {"name": "due_at", "type": "datetime"},
        ],
    },
}


@api_router.get("/table-templates")
async def list_table_templates(user: User = Depends(current_user)):
    return list(TABLE_TEMPLATES.values())


@app.middleware("http")
async def usage_logger(request: Request, call_next):
    response = await call_next(request)
    try:
        if request.url.path.startswith("/api/v1/"):
            project_id = getattr(request.state, "project_id", None)
            if project_id:
                # measure response length via header if present
                content_length = response.headers.get("content-length")
                bytes_est = int(content_length) if content_length and content_length.isdigit() else 0
                await db.request_logs.insert_one({
                    "id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "api_key_id": getattr(request.state, "api_key_id", None),
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "bytes": bytes_est,
                    "created_at": datetime.now(timezone.utc),
                })
    except Exception as e:
        logger.error(f"usage_logger failed: {e}")
    return response


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# logging is configured at the top of the file


@app.on_event("startup")
async def create_indexes():
    global pool, db
    try:
        pg_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:backendly2026@localhost:3000/postgres')
        pool = await asyncpg.create_pool(pg_url)
        db = Database(pool)
        
        schema_path = ROOT_DIR / "schema.sql"
        if schema_path.exists():
            with open(schema_path, "r") as f:
                await pool.execute(f.read())
    except Exception as e:
        logger.error(f"Postgres init error: {e}")



@app.on_event("shutdown")
async def shutdown_db_client():
    if pool:
        await pool.close()
