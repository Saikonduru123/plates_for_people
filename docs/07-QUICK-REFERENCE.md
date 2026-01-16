# Plates for People - Quick Reference Guide

## 🚀 Project at a Glance

**Mission:** Connect food donors with verified NGOs to reduce food waste and feed those in need.

**Timeline:** 2 days (production-ready MVP)

**Cost:** ~$12/year (ultra cost-effective)

**Tech Stack:** Ionic React + FastAPI + PostgreSQL + Oracle Cloud

**Coverage:** United States & India (nationwide)

---

## 📋 Quick Links

| Resource | URL |
|----------|-----|
| **Live App** | https://platesforpeople.org |
| **API Docs** | https://api.platesforpeople.org/docs |
| **GitHub** | https://github.com/yourusername/plates-for-people |
| **Project Docs** | `/docs` folder |

---

## 👥 User Roles & Access

### Donor
- **Can:** Search NGOs, create donation requests, rate donations
- **Cannot:** View other donors' data, access admin functions
- **Registration:** Immediate (no verification required)

### NGO
- **Can:** Manage locations/capacity, accept/reject requests
- **Cannot:** Login until admin verification, access other NGOs' data
- **Registration:** Requires admin verification (manual approval)

### Admin
- **Can:** Verify NGOs, manage users, view reports, access all data
- **Cannot:** Delete historical records (audit trail)
- **Registration:** Manually created (not public)

---

## 🔑 Key Features Checklist

### ✅ Implemented (MVP)
- [x] User authentication (JWT-based)
- [x] Role-based access control (RBAC)
- [x] NGO registration with document upload
- [x] Admin verification system
- [x] Multi-location management for NGOs
- [x] Meal-wise capacity management (breakfast/lunch/dinner)
- [x] Map-based NGO search (OpenStreetMap + Leaflet)
- [x] Calendar-based availability search
- [x] Donation request creation
- [x] Request acceptance/rejection workflow
- [x] In-app notifications
- [x] Rating & feedback system (1-5 stars)
- [x] Donor dashboard (stats + history)
- [x] NGO dashboard (stats + requests)
- [x] Admin dashboard (platform analytics)
- [x] Report generation & CSV export
- [x] Mobile-first responsive design
- [x] HTTPS/SSL enabled
- [x] Automated database backups

### ❌ Not Included (Future Phases)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Real-time tracking/live updates
- [ ] Volunteer management
- [ ] Pickup/delivery logistics
- [ ] Food quality verification
- [ ] Payment processing
- [ ] Multi-language support
- [ ] Native mobile apps
- [ ] Social media integration

---

## 🗺️ User Journeys

### Donor Journey (5 steps)
1. **Register** → Create account as donor
2. **Search** → Find NGOs on map/calendar
3. **Request** → Submit donation request
4. **Coordinate** → Receive confirmation + NGO contact
5. **Complete** → Mark done + rate NGO

### NGO Journey (7 steps)
1. **Register** → Submit NGO details + documents
2. **Wait** → Admin verifies (manual approval)
3. **Login** → Access after verification
4. **Setup** → Add locations + set capacity
5. **Receive** → Get donation request notification
6. **Confirm** → Accept request + get donor contact
7. **Complete** → Mark donation received

### Admin Journey (4 steps)
1. **Verify** → Review & approve/reject NGO registrations
2. **Monitor** → Check platform health & activity
3. **Manage** → Edit users if needed
4. **Report** → Generate analytics & export data

---

## 🔧 Technical Architecture

```
┌─────────────────────┐
│  Ionic React PWA    │ ← Frontend (Mobile-first)
│  (Vite + TypeScript)│
└──────────┬──────────┘
           │ HTTPS/REST
           ▼
┌─────────────────────┐
│    NGINX Proxy      │ ← Reverse Proxy + SSL
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   FastAPI Backend   │ ← Python 3.11 + Uvicorn
│   (Async + SQLAlchemy)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PostgreSQL 15     │ ← Database
└─────────────────────┘
```

**Hosting:** Oracle Cloud Free Tier (Always-free VM)

---

## 📊 Database Schema (9 Tables)

1. **users** - Authentication & base user data
2. **donor_profiles** - Donor-specific information
3. **ngo_profiles** - NGO organization details
4. **ngo_locations** - NGO physical branches
5. **ngo_location_capacity** - Daily meal capacity tracking
6. **donation_requests** - Core donation transactions
7. **ratings** - Post-donation feedback
8. **notifications** - In-app notification system
9. **audit_logs** - Compliance & security logs

