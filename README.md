# Gather — Events That Move You

A comprehensive full-stack event management platform featuring a public marketplace, user dashboard, and staff administration panel. Built with Node.js, Express, SQLite, and vanilla JavaScript with zero build complexity.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Development Guide](#development-guide)
- [Security](#security)
- [License](#license)

---

## Overview

Gather is an end-to-end event management solution enabling users to discover, book, and manage events while providing administrators with complete platform control. The platform combines a modern, interactive frontend with a robust backend API, all deployable without additional build tooling.

### Key Capabilities

- **Event Discovery & Booking** — Searchable marketplace with real-time capacity tracking
- **User Accounts & Dashboard** — JWT authentication with personal booking history and application management
- **Admin Portal** — Comprehensive dashboard for revenue analytics, event management, and staff oversight
- **Refund Processing** — Automated 75% refund system with tracking
- **Event Applications** — Community-driven event submission and approval workflow

---

## Features

### Public Marketplace

| Feature | Description |
|---------|-------------|
| **Event Discovery** | Search, filter by category/location/date, and browse featured events |
| **Event Details** | Rich event pages with images, descriptions, and integrated booking forms |
| **Real-time Booking** | Instant booking confirmation with live capacity tracking |
| **User Accounts** | Secure signup/login using JWT authentication |
| **Booking Management** | View upcoming, past, and cancelled bookings from user dashboard |
| **Refund System** | Automated cancellation processing with 75% refund (25% platform fee) |
| **Event Applications** | Users can apply to host events; admin reviews and approves |

### Staff Admin Panel (`/admin`)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Revenue overview, booking metrics, ticket sales, pending applications, and charts |
| **Event Management** | Full CRUD operations, draft/publish status, featured event toggling |
| **Booking Management** | View all bookings, update status, and delete entries |
| **Application Review** | Approve/reject user applications with automatic event creation |
| **Content Management** | Live editing of site copy (hero, about, contact, footer sections) |
| **Staff Management** | Add/remove staff and assign roles (admin/staff) |

### Technical Highlights

- **Zero-Configuration Database** — SQLite with automatic migrations on startup
- **Interactive 3D Frontend** — Canvas-based particle system, tilt cards, scroll reveals, and parallax effects
- **Modern Design System** — CSS variables for theming, fluid typography, accessible components
- **No Build Step** — Native ES modules, runs directly in the browser
- **Secure Authentication** — JWT tokens with HttpOnly-ready implementation
- **Role-Based Access Control** — Granular permissions for users, staff, and administrators

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 18+, Express.js |
| **Database** | SQLite (file-based, zero configuration) |
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Authentication** | JWT with bcryptjs password hashing |
| **3D Rendering** | HTML5 Canvas |

---

## Quick Start

### Prerequisites

- **Node.js** — v18.0.0 or higher
- **npm** — v9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Hist-Corp/Gather-Nepal.git
cd Gather-Nepal

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at **http://localhost:5000**

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gather.events` | `admin123` |
| Staff | `staff@gather.events` | `staff123` |

To create a regular user account, navigate to `/signup.html`.

---

## Project Structure

```
Gather-Nepal/
├── server.js                      # Express application entry point
├── package.json                   # Dependencies and scripts
├── db/
│   └── database.js                # SQLite connection, schema, migrations, seeds
├── middleware/
│   └── auth.js                    # JWT verification and role-based guards
├── routes/
│   ├── auth.js                    # User and staff authentication endpoints
│   ├── user.js                    # User dashboard APIs (bookings, applications, stats)
│   ├── events.js                  # Public event APIs (list, featured, detail, booking)
│   ├── content.js                 # Site content retrieval API
│   └── admin.js                   # Admin APIs (events, bookings, applications, content, staff)
├── public/                        # Frontend application (static files)
│   ├── index.html                 # Homepage
│   ├── events.html                # Event listing with filters
│   ├── event.html                 # Event detail page and booking form
│   ├── signup.html                # User registration page
│   ├── login.html                 # User login page
│   ├── dashboard.html             # User dashboard (bookings, applications, statistics)
│   ├── create-event.html          # Event application form
│   ├── success.html               # Booking confirmation page
│   ├── css/
│   │   └── style.css              # Complete design system and component styles
│   └── js/
│       ├── api.js                 # API helper functions and utilities
│       ├── main.js                # Homepage initialization logic
│       ├── events.js              # Event listing page logic
│       ├── event.js               # Event detail and booking logic
│       ├── signup.js              # Signup form handler
│       ├── login.js               # Login form handler
│       ├── dashboard.js           # Dashboard tabs, cancellation modal
│       ├── create-event.js        # Event application submission
│       └── 3d.js                  # 3D canvas effects engine
├── admin/                         # Admin panel (served at /admin)
│   ├── login.html                 # Staff login page
│   ├── index.html                 # Admin dashboard
│   ├── events.html                # Event management interface
│   ├── bookings.html              # Booking management interface
│   ├── applications.html          # Application review interface
│   ├── content.html               # Content editor interface
│   ├── staff.html                 # Staff management interface
│   ├── css/
│   │   └── admin.css              # Admin panel styles
│   └── js/
│       ├── admin-api.js           # Admin authentication and utilities
│       ├── dashboard.js           # Dashboard charts and statistics
│       ├── events-admin.js        # Event CRUD operations
│       ├── bookings-admin.js      # Booking status management
│       ├── applications-admin.js  # Application approval workflow
│       ├── content-admin.js       # Content editing functionality
│       └── staff-admin.js         # Staff CRUD operations
└── README.md
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| `POST` | `/api/auth/signup` | Register new user account | None |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | None |
| `POST` | `/api/auth/staff/login` | Authenticate staff and receive JWT | None |
| `GET` | `/api/auth/me` | Get current authenticated user profile | User JWT |

### Public Event Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| `GET` | `/api/events` | List events with search, category, location, date filters | None |
| `GET` | `/api/events/featured` | Retrieve featured events | None |
| `GET` | `/api/events/:id` | Get event details with booking count | None |
| `POST` | `/api/events/:id/book` | Create new booking | Optional User JWT |

### User Dashboard Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| `GET` | `/api/user/bookings` | Retrieve user's bookings with event details | User JWT |
| `POST` | `/api/user/bookings/:id/cancel` | Cancel booking and process refund (75%) | User JWT |
| `GET` | `/api/user/applications` | List user's event applications | User JWT |
| `POST` | `/api/user/applications` | Submit new event application | User JWT |
| `GET` | `/api/user/stats` | Get user dashboard statistics | User JWT |

### Admin Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| `GET` | `/api/admin/stats` | Platform dashboard statistics | Staff JWT |
| `GET` | `/api/admin/events` | List all events | Staff JWT |
| `POST` | `/api/admin/events` | Create new event | Staff JWT |
| `PUT` | `/api/admin/events/:id` | Update event | Staff JWT |
| `DELETE` | `/api/admin/events/:id` | Delete event | Staff JWT |
| `GET` | `/api/admin/bookings` | List all bookings | Staff JWT |
| `PATCH` | `/api/admin/bookings/:id` | Update booking status | Staff JWT |
| `DELETE` | `/api/admin/bookings/:id` | Delete booking | Staff JWT |
| `GET` | `/api/admin/applications` | List event applications | Staff JWT |
| `PATCH` | `/api/admin/applications/:id` | Review application (approve/reject) | Staff JWT |
| `PUT` | `/api/admin/content` | Update site content | Staff JWT |
| `GET` | `/api/admin/staff` | List staff members | Staff JWT |
| `POST` | `/api/admin/staff` | Add new staff member | Staff JWT |
| `DELETE` | `/api/admin/staff/:id` | Remove staff member | Staff JWT |

### Public Content Endpoint

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| `GET` | `/api/content` | Get all site content key/value pairs | None |

---

## Database Schema

### Table: `users`

Public user accounts for event attendees.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `name` | TEXT | User's full name |
| `email` | TEXT UNIQUE | Email address |
| `password_hash` | TEXT | Bcrypt hashed password |
| `phone` | TEXT | Contact phone number |
| `role` | TEXT | User role (default: 'user') |
| `created_at` | DATETIME | Account creation timestamp |

### Table: `staff`

Staff and administrator accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `email` | TEXT UNIQUE | Staff email address |
| `password_hash` | TEXT | Bcrypt hashed password |
| `role` | TEXT | Staff role ('admin' or 'staff') |
| `created_at` | DATETIME | Account creation timestamp |

### Table: `events`

Event listings in the marketplace.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `title` | TEXT | Event name |
| `description` | TEXT | Event details |
| `category` | TEXT | Event category (e.g., 'Concert', 'Workshop') |
| `format` | TEXT | Format type (e.g., 'In-Person', 'Virtual') |
| `venue` | TEXT | Venue name |
| `location` | TEXT | Geographic location |
| `date` | DATE | Event date |
| `time` | TIME | Event start time |
| `price` | DECIMAL | Ticket price |
| `capacity` | INTEGER | Total ticket availability |
| `image` | TEXT | Event image URL or path |
| `status` | TEXT | Publishing status ('draft' or 'published') |
| `featured` | INTEGER | Boolean flag for homepage feature |
| `created_at` | DATETIME | Creation timestamp |

### Table: `bookings`

User event bookings and transaction records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `user_id` | INTEGER | Associated user (nullable for guest bookings) |
| `event_id` | INTEGER | Associated event |
| `name` | TEXT | Booking attendee name |
| `email` | TEXT | Booking contact email |
| `phone` | TEXT | Booking contact phone |
| `tickets` | INTEGER | Number of tickets |
| `total` | DECIMAL | Total booking amount |
| `status` | TEXT | Booking status ('confirmed', 'cancelled', etc.) |
| `refund_amount` | DECIMAL | Refund amount if cancelled |
| `cancelled_at` | DATETIME | Cancellation timestamp |
| `created_at` | DATETIME | Booking creation timestamp |

### Table: `event_applications`

User submissions to host events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `user_id` | INTEGER | Submitting user |
| `title` | TEXT | Proposed event title |
| `description` | TEXT | Proposed event description |
| `category` | TEXT | Event category |
| `venue` | TEXT | Proposed venue |
| `location` | TEXT | Proposed location |
| `date` | DATE | Proposed event date |
| `time` | TIME | Proposed start time |
| `price` | DECIMAL | Proposed ticket price |
| `capacity` | INTEGER | Proposed capacity |
| `status` | TEXT | Application status ('pending', 'approved', 'rejected') |
| `admin_notes` | TEXT | Admin review comments |
| `created_at` | DATETIME | Submission timestamp |

### Table: `site_content`

Key-value store for editable site copy.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT PRIMARY KEY | Content identifier |
| `value` | TEXT | Content value |
| `updated_at` | DATETIME | Last update timestamp |

### Auto-Migrations

The database initialization automatically adds missing columns:
- `users.phone` — User contact field
- `bookings.user_id`, `refund_amount`, `cancelled_at` — Booking enhancements
- `events.format` — Event format specification
- Default content keys for site customization

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server listening port |
| `JWT_SECRET` | `gather_super_secret_key_change_me` | JWT signing secret (⚠️ change in production) |
| `NODE_ENV` | `development` | Execution environment |

### Design System (CSS Variables)

The application uses a cohesive color and typography system:

```css
:root {
  --ink: #0d1b2a;                   /* Primary text color */
  --paper: #fdfbf7;                 /* Primary background */
  --accent: #e07a5f;                /* Coral accent */
  --teal: #2a9d8f;                  /* Teal secondary */
  --gold: #d4a537;                  /* Gold accent */
  --font-display: 'Syne', sans-serif;     /* Headings */
  --font-body: 'DM Sans', sans-serif;     /* Body text */
}
```

Core component classes: `.btn`, `.card`, `.badge`, `.field`, `.modal`, `.alert`, `.search-bar`, `.event-card`, `.stat-card`

### 3D Interactive Engine (`public/js/3d.js`)

The frontend includes an interactive 3D experience with:

- **Particle Constellation** — 150 particles in 3D cloud with connecting lines
- **Wireframe Shapes** — Rotating icosahedron with orbiting rings
- **Tilt Cards** — Perspective tilt effect on event, booking, and contact cards with glare
- **Scroll Reveal** — 3D animation reveal for `.reveal` elements on intersection
- **Parallax Orbs** — Floating gradient orbs following mouse position
- **Accessibility** — Respects `prefers-reduced-motion` user preference

---

## Deployment

### Development

```bash
npm start
# Server runs at http://localhost:5000
```

### Production Build

No build step is required. For production deployment:

```bash
NODE_ENV=production PORT=3000 JWT_SECRET=<your-strong-secret> node server.js
```

### Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name gather

# Configure startup
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t gather-events .
docker run -p 5000:3000 -e JWT_SECRET=<secret> gather-events
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
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Development Guide

### Adding New Content Keys

1. Add default value to `defaults` object in `db/database.js`
2. Restart server to auto-seed new key
3. Access in frontend via `c.your_key`
4. Edit in admin panel at `/admin/content.html`

### Adding Event Fields

1. Add column to `events` table migration in `db/database.js`
2. Update admin modal HTML in `admin/events.html` (`fieldHtml` function)
3. Update API handlers in `routes/admin.js` (POST/PUT)
4. Update public event detail display in `public/js/event.js`

### Adding User Profile Fields

1. Add column to `users` table migration in `db/database.js`
2. Update signup form in `public/signup.html`
3. Update auth API in `routes/auth.js`

---

## Security

### Authentication & Authorization

- **JWT Secrets** — Change `JWT_SECRET` to a strong value in production
- **Password Hashing** — bcryptjs with 10 salt rounds
- **Token Isolation** — Separate JWT secrets recommended for production

### Data Protection

- **SQL Injection Prevention** — All queries use parameterized statements
- **XSS Prevention** — User-generated content escaped with `escapeHtml` utility
- **CORS Configuration** — Configure for your production domain

### Recommended Production Hardening

- Add `express-rate-limit` to auth endpoints
- Enable HTTPS and HSTS headers
- Implement CSRF protection
- Regular security audits and dependency updates
- Database backup strategy
- Request logging and monitoring

---

## License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute for your own event management platform.

---

## Support & Contributions

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/Hist-Corp/Gather-Nepal).
