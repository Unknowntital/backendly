from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
import bcrypt
import httpx
import secrets
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Backendly API")
api_router = APIRouter(prefix="/api")

SESSION_DAYS = 7
COOKIE_NAME = "session_token"


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
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        secure=True,
        samesite="none",
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


# ---------------- Auth: Emergent Google ----------------
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session", response_model=User)
async def emergent_session(payload: GoogleSessionPayload, response: Response):
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google session.")
    data = r.json()
    email = data["email"]
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    _set_session_cookie(response, session_token)
    return User(user_id=user_id, email=email, name=name, picture=picture, auth_provider="google")


@api_router.get("/auth/me", response_model=User)
async def me(user: User = Depends(current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(default=None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(COOKIE_NAME, path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------- Projects (dashboard) ----------------
@api_router.get("/projects", response_model=List[Project])
async def list_projects(user: User = Depends(current_user)):
    docs = await db.projects.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


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


# ---------------- Usage ----------------
class UsageMetric(BaseModel):
    label: str
    value: int
    limit: Optional[int] = None
    unit: str
    series: List[int]


class UsageResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    metrics: List[UsageMetric]


def _seed_series(seed: int, length: int, base: int, spread: int) -> List[int]:
    # Deterministic pseudo-random series so users see consistent numbers
    import random
    rnd = random.Random(seed)
    return [max(0, int(base + rnd.gauss(0, spread))) for _ in range(length)]


@api_router.get("/usage", response_model=UsageResponse)
async def get_usage(user: User = Depends(current_user)):
    now = datetime.now(timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    project_count = await db.projects.count_documents({"user_id": user.user_id})
    seed_base = sum(ord(c) for c in user.user_id) + project_count

    api_series = _seed_series(seed_base + 1, 30, 4200, 1200)
    db_series = _seed_series(seed_base + 2, 30, 320, 90)
    fn_series = _seed_series(seed_base + 3, 30, 180, 60)
    bw_series = _seed_series(seed_base + 4, 30, 45, 15)

    metrics = [
        UsageMetric(label="API requests", value=sum(api_series), limit=1_000_000, unit="req", series=api_series),
        UsageMetric(label="Database rows read", value=sum(db_series) * 100, limit=50_000_000, unit="rows", series=db_series),
        UsageMetric(label="Function invocations", value=sum(fn_series), limit=200_000, unit="calls", series=fn_series),
        UsageMetric(label="Bandwidth", value=sum(bw_series), limit=2_500, unit="GB", series=bw_series),
    ]
    return UsageResponse(period_start=start, period_end=now, metrics=metrics)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
