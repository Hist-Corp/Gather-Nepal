# Gather — Events That Move You

A full-stack event management platform with a public marketplace, user dashboard, and staff admin panel. Built with Node.js, Express, SQLite, and vanilla JavaScript — no build step required.

## Features

### Public Marketplace
- **Event Discovery** — Search, filter by category/location/date, browse featured events
- **Event Details** — Rich event pages with images, descriptions, booking form
- **Booking System** — Real-time capacity tracking, instant confirmation
- **User Accounts** — Signup/login with JWT, personal dashboard
- **Booking Management** — View upcoming/past/cancelled bookings
- **Cancellation with Refund** — 75% refund (25% fee), processed automatically
- **Event Applications** — Users apply to host events, admin reviews & approves

### Staff Admin Panel (`/admin`)
- **Dashboard** — Revenue, bookings, tickets sold, pending applications, charts
- **Event Management** — Full CRUD, draft/published status, featured toggle
- **Booking Management** — View all, change status, delete
- **Application Review** — Approve/reject user event applications (auto-creates event on approval)
- **Content Management** — Edit all site copy (hero, about, contact, footer) live
- **Staff Management** — Add/remove staff, role assignment (admin/staff)

### Technical Highlights
- **Zero-config Database** — SQLite with auto-migrations on startup
- **3D Interactive Frontend** — Canvas particle system, tilt cards, scroll reveals, parallax
- **Modern Design System** — Custom CSS variables, fluid typography, accessible components
- **No Build Step** — Vanilla ES modules, runs directly in browser
- **Secure Auth** — JWT with HttpOnly-ready tokens, separate user/staff tables
- **Role-based Access** — User, staff, admin permissions

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
# Clone and install
git clone <repo-url>
cd gather-events
npm install

# Start development server
npm start
# Server runs at http://localhost:5000
```

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gather.events` | `admin123` |
| Staff | `staff@gather.events` | `staff123` |

Create your own user account at `/signup.html`.

## Project Structure

```
gather-events/
├── server.js                 # Express entry point
├── package.json
├── db/
│   └── database.js           # SQLite connection, schema, migrations, seeds
├── middleware/
│   └── auth.js               # JWT verification, role guards
├── routes/
│   ├── auth.js               # User signup/login, staff login, /me
│   ├── user.js               # User dashboard APIs (bookings, apps, stats)
│   ├── events.js             # Public event APIs (list, featured, detail, book)
│   ├── content.js            # Public site content API
│   └── admin.js              # Admin APIs (events, bookings, apps, content, staff)
├── public/                   # Frontend (served statically)
│   ├── index.html            # Homepage
│   ├── events.html           # Event listing with filters
│   ├── event.html            # Event detail + booking
│   ├── signup.html           # User registration
│   ├── login.html            # User login
│   ├── dashboard.html        # User dashboard (bookings, apps, stats)
│   ├── create-event.html     # Event application form
│   ├── success.html          # Booking confirmation
│   ├── css/
│   │   └── style.css         # Complete design system
│   └── js/
│       ├── api.js            # Auth, fetch helpers, UI utilities
│       ├── main.js           # Homepage logic
│       ├── events.js         # Event listing logic
│       ├── event.js          # Event detail + booking
│       ├── signup.js         # Signup form
│       ├── login.js          # Login form
│       ├── dashboard.js      # Dashboard tabs, cancellation modal
│       ├── create-event.js   # Application submission
│       └── 3d.js             # 3D canvas particle system
├── admin/                    # Admin panel (served at /admin)
│   ├── login.html            # Staff login
│   ├── index.html            # Dashboard
│   ├── events.html           # Event management
│   ├── bookings.html         # Booking management
│   ├── applications.html     # Application review
│   ├── content.html          # Content editor
│   ├── staff.html            # Staff management
│   ├── css/admin.css         # Admin styles
│   └── js/
│       ├── admin-api.js      # Admin auth, fetch, sidebar
│       ├── dashboard.js      # Dashboard charts/stats
│       ├── events-admin.js   # Event CRUD modal
│       ├── bookings-admin.js # Booking status management
│       ├── applications-admin.js # App approve/reject modal
│       ├── content-admin.js  # Content form
│       └── staff-admin.js    # Staff CRUD modal
└── README.md
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/staff/login` | Staff login |
| GET | `/api/auth/me` | Get current user profile |

