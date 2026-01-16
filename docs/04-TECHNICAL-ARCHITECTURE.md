# Technical Architecture Document - Plates for People

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐      ┌──────────────────────┐            │
│  │   Mobile Browser     │      │   Desktop Browser    │            │
│  │   (iOS/Android)      │      │   (Chrome/Firefox)   │            │
│  │                      │      │                      │            │
│  │  - Ionic React PWA   │      │  - Ionic React PWA   │            │
│  │  - Responsive UI     │      │  - Responsive UI     │            │
│  │  - Offline Support   │      │  - Advanced Features │            │
│  └──────────┬───────────┘      └──────────┬───────────┘            │
│             │                               │                        │
│             └───────────────┬───────────────┘                        │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                        HTTPS/REST API
                              │
┌─────────────────────────────┼────────────────────────────────────────┐
│                        API GATEWAY LAYER                              │
├─────────────────────────────┼────────────────────────────────────────┤
│                             │                                        │
│  ┌──────────────────────────▼────────────────────────┐              │
│  │            NGINX Reverse Proxy                     │              │
│  │  - SSL/TLS Termination                             │              │
│  │  - Load Balancing                                  │              │
│  │  - Rate Limiting                                   │              │
│  │  - Static File Serving                             │              │
│  └──────────────────────────┬────────────────────────┘              │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────────┐
│                      APPLICATION LAYER                                │
├─────────────────────────────┼────────────────────────────────────────┤
│                             │                                        │
│  ┌──────────────────────────▼────────────────────────┐              │
│  │           FastAPI Backend Application              │              │
│  │                                                     │              │
│  │  ┌─────────────────────────────────────────────┐  │              │
│  │  │         API Endpoints (Routers)              │  │              │
│  │  │  - /auth     - /users    - /donors           │  │              │
│  │  │  - /ngos     - /locations - /donations       │  │              │
│  │  │  - /ratings  - /admin    - /notifications    │  │              │
│  │  └─────────────────────────────────────────────┘  │              │
│  │                                                     │              │
│  │  ┌─────────────────────────────────────────────┐  │              │
│  │  │         Business Logic Layer                 │  │              │
│  │  │  - Services (domain logic)                   │  │              │
│  │  │  - Validators (input validation)             │  │              │
│  │  │  - Utils (helpers)                           │  │              │
│  │  └─────────────────────────────────────────────┘  │              │
│  │                                                     │              │
│  │  ┌─────────────────────────────────────────────┐  │              │
│  │  │         Middleware                           │  │              │
│  │  │  - Authentication (JWT)                      │  │              │
│  │  │  - Authorization (RBAC)                      │  │              │
│  │  │  - CORS                                      │  │              │
│  │  │  - Error Handling                            │  │              │
│  │  │  - Request Logging                           │  │              │
│  │  └─────────────────────────────────────────────┘  │              │
│  │                                                     │              │
│  │  ┌─────────────────────────────────────────────┐  │              │
│  │  │         Data Access Layer (ORM)              │  │              │
│  │  │  - SQLAlchemy Models                         │  │              │
│  │  │  - Database Sessions                         │  │              │
│  │  │  - Query Builders                            │  │              │
│  │  └─────────────────────────────────────────────┘  │              │
│  │                                                     │              │
│  └─────────────────────────┬───────────────────────┘  │              │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────┐
│                       DATA LAYER                                      │
├────────────────────────────┼─────────────────────────────────────────┤
│                            │                                         │
│  ┌─────────────────────────▼───────────────────────┐                │
│  │          PostgreSQL Database                     │                │
│  │  - Primary Database Instance                     │                │
│  │  - Connection Pool                               │                │
│  │  - Automatic Backups                             │                │
│  └──────────────────────────────────────────────────┘                │
│                                                                       │
│  ┌──────────────────────────────────────────────────┐                │
│  │          Object Storage (S3-Compatible)          │                │
│  │  - NGO Registration Documents                    │                │
│  │  - User Profile Images (future)                  │                │
│  └──────────────────────────────────────────────────┘                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────┐  ┌────────────────────┐                     │
│  │  OpenStreetMap +   │  │  Email Service     │                     │
│  │  Leaflet.js        │  │  (Future Phase)    │                     │
│  │  - Free mapping    │  │  - SendGrid/SES    │                     │
│  │  - No API limits   │  │  - Transactional   │                     │
│  └────────────────────┘  └────────────────────┘                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **Framework** | Ionic React | 7.x | Mobile-first, cross-platform, single codebase |
| **UI Library** | Ionic Components | 7.x | Pre-built responsive components |
| **State Management** | React Context + Hooks | 18.x | Simple, built-in, sufficient for MVP |
| **Routing** | React Router | 6.x | Standard routing for SPA |
| **HTTP Client** | Axios | 1.x | Promise-based, interceptors for auth |
| **Maps** | Leaflet.js | 1.9.x | Free, no API key required |
| **Map Provider** | OpenStreetMap | - | Free tiles, no usage limits |
| **Forms** | React Hook Form | 7.x | Performant, less re-renders |
| **Validation** | Zod | 3.x | Type-safe schema validation |
| **Date Handling** | date-fns | 3.x | Lightweight alternative to Moment.js |
| **Icons** | Ionicons | 7.x | Integrated with Ionic |
| **Build Tool** | Vite | 5.x | Fast builds, HMR |
| **Package Manager** | npm | 10.x | Standard, widely supported |