**Relationships:**
- Users → Profiles (1:1)
- NGO → Locations (1:many)
- Locations → Capacity (1:many)
- Locations → Requests (1:many)
- Requests → Ratings (1:1)

---

## 🔐 Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates & generates JWT
   ↓
3. JWT includes: user_id, email, role, is_verified
   ↓
4. Frontend stores JWT (memory/localStorage)
   ↓
5. All API calls include: Authorization: Bearer <JWT>
   ↓
6. Backend validates JWT + checks role permissions
```

**Token Expiry:**
- Access Token: 1 hour
- Refresh Token: 7 days

---

## 🌐 API Endpoints Quick Reference

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `PUT /auth/change-password` - Change password

### Donor
- `GET /donors/profile` - Get profile
- `PUT /donors/profile` - Update profile
- `GET /donors/dashboard` - Dashboard stats

### NGO Search
- `GET /donations/search` - Search NGOs (map/calendar)

### Donations
- `POST /donations/requests` - Create request
- `GET /donations/requests` - List requests
- `GET /donations/requests/{id}` - Request details
- `DELETE /donations/requests/{id}` - Cancel request

### NGO
- `GET /ngos/profile` - Get NGO profile
- `GET /ngos/dashboard` - NGO dashboard
- `GET /ngos/locations` - List locations
- `POST /ngos/locations` - Add location
- `POST /ngos/locations/{id}/capacity` - Set capacity
- `GET /donations/incoming` - Incoming requests
- `PUT /donations/requests/{id}/confirm` - Confirm
- `PUT /donations/requests/{id}/reject` - Reject
- `PUT /donations/requests/{id}/complete` - Mark complete

### Ratings
- `POST /ratings` - Create rating
- `GET /ratings/donor` - Ratings given
- `GET /ratings/ngo` - Ratings received

### Notifications
- `GET /notifications` - List notifications
- `GET /notifications/unread` - Unread count
- `PUT /notifications/{id}/read` - Mark read
- `PUT /notifications/read-all` - Mark all read

### Admin
- `GET /admin/dashboard` - Platform stats
- `GET /admin/ngos/pending` - Pending verifications
- `PUT /admin/ngos/{id}/verify` - Verify NGO
- `PUT /admin/ngos/{id}/reject` - Reject NGO
- `GET /admin/users` - List users
- `GET /admin/donations` - All donations
- `GET /admin/reports/export` - Export CSV

---

## 🎨 UI Components

### Common Components
- Button, Input, Select, Card, Modal, Loader
- Header, Footer, Sidebar, TabBar
- MapView, LocationPicker
- CalendarView
- NotificationList

### Pages by Role

**Donor Pages:**
- Login/Register
- DonorDashboard
- SearchNGOs (map + calendar views)
- CreateDonation
- DonationHistory
- DonorProfile

**NGO Pages:**
- NGODashboard
- ManageLocations
- ManageCapacity
- DonationRequests
- NGOProfile

**Admin Pages:**
- AdminDashboard
- NGOVerification
- UserManagement
- Reports

---

## 📱 Mobile-First Design Principles

1. **Touch-Friendly:** Minimum 44x44px tap targets
2. **Thumb-Friendly:** Important actions in bottom half
3. **Progressive:** Desktop gets enhanced features
4. **Fast:** < 3 second page load on 3G
5. **Offline-Ready:** Basic caching for viewed data

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

## 🚨 Error Handling

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input
- `AUTHENTICATION_FAILED` - Wrong credentials
- `NGO_NOT_VERIFIED` - NGO not approved yet
- `INSUFFICIENT_CAPACITY` - Not enough capacity
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## 🔍 Search & Filter Options

### Map Search
- **Input:** Latitude, Longitude
- **Filters:**
  - Radius (1km, 5km, 10km, 25km, 50km)
  - Date (today, tomorrow, future date)
  - Meal Type (breakfast, lunch, dinner)
  - Minimum Capacity
  - NGO Name (search)

**Distance Calculation:** Haversine formula (accurate to ~1m)

### Calendar Search
- **Input:** Date range
- **Filters:** Same as map search
- **View:** List view with availability indicators

---

## 📈 Capacity Management Logic

### How It Works:
1. NGO sets total capacity per location/meal/date
2. `available_capacity` = `total_capacity` initially
3. When donation **confirmed**: `available_capacity -= num_plates`
4. When donation **rejected/cancelled**: `available_capacity += num_plates`
5. NGO can toggle `is_available = false` to hide from search

### Example:
```
Location: Downtown Branch
Date: 2026-01-20
Meal: Lunch
Total Capacity: 150 plates
Available: 150 plates