### Public Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (search, category, location, date filters) |
| GET | `/api/events/featured` | Featured events |
| GET | `/api/events/:id` | Event detail with sold count |
| POST | `/api/events/:id/book` | Create booking (optional `user_id`) |

### User Dashboard (requires user JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/bookings` | User's bookings with event details |
| POST | `/api/user/bookings/:id/cancel` | Cancel booking (75% refund) |
| GET | `/api/user/applications` | User's event applications |
| POST | `/api/user/applications` | Submit event application |
| GET | `/api/user/stats` | Dashboard statistics |

### Admin (requires staff JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET/POST/PUT/DELETE | `/api/admin/events` | Event CRUD |
| GET/PATCH/DELETE | `/api/admin/bookings` | Booking management |
| GET/PATCH | `/api/admin/applications` | Application review |
| PUT | `/api/admin/content` | Update site content |
| GET/POST/DELETE | `/api/admin/staff` | Staff management |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content` | All site content key/values |

## Database Schema

### Tables
- **users** — Public user accounts (name, email, password_hash, phone, role)
- **staff** — Staff/admin accounts (separate from users)
- **events** — Events (title, description, category, format, venue, location, date, time, price, capacity, image, status, featured)
- **bookings** — Bookings (user_id, event_id, name, email, phone, tickets, total, status, refund_amount, cancelled_at)
- **event_applications** — User event applications (all event fields + host info, status, review fields)
- **site_content** — Key/value content store for editable copy

### Auto-migrations
On startup, `database.js` runs migrations to add missing columns:
- `users.phone`
- `bookings.user_id`, `refund_amount`, `cancelled_at`
- `events.format`
- Seeds default content keys

## Design System (CSS Variables)

```css
:root {
  --ink: #0d1b2a;
  --paper: #fdfbf7;
  --accent: #e07a5f;      /* Coral */
  --teal: #2a9d8f;        /* Teal */
  --gold: #d4a537;        /* Gold */
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
}
```

Key components: `.btn`, `.card`, `.badge`, `.field`, `.modal`, `.alert`, `.search-bar`, `.event-card`, `.stat-card`

## 3D Interactive Engine (`public/js/3d.js`)

- **Particle Constellation** — 150 particles in 3D cloud with connecting lines
- **Wireframe Shapes** — Rotating icosahedron + orbiting rings
- **Tilt Cards** — Perspective tilt on `.event-card`, `.booking-card`, `.contact-card` with glare effect
- **Scroll Reveal** — `.reveal` elements animate in 3D on intersect
- **Parallax Orbs** — Floating gradient orbs follow mouse
- **Respects** `prefers-reduced-motion`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `gather_super_secret_key_change_me` | JWT signing secret |

## Deployment

### Production Build
No build step needed. For production:
```bash
NODE_ENV=production PORT=3000 JWT_SECRET=<strong-secret> node server.js
```

### With PM2
```bash
npm install -g pm2
pm2 start server.js --name gather
pm2 startup
pm2 save
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Extending the Platform

### Adding New Content Keys
1. Add default in `database.js` `defaults` object
2. Run once to seed
3. Use in frontend: `c.your_key`
4. Edit in admin at `/admin/content.html`

### Adding Event Fields
1. Add column to `events` table in `database.js` migration
2. Update admin modal in `admin/events.html` (`fieldHtml` function)
3. Update API in `routes/admin.js` (POST/PUT handlers)
4. Update public event detail in `public/js/event.js`

### Adding User Fields
1. Add column to `users` table migration
2. Update signup form in `public/signup.html`
3. Update API in `routes/auth.js`

## Security Considerations

- **JWT Secret** — Change `JWT_SECRET` in production
- **Password Hashing** — bcryptjs with 10 rounds
- **SQL Injection** — Parameterized queries throughout
- **XSS Prevention** — `escapeHtml` on all user-generated content
- **CORS** — Configure for your domain in production
- **Rate Limiting** — Add `express-rate-limit` for auth endpoints

## License

MIT License — feel free to use for your own events platform.#   G a t h e r - N e p a l  
 