### Backend
| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **Framework** | FastAPI | 0.109.x | High performance, async, auto-docs |
| **Language** | Python | 3.11+ | Mature ecosystem, fast development |
| **ORM** | SQLAlchemy | 2.x | Most popular Python ORM |
| **Migration** | Alembic | 1.x | Database version control |
| **Authentication** | python-jose | 3.x | JWT token handling |
| **Password Hashing** | passlib + bcrypt | 1.x | Secure password hashing |
| **Validation** | Pydantic | 2.x | Built into FastAPI, type safety |
| **CORS** | fastapi.middleware.cors | - | Built-in CORS support |
| **Environment** | python-dotenv | 1.x | Environment variable management |
| **Testing** | pytest | 8.x | Standard Python testing |
| **Async** | asyncio + asyncpg | - | Async database operations |
| **ASGI Server** | Uvicorn | 0.27.x | Lightning-fast ASGI server |

### Database
| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **RDBMS** | PostgreSQL | 15+ | Reliable, feature-rich, free |
| **Connection Pool** | asyncpg | 0.29.x | Async PostgreSQL driver |
| **Extensions** | pgcrypto, uuid-ossp | - | Encryption, UUID generation |

### Infrastructure
| Component | Technology | Justification |
|-----------|------------|---------------|
| **Cloud Provider** | Oracle Cloud | Free tier, client requirement |
| **Compute** | Oracle Compute Instance | Always-free VM (ARM-based) |
| **Database** | Self-hosted PostgreSQL | Cost-effective for MVP |
| **Object Storage** | Oracle Object Storage | Free tier 20GB |
| **Reverse Proxy** | NGINX | Lightweight, high performance |
| **SSL/TLS** | Let's Encrypt | Free SSL certificates |
| **CDN** | Cloudflare Free | Global CDN, DDoS protection |
| **DNS** | Cloudflare DNS | Free, fast, reliable |
| **Monitoring** | Oracle Cloud Monitoring | Built-in, free |

### DevOps & Deployment
| Component | Technology | Justification |
|-----------|------------|---------------|
| **Version Control** | Git + GitHub | Standard, free private repos |
| **CI/CD** | GitHub Actions | Free for public repos, integrated |
| **Containerization** | Docker | Consistent environments |
| **Process Manager** | systemd | Native Linux service management |
| **Logs** | systemd journald | Built-in, no extra setup |

---

## Project Structure