→ Donor requests 50 plates (status: pending)
→ NGO confirms request
→ Available: 100 plates ✓

→ Another donor requests 30 plates
→ Available: 70 plates (if confirmed)
```

---

## 🔔 Notification Types

| Type | Recipient | Trigger |
|------|-----------|---------|
| `donation_request` | NGO | Donor creates request |
| `request_confirmed` | Donor | NGO confirms request |
| `request_rejected` | Donor | NGO rejects request |
| `donation_completed` | Both | Either marks complete |
| `verification_approved` | NGO | Admin approves registration |
| `verification_rejected` | NGO | Admin rejects registration |

---

## ⭐ Rating System

- **Scale:** 1-5 stars (integer)
- **Who:** Only donors can rate
- **When:** Only after donation completed
- **Limit:** One rating per donation
- **Display:**
  - NGO profile: Average rating + total count
  - Search results: Average rating shown
  - Admin reports: Rating distribution

**Calculation:**
```
avg_rating = SUM(ratings) / COUNT(ratings)
```

---

## 📊 Dashboard Metrics

### Donor Dashboard
- Total donations completed
- Total plates donated
- Pending/Confirmed requests
- Average rating received
- Recent donations (last 10)

### NGO Dashboard
- Total donations received
- Total plates received
- Pending requests
- Average rating
- Total locations
- Capacity utilization (today)
- Recent donations (last 10)

### Admin Dashboard
- Total users (by role)
- Pending NGO verifications
- Total/completed donations
- Donations this month
- Top donors (by plates)
- Top NGOs (by donations)
- Recent activity feed

---

## 🔒 Security Measures

### Application Security
- ✅ HTTPS only (HTTP → HTTPS redirect)
- ✅ JWT authentication
- ✅ Password hashing (bcrypt, cost 12)
- ✅ Role-based access control
- ✅ Input validation (Pydantic/Zod)
- ✅ SQL injection prevention (ORM)
- ✅ XSS protection (sanitization)
- ✅ CORS whitelist
- ✅ Rate limiting

### Data Security
- ✅ Encryption in transit (TLS 1.3)
- ✅ Government IDs encrypted
- ✅ Audit logs (immutable)
- ✅ No sensitive data in logs

### Infrastructure Security
- ✅ Firewall (ports 22, 80, 443 only)
- ✅ SSH key authentication only
- ✅ Database not publicly accessible
- ✅ Environment variables secured

---

## 💰 Cost Breakdown

### Year 1
| Item | Service | Cost |
|------|---------|------|
| Compute | Oracle Cloud Free Tier | $0 |
| Database | Self-hosted PostgreSQL | $0 |
| Storage | Oracle Object Storage (20GB) | $0 |
| Domain | Namecheap (.org) | $12 |
| SSL | Let's Encrypt | $0 |
| CDN | Cloudflare Free | $0 |
| **Total** | | **$12/year** |

### Scaling (Future)
- **Light traffic** (100-1000 users): $0-20/month
- **Medium traffic** (1K-10K users): $50-100/month
- **Heavy traffic** (10K+ users): $200-500/month

---

## 🧪 Testing Strategy

### Backend Tests
- Unit tests (pytest)
- Integration tests (API endpoints)
- Database tests (migrations, triggers)

### Frontend Tests
- Component tests (React Testing Library)
- Integration tests (user flows)
- E2E tests (future: Cypress)

### Manual Testing
- Cross-browser (Chrome, Firefox, Safari)
- Cross-device (mobile, tablet, desktop)
- Cross-platform (Windows, macOS, Linux, iOS, Android)

---

## 🚀 Deployment Steps (Simplified)

1. **Provision Oracle Cloud VM** (10 min)
2. **Install dependencies** (Python, Node, PostgreSQL, NGINX) (20 min)
3. **Deploy backend** (clone, setup, migrations) (20 min)
4. **Deploy frontend** (build, copy to nginx) (15 min)
5. **Configure NGINX** (reverse proxy, SSL) (15 min)
6. **Obtain SSL certificate** (Let's Encrypt) (10 min)
7. **Setup backups** (cron job) (10 min)
8. **Test & verify** (20 min)

**Total:** ~2 hours

---

## 🐛 Common Issues & Solutions

### Issue: NGO can't login after registration
**Solution:** Check verification status. Admin must approve first.

### Issue: Map not loading
**Solution:** Check latitude/longitude are valid. Ensure internet connection for OpenStreetMap tiles.

### Issue: Capacity not updating
**Solution:** Check database triggers are created. Run migrations again.

### Issue: Notifications not appearing
**Solution:** Check notification service is creating records. Verify frontend is polling/fetching.

### Issue: JWT token expired
**Solution:** Implement refresh token logic. Frontend should refresh before expiry.

### Issue: CORS errors
**Solution:** Verify frontend origin is whitelisted in FastAPI CORS middleware.

---

## 📝 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/plates_for_people

# JWT
JWT_SECRET_KEY=your-super-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# App
DEBUG=false
ALLOWED_ORIGINS=https://platesforpeople.org

# File Upload
MAX_UPLOAD_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=pdf,jpeg,jpg,png

# Oracle Object Storage (optional)
OCI_BUCKET_NAME=plates-for-people-docs
OCI_REGION=us-ashburn-1
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://api.platesforpeople.org/api/v1
VITE_APP_NAME=Plates for People
VITE_MAP_DEFAULT_CENTER_LAT=41.8781
VITE_MAP_DEFAULT_CENTER_LNG=-87.6298
VITE_MAP_DEFAULT_ZOOM=13
```

