# OctoScore API

Backend for the OctoScore tournament app — a REST API with JWT auth, an admin
content-management layer, and Cloudinary-hosted gallery images with public
download links.

- **Runtime:** Node.js (ESM) + Express 4
- **Database:** MongoDB + Mongoose (Atlas cloud or local Community Server)
- **Auth:** JWT (Bearer tokens) + bcrypt password hashing, `user` / `admin` roles
- **Media:** Cloudinary (uploads + forced-download URLs)
- **Deploy target:** Railway (free tier)

---

## 1. Project structure

```
server/
├── src/
│   ├── index.js            # entry: connect DB + start server
│   ├── app.js              # express app (cors, helmet, routes, errors)
│   ├── config/             # db.js, cloudinary.js
│   ├── models/             # User, Group, Team, Player, Match, Gallery, Quiz, Content
│   ├── middleware/         # auth (protect/admin), error handler, multer upload
│   ├── controllers/        # one per resource
│   ├── routes/             # one per resource + index.js aggregator
│   ├── utils/              # asyncHandler, ApiError, generateToken
│   └── seed/               # seed.js (demo data + admin), seedAdmin.js, data.js
├── .env.example
├── railway.json            # Railway build/deploy + healthcheck
└── package.json
```

---

## 2. Local setup

### a. Install

```bash
cd server
npm install
```

### b. Environment

```bash
cp .env.example .env
```

Then edit `.env` (see the variable reference at the bottom). A quick JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### c. Database — pick one

**Option A — MongoDB Atlas (cloud, nothing to install)**
1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. Database Access → add a user. Network Access → allow your IP (or `0.0.0.0/0`).
3. Connect → *Drivers* → copy the connection string into `MONGO_URI`, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/octoscore`.

**Option B — MongoDB Community Server (local)**
1. Install from <https://www.mongodb.com/try/download/community>.
2. Use `MONGO_URI=mongodb://127.0.0.1:27017/octoscore`.

**Browse your data:** install [MongoDB Compass](https://www.mongodb.com/products/compass)
and paste the same `MONGO_URI` to view/edit collections visually.

### d. Cloudinary (gallery images)

1. Create a free account at <https://cloudinary.com>.
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret** into `.env`.

> The API runs without Cloudinary, but gallery **uploads** will be rejected until
> these are set. Image **downloads** use Cloudinary's `fl_attachment` flag.

### e. Seed demo data + create the admin

```bash
npm run seed
```

Seeds groups, teams, full rosters, matches, gallery, quiz, bracket + rules, and
creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. It's **idempotent** —
safe to re-run. To (re)create just the admin: `npm run seed:admin`.

### f. Run

```bash
npm run dev     # nodemon, http://localhost:5000
npm start       # production mode
```

Health check: `GET http://localhost:5000/health` → `{ "status": "ok" }`.

---

## 3. API reference

Base URL: `/api`. Admin-only routes need an `Authorization: Bearer <token>`
header from an account whose `role` is `admin`.

### Auth
| Method | Path | Access | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | public | `{ name, email, password }` |
| POST | `/api/auth/login` | public | `{ email, password }` |
| GET | `/api/auth/me` | user | — |
| PATCH | `/api/auth/me` | user | `{ name?, avatarUrl?, password? }` |

Signup/login return `{ token, user }`. Store the token and send it as a Bearer header.

### Tournament data
| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/groups`, `/api/groups/:id` | public |
| GET | `/api/teams?group=A`, `/api/teams/:id` (with roster) | public |
| GET | `/api/players?teamId=t1`, `/api/players/top?limit=5`, `/api/players/:id` | public |
| GET | `/api/matches?group=A&status=live`, `/api/matches/:id` | public |
| POST / PUT / DELETE | `/api/{groups,teams,players,matches}/...` | **admin** |
| PATCH | `/api/matches/:id/score` (quick live update) | **admin** |

### Gallery (Cloudinary)
| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/gallery`, `/api/gallery/:id` | public |
| GET | `/api/gallery/:id/download` | public (302 → forced download) |
| POST | `/api/gallery` (multipart, field `image`) | **admin** |
| PUT | `/api/gallery/:id` (optional new `image`) | **admin** |
| DELETE | `/api/gallery/:id` (also deletes the Cloudinary asset) | **admin** |

### Quiz
| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/quiz` (no answer keys) | public |
| POST | `/api/quiz/submit` `{ answers: { qId: optionId } }` | public (awards XP if logged in) |
| GET | `/api/quiz/manage`, POST/PUT/DELETE | **admin** |

### Content singletons
| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/content/:key` (`bracket` / `rules`) | public |
| PUT | `/api/content/:key` `{ data }` | **admin** |

### Quick check with curl

```bash
# login as admin
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@octoscore.app","password":"YOUR_PASSWORD"}'

# upload a gallery memory (admin)
curl -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Opening Night" -F "tag=Ceremony" -F "accent=purple" \
  -F "image=@/path/to/photo.jpg"
```

---

## 4. Roles & the admin

- New signups are always `role: "user"`.
- The admin is created by the seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Only an
  admin can create/update/delete tournament data, manage the gallery, and edit
  the quiz, bracket, and rules.
- To promote another existing account, change its `role` to `admin` in Compass,
  or set the env vars to that email and run `npm run seed:admin`.

---

## 5. Deploy to Railway

1. Push this repo to GitHub.
2. Railway → **New Project → Deploy from GitHub repo**.
3. Settings → **Root Directory:** `server` (so Railway builds only the API).
4. **Variables** → add everything from `.env` (`MONGO_URI`, `JWT_SECRET`,
   `CLOUDINARY_*`, `ADMIN_*`, and `CLIENT_URL` = your Vercel URL).
   - Leave `PORT` unset — Railway injects it; the app reads `process.env.PORT`.
   - Set `NODE_ENV=production`.
5. Deploy. Healthcheck path is `/health` (configured in `railway.json`).
6. One-time seed: open the service **Shell** and run `npm run seed`
   (or run it locally against the same `MONGO_URI`).

Your API URL looks like `https://<project>.up.railway.app`.

---

## 6. Connect the frontend (Vercel)

In the **frontend** project set:

```
VITE_API_URL=https://<project>.up.railway.app
```

And on the **API**, set `CLIENT_URL` to your Vercel origin(s), comma-separated,
so CORS allows the browser:

```
CLIENT_URL=https://octoscore.vercel.app,http://localhost:5173
```

The frontend stores the JWT in `localStorage` and sends it automatically.

---

## 7. Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Port to listen on (Railway sets this automatically). |
| `NODE_ENV` | `development` or `production`. |
| `CLIENT_URL` | Comma-separated allowed CORS origins (`*` allows all). |
| `MONGO_URI` | MongoDB connection string (Atlas or local). |
| `JWT_SECRET` | Long random string used to sign tokens. |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `30d`. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account. |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary credentials. |
| `CLOUDINARY_FOLDER` | Upload folder (default `octoscore/gallery`). |