### Frontend Structure
```
plates-for-people-frontend/
├── public/
│   ├── index.html
│   └── assets/
│       └── images/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   ├── routes.tsx               # Route definitions
│   │
│   ├── components/              # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loader.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TabBar.tsx
│   │   ├── map/
│   │   │   ├── MapView.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── LocationMarker.tsx
│   │   ├── calendar/
│   │   │   └── CalendarView.tsx
│   │   └── notifications/
│   │       └── NotificationList.tsx
│   │
│   ├── pages/                   # Page components
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── donor/
│   │   │   ├── DonorDashboard.tsx
│   │   │   ├── SearchNGOs.tsx
│   │   │   ├── CreateDonation.tsx
│   │   │   ├── DonationHistory.tsx
│   │   │   └── DonorProfile.tsx
│   │   ├── ngo/
│   │   │   ├── NGODashboard.tsx
│   │   │   ├── ManageLocations.tsx
│   │   │   ├── ManageCapacity.tsx
│   │   │   ├── DonationRequests.tsx
│   │   │   └── NGOProfile.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── NGOVerification.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── Reports.tsx
│   │   └── public/
│   │       ├── Home.tsx
│   │       └── About.tsx
│   │
│   ├── context/                 # React Context
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useGeolocation.ts
│   │   └── useNotifications.ts
│   │
│   ├── services/                # API services
│   │   ├── api.ts              # Axios instance
│   │   ├── authService.ts
│   │   ├── donorService.ts
│   │   ├── ngoService.ts
│   │   ├── donationService.ts
│   │   ├── adminService.ts
│   │   └── notificationService.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   ├── types/                   # TypeScript types
│   │   ├── user.types.ts
│   │   ├── donation.types.ts
│   │   ├── ngo.types.ts
│   │   └── api.types.ts
│   │
│   └── styles/                  # Global styles
│       ├── variables.css
│       └── global.css
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.ts         # For native builds (future)
└── README.md
```

### Backend Structure
```
plates-for-people-backend/
├── alembic/                     # Database migrations
│   ├── versions/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_ratings.py
│   │   └── ...
│   ├── env.py
│   └── alembic.ini
│
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Configuration settings
│   ├── database.py              # Database connection
│   │
│   ├── models/                  # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── donor_profile.py
│   │   ├── ngo_profile.py
│   │   ├── ngo_location.py
│   │   ├── ngo_location_capacity.py
│   │   ├── donation_request.py
│   │   ├── rating.py
│   │   ├── notification.py
│   │   └── audit_log.py
│   │
│   ├── schemas/                 # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── donor.py
│   │   ├── ngo.py
│   │   ├── donation.py
│   │   ├── rating.py
│   │   ├── notification.py
│   │   └── common.py
│   │
│   ├── api/                     # API routes
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencies (auth, db)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py         # /auth endpoints
│   │       ├── users.py        # /users endpoints
│   │       ├── donors.py       # /donors endpoints
│   │       ├── ngos.py         # /ngos endpoints
│   │       ├── locations.py    # /locations endpoints
│   │       ├── donations.py    # /donations endpoints
│   │       ├── ratings.py      # /ratings endpoints
│   │       ├── notifications.py # /notifications endpoints
│   │       └── admin.py        # /admin endpoints
│   │
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── donor_service.py
│   │   ├── ngo_service.py
│   │   ├── donation_service.py
│   │   ├── notification_service.py
│   │   ├── admin_service.py
│   │   └── file_service.py
│   │
│   ├── utils/                   # Utilities
│   │   ├── __init__.py
│   │   ├── security.py         # Password hashing, JWT
│   │   ├── validators.py       # Custom validators
│   │   ├── geo.py              # Geolocation helpers
│   │   ├── email.py            # Email helpers (future)
│   │   └── constants.py        # Constants
│   │
│   ├── middleware/              # Middleware
│   │   ├── __init__.py
│   │   ├── auth.py             # JWT authentication
│   │   ├── rbac.py             # Role-based access
│   │   ├── error_handler.py    # Global error handling
│   │   └── logging.py          # Request logging
│   │
│   └── tests/                   # Test suite
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_donors.py
│       ├── test_ngos.py
│       ├── test_donations.py
│       └── test_admin.py
│
├── scripts/                     # Utility scripts
│   ├── seed_data.py            # Seed test data
│   ├── backup_db.sh            # Database backup
│   └── deploy.sh               # Deployment script
│
├── .env.example
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── Dockerfile
└── README.md
```

---

## API Design

### RESTful API Conventions
- Base URL: `https://api.platesforpeople.org/api/v1`
- All requests/responses in JSON
- JWT Bearer token authentication
- Standard HTTP status codes

### Authentication Flow
```
POST /auth/register          # Register new user
POST /auth/login             # Login (returns JWT)
POST /auth/refresh           # Refresh access token
POST /auth/logout            # Logout (invalidate token)
GET  /auth/me                # Get current user profile
PUT  /auth/change-password   # Change password
```

### Donor Endpoints
```
GET    /donors/profile              # Get donor profile
PUT    /donors/profile              # Update donor profile
GET    /donors/dashboard            # Dashboard stats
GET    /donations/search            # Search NGOs (map/calendar)
POST   /donations/requests          # Create donation request
GET    /donations/requests          # List donor's requests
GET    /donations/requests/{id}     # Get request details
PUT    /donations/requests/{id}     # Update request (cancel)
DELETE /donations/requests/{id}     # Delete request (if pending)
POST   /ratings                     # Create rating
GET    /ratings/donor               # Donor's given ratings
```