---

## 📚 Useful Commands

### Backend
```bash
# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Run tests
pytest

# Check code style
black app/
flake8 app/

# Database backup
pg_dump -U pfp_user plates_for_people > backup.sql

# Restore database
psql -U pfp_user plates_for_people < backup.sql
```

### Frontend
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Deployment
```bash
# Backend service
sudo systemctl start pfp-api
sudo systemctl stop pfp-api
sudo systemctl restart pfp-api
sudo systemctl status pfp-api
sudo journalctl -u pfp-api -f  # View logs

# NGINX
sudo nginx -t                  # Test config
sudo systemctl reload nginx    # Reload config
sudo systemctl restart nginx   # Restart service

# SSL renewal
sudo certbot renew --dry-run   # Test renewal
sudo certbot renew             # Actual renewal

# Database
sudo -u postgres psql          # Connect as postgres
psql -U pfp_user -d plates_for_people  # Connect as app user
```

---

## 📖 Additional Resources

### Documentation
- [Project Overview](./01-PROJECT-OVERVIEW.md)
- [User Personas](./02-USER-PERSONAS.md)
- [Database Design & ERD](./03-DATABASE-DESIGN-ERD.md)
- [Technical Architecture](./04-TECHNICAL-ARCHITECTURE.md)
- [Execution Plan](./05-EXECUTION-PLAN.md)
- [API Specification](./06-API-SPECIFICATION.md)

### External Links
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Ionic React Docs](https://ionicframework.com/docs/react)
- [Leaflet Docs](https://leafletjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)

---

## 🤝 Support & Contributing

### Getting Help
1. Check documentation (this guide)
2. Search GitHub issues
3. Create new issue with details
4. Email: support@platesforpeople.org

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Write/update tests
5. Submit pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎯 Next Steps

### Immediate (Week 1)
- [ ] Monitor error logs
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Gather user feedback

### Short-term (Month 1)
- [ ] Email notifications
- [ ] SMS alerts (critical only)
- [ ] Enhanced search filters
- [ ] Mobile app (Capacitor)

### Long-term (Quarter 1)
- [ ] Payment integration (donations)
- [ ] Volunteer management
- [ ] Pickup/delivery tracking
- [ ] Multi-language support
- [ ] Analytics improvements

---

## ✅ Pre-Launch Checklist

### Technical
- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificate active
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] Error tracking enabled

### Content
- [ ] Seed data loaded (demo accounts)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Help documentation available
- [ ] Contact information visible

### Security
- [ ] Security audit completed
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Sensitive data encrypted
- [ ] Audit logs working

### Performance
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Database queries optimized
- [ ] Images compressed
- [ ] CDN configured

---

**Last Updated:** January 16, 2026  
**Version:** 1.0.0  
**Maintainer:** Plates for People Team
