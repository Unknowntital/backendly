# Backendly Auth Testing Playbook

Two auth methods coexist:

1. **Emergent Google Auth** (redirects via `https://auth.emergentagent.com`, session_id returned in URL fragment)
2. **JWT-style email/password** (backend routes `/api/auth/register`, `/api/auth/login`)

Both flows produce a `session_token` stored in `user_sessions` collection AND set as an httpOnly cookie (`secure`, `SameSite=None`, path `/`).

## Test User & Session (email/password)
```bash
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.dev@backendly.dev","password":"Passw0rd!","name":"Test Dev"}'
# → returns user + Set-Cookie: session_token=...

curl -X POST "$API_URL/api/auth/login" -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"test.dev@backendly.dev","password":"Passw0rd!"}'

curl "$API_URL/api/auth/me" -b cookies.txt      # → user
curl -X POST "$API_URL/api/auth/logout" -b cookies.txt
```

## Simulated Google Auth session
```bash
mongosh "$MONGO_URL" --eval "
use('test_database');
var userId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email:'g@test.dev', name:'G', auth_provider:'google', created_at: new Date()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now()+7*24*3600e3), created_at: new Date()});
print(sessionToken);
"
```
Then use the token via cookie or `Authorization: Bearer <token>`.

## Playwright cookie injection
```python
await context.add_cookies([{
    "name":"session_token","value":"<token>",
    "domain":"deploy-instant.preview.emergentagent.com",
    "path":"/","httpOnly":True,"secure":True,"sameSite":"None"
}])
```

## Checklist
- [ ] user_sessions.user_id matches users.user_id
- [ ] All queries use `{"_id":0}` projection
- [ ] `GET /api/auth/me` returns 200 with cookie, 401 without
- [ ] `/dashboard` renders (no redirect) when logged in
- [ ] `/dashboard` redirects to `/login` when not logged in
- [ ] Both auth methods can hit `/api/projects` CRUD

## Success Indicators
✅ /api/auth/me → 200 with user data (via cookie OR Bearer)  
✅ Dashboard route renders projects list  
✅ Logout clears cookie and redirects to `/`

## Failure Indicators
❌ 401 on /auth/me despite valid cookie → CORS `allow_credentials` or SameSite issue  
❌ AuthCallback loop → the `session_id` hash detection race condition  
❌ Password login fails → bcrypt salt mismatch (check hashing)