### NGO Endpoints
```
GET    /ngos/profile                # Get NGO profile
PUT    /ngos/profile                # Update NGO profile
GET    /ngos/dashboard              # Dashboard stats
GET    /ngos/locations              # List NGO locations
POST   /ngos/locations              # Add location
GET    /ngos/locations/{id}         # Get location details
PUT    /ngos/locations/{id}         # Update location
DELETE /ngos/locations/{id}         # Delete location
GET    /ngos/locations/{id}/capacity # Get capacity
POST   /ngos/locations/{id}/capacity # Set capacity
PUT    /ngos/locations/{id}/capacity/{id} # Update capacity
GET    /donations/incoming          # Incoming requests
PUT    /donations/requests/{id}/confirm # Confirm request
PUT    /donations/requests/{id}/reject  # Reject request
PUT    /donations/requests/{id}/complete # Mark complete
GET    /ratings/ngo                 # Ratings received
```

### Admin Endpoints
```
GET    /admin/dashboard             # Admin dashboard stats
GET    /admin/ngos/pending          # Pending NGO verifications
PUT    /admin/ngos/{id}/verify      # Verify NGO
PUT    /admin/ngos/{id}/reject      # Reject NGO
GET    /admin/users                 # List all users
GET    /admin/users/{id}            # Get user details
PUT    /admin/users/{id}            # Update user
PUT    /admin/users/{id}/suspend    # Suspend user
PUT    /admin/users/{id}/activate   # Activate user
GET    /admin/donations             # All donations (filtered)
GET    /admin/reports/export        # Export reports (CSV)
GET    /admin/audit-logs            # View audit logs
```

### Notification Endpoints
```
GET    /notifications               # List user notifications
GET    /notifications/unread        # Unread count
PUT    /notifications/{id}/read     # Mark as read
PUT    /notifications/read-all      # Mark all as read
DELETE /notifications/{id}          # Delete notification
```

### Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## Authentication & Authorization

### JWT Token Strategy
- **Access Token**: 1 hour expiry, stored in memory
- **Refresh Token**: 7 days expiry, stored in HTTP-only cookie
- **Token Payload**:
  ```json
  {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "donor",
    "is_verified": true,
    "exp": 1704635400
  }
  ```

### RBAC Implementation
```python
# Decorator-based authorization
@router.get("/donors/dashboard")
@require_roles(["donor"])
async def get_donor_dashboard(current_user: User = Depends(get_current_user)):
    ...

@router.get("/admin/users")
@require_roles(["admin"])
async def list_users(current_user: User = Depends(get_current_user)):
    ...

# NGOs must be verified
@router.get("/donations/incoming")
@require_roles(["ngo"])
@require_verified()
async def get_incoming_requests(current_user: User = Depends(get_current_user)):
    ...
```

### Password Security
- Bcrypt hashing with cost factor 12
- Minimum password requirements enforced
- Password change requires old password verification
- No password reset in MVP (manual admin intervention)

---

## Database Connection & Management

### Connection Pool Configuration
```python
# asyncpg pool
DATABASE_URL = "postgresql+asyncpg://user:pass@host:5432/plates_for_people"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,              # Max connections
    max_overflow=10,           # Additional connections
    pool_timeout=30,           # Connection timeout
    pool_recycle=3600,         # Recycle connections hourly
    pool_pre_ping=True,        # Verify connection health
)

async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)
```

### Migration Strategy
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# Migration history
alembic history
```

---

## File Upload & Storage

### NGO Document Upload
1. **Client**: Upload to signed URL (future) or direct POST
2. **Backend**: Validate file type (PDF, JPEG, PNG)
3. **Storage**: Oracle Object Storage bucket
4. **Database**: Store file URL in `ngo_profiles.registration_doc_url`

### File Validation
- Max size: 5MB
- Allowed types: PDF, JPEG, PNG
- Virus scan (future consideration)

---

## Geolocation & Mapping

### Map Implementation (Leaflet + OpenStreetMap)
```typescript
// Frontend map component
<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  <Marker position={[lat, lng]}>
    <Popup>NGO Name</Popup>
  </Marker>
</MapContainer>
```

### Distance Calculation (Haversine Formula)
```python
# Backend utility
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in kilometers"""
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c
```

### Location Picker
- User clicks map → get coordinates
- Reverse geocoding for address (optional, manual entry)
- Store lat/lng in database

---

## Performance Optimization

### Frontend
1. **Code Splitting**: Lazy load pages with React.lazy()
2. **Memoization**: Use React.memo() for expensive components
3. **Debouncing**: Search input debounced (300ms)
4. **Virtual Scrolling**: For long lists (donations, notifications)
5. **Image Optimization**: Lazy loading, compression
6. **Bundle Size**: Tree-shaking, minimize dependencies

### Backend
1. **Database Indexing**: All foreign keys and frequently queried columns
2. **Query Optimization**: Use EXPLAIN ANALYZE, avoid N+1 queries
3. **Caching**: In-memory cache for NGO list (future: Redis)
4. **Pagination**: Limit 20 items per page by default
5. **Async Operations**: All DB operations async
6. **Connection Pooling**: Reuse database connections

### Network
1. **CDN**: Cloudflare for static assets
2. **Compression**: GZIP/Brotli for API responses
3. **HTTP/2**: NGINX configured for HTTP/2
4. **Caching Headers**: Proper Cache-Control headers

---

## Security Measures

### API Security
1. **HTTPS Only**: Force SSL redirect
2. **CORS**: Whitelist frontend origin only
3. **Rate Limiting**: 100 requests/minute per IP
4. **Input Validation**: Pydantic schemas validate all inputs
5. **SQL Injection**: Parameterized queries via ORM
6. **XSS Prevention**: Sanitize user inputs
7. **CSRF**: Not applicable (JWT tokens, no cookies for auth)

### Data Security
1. **Encryption at Rest**: Database-level encryption
2. **Encryption in Transit**: TLS 1.3
3. **Sensitive Data**: Government IDs encrypted at app level
4. **Password Storage**: Bcrypt hashed
5. **File Upload**: Validate MIME type, size limits
6. **Audit Logging**: All critical operations logged

### Infrastructure Security
1. **Firewall**: Only ports 80, 443, 22 (SSH) open
2. **SSH**: Key-based authentication only
3. **Database**: Not exposed to public internet
4. **Environment Variables**: Never committed to Git
5. **Secrets Management**: Use Oracle Vault (future) or .env files

---

## Error Handling & Logging

### Error Handling Strategy
```python
# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )

# Custom exceptions
class NGONotVerifiedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=403,
            detail="NGO account not verified"
        )
```

### Logging Configuration
```python
# Structured logging
logging.config.dictConfig({
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'detailed',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'detailed',
        }
    },
    'formatters': {
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file']
    }
})
```

---

## Testing Strategy

### Unit Tests (Backend)
```python
# Test authentication
def test_register_user(client):
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123",
        "full_name": "Test User",
        "phone": "+1234567890",
        "role": "donor"
    })
    assert response.status_code == 201
    assert "access_token" in response.json()["data"]

# Test donation request
def test_create_donation_request(client, donor_token):
    response = client.post(
        "/donations/requests",
        headers={"Authorization": f"Bearer {donor_token}"},
        json={
            "ngo_location_id": "uuid",
            "meal_type": "lunch",
            "num_plates": 50,
            "food_description": "Pasta",
            "donation_date": "2026-01-20"
        }
    )
    assert response.status_code == 201
```

### Integration Tests
- Test complete user flows (register → search → donate)
- Test database transactions
- Test notification creation

### Frontend Tests (Jest + React Testing Library)
```typescript
// Test login form
test('submits login form with valid credentials', async () => {
  render(<Login />);
  
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' }
  });
  fireEvent.click(screen.getByText('Login'));
  
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
```

### E2E Tests (Future)
- Cypress or Playwright for critical user journeys
- Test across browsers (Chrome, Firefox, Safari)

---

## Monitoring & Observability

### Application Monitoring
1. **Health Checks**: `/health` endpoint returns API status
2. **Metrics**: Request count, response time, error rate
3. **Logs**: Centralized logging (systemd journald)
4. **Uptime**: Oracle Cloud monitoring + Uptime Robot (free)

### Database Monitoring
1. **Connection Pool**: Monitor active/idle connections
2. **Slow Queries**: Log queries > 1 second
3. **Disk Usage**: Alert when > 80% full
4. **Backup Status**: Verify daily backups

### Alerting (Future)
- Email alerts for critical errors
- Slack notifications for deployments
- PagerDuty for production incidents

---

## Deployment Architecture

### Oracle Cloud Infrastructure
```
┌────────────────────────────────────────────────┐
│         Oracle Compute Instance (Free Tier)    │
│                                                │
│  - Shape: VM.Standard.A1.Flex (ARM)           │
│  - Memory: 24GB (free tier)                   │
│  - Storage: 200GB boot volume                 │
│  - OS: Ubuntu 22.04 LTS                       │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Docker Containers (Optional)            │ │
│  │  - Frontend (Nginx)                      │ │
│  │  - Backend (Uvicorn)                     │ │
│  │  - PostgreSQL                            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  OR                                            │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Direct Installation                     │ │
│  │  - NGINX (frontend + reverse proxy)     │ │
│  │  - Python 3.11 + Uvicorn (backend)      │ │
│  │  - PostgreSQL 15                        │ │
│  │  - systemd services                     │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

### Domain & DNS
- Register domain: `platesforpeople.org` (Namecheap ~$10/year)
- Configure Cloudflare DNS (free)
- Point to Oracle Cloud instance IP
- Enable Cloudflare proxy (free CDN + DDoS)

### SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d platesforpeople.org -d api.platesforpeople.org

# Auto-renewal (cron job)
0 0 * * * certbot renew --quiet
```

---

## Cost Breakdown (Optimized for Free/Low-Cost)

| Component | Service | Cost |
|-----------|---------|------|
| **Compute** | Oracle Cloud Free Tier VM | $0 |
| **Database** | Self-hosted PostgreSQL | $0 |
| **Storage** | Oracle Object Storage (20GB) | $0 |
| **Domain** | Namecheap (.org) | $12/year |
| **SSL** | Let's Encrypt | $0 |
| **CDN** | Cloudflare Free | $0 |
| **DNS** | Cloudflare | $0 |
| **Monitoring** | Oracle Cloud Monitoring | $0 |
| **Email** | Not implemented in MVP | $0 |
| **Total Year 1** | | ~$12/year |

### Scalability Costs (Future)
- Increase compute: $10-50/month
- Managed PostgreSQL: $20-100/month
- Redis caching: $5-20/month
- Email service: $10-30/month
- **Estimated scaling cost**: $50-200/month

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Seed data prepared (optional)
- [ ] SSL certificate obtained
- [ ] DNS configured
- [ ] Firewall rules set

### Deployment Steps
1. Provision Oracle Cloud instance
2. Install dependencies (Python, Node, PostgreSQL, NGINX)
3. Clone repository
4. Set environment variables
5. Run database migrations
6. Build frontend
7. Configure NGINX
8. Start backend service (systemd)
9. Verify health checks
10. Monitor logs for errors

### Post-Deployment
- [ ] Smoke test critical paths
- [ ] Create first admin user
- [ ] Test from multiple devices
- [ ] Monitor performance
- [ ] Setup automated backups
- [ ] Document any issues

---

## Disaster Recovery Plan

### Backup Strategy
1. **Database**: Daily automated backups (pg_dump)
2. **Files**: Object storage replicated
3. **Code**: Git repository (GitHub)
4. **Configurations**: Documented in repository

### Recovery Procedures
1. **Database Recovery**: Restore from latest backup
2. **Server Failure**: Spin up new instance, restore from backups
3. **Data Corruption**: Point-in-time recovery (if WAL enabled)

### RTO/RPO
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours (daily backups)

---

## Future Technical Enhancements

### Phase 2 (Post-MVP)
1. **Redis Caching**: Cache frequently accessed data
2. **Email Service**: Transactional emails (SendGrid)
3. **SMS Notifications**: Critical alerts (Twilio)
4. **Advanced Search**: Elasticsearch for full-text search
5. **Image Uploads**: User profile pictures
6. **Payment Gateway**: For donations (Stripe)

### Phase 3 (Scale)
1. **Microservices**: Split into smaller services
2. **Message Queue**: RabbitMQ/Kafka for async tasks
3. **Load Balancer**: Multiple backend instances
4. **Database Replication**: Read replicas for scaling
5. **CDN**: Dedicated CDN for media files
6. **Mobile Apps**: Native iOS/Android (Capacitor)

---

## Development Timeline (2-Day Sprint)

See separate document: `05-EXECUTION-PLAN.md`
