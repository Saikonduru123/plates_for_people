# Plates for People - Project Overview

## Executive Summary
**Plates for People** is a food donation platform that connects food donors (restaurants, individuals, organizations) with registered NGOs to reduce food waste and combat hunger across the United States and India.

**Timeline**: 2 Days (Production Ready)
**Geographic Scope**: Nationwide (US & India)
**Approach**: Mobile-First Responsive Web Application

---

## Project Vision
Create a simple, efficient platform that facilitates connections between food donors and verified NGOs, eliminating food waste while feeding those in need.

---

## Core Value Proposition
- **For Donors**: Easy discovery of nearby NGOs accepting food donations with real-time availability
- **For NGOs**: Streamlined management of donation capacity and incoming requests
- **For Admins**: Comprehensive oversight, verification, and analytics capabilities

---

## Key Features

### 1. Donor Features
- **NGO Discovery**
  - Map-based search with radius filter (1km, 5km, 10km, 25km, 50km)
  - Calendar-based availability search
  - Advanced filters (meal type, availability, NGO name)
- **Donation Request Management**
  - Raise donation requests to specific NGOs
  - Track request status (Pending, Confirmed, Rejected, Completed)
  - View donation history
- **Dashboard**
  - Total donations offered
  - Recent donation activities
  - Pending requests

### 2. NGO Features
- **Multi-Location Management**
  - Register multiple offices/branches
  - Set location via map pin-drop
  - Define capacity per location (plates per meal)
- **Capacity Management**
  - Set meal-wise capacity (Breakfast, Lunch, Dinner)
  - Daily availability toggle
  - Real-time capacity tracking based on confirmed donations
- **Request Management**
  - View incoming donation requests
  - Accept/Reject requests
  - Contact details shared upon confirmation
- **Dashboard**
  - Total donations received
  - Recent donation activities
  - Capacity utilization metrics

### 3. Admin Features
- **NGO Verification**
  - Review NGO registration applications
  - Manual verification if API verification fails
  - Approve/Reject registrations
- **User Management**
  - View all donors and NGOs
  - Edit user details if necessary
  - Suspend/Activate accounts
- **Analytics Dashboard**
  - Platform-wide donation statistics
  - NGO-level reports
  - Donor-level reports
  - Date range filtering
  - Export reports (CSV, Excel)

### 4. Rating & Feedback System
- Post-donation ratings (1-5 stars)
- Text feedback
- Visible on NGO profiles

### 5. Notification System
- In-app notifications for:
  - Request received
  - Request confirmed/rejected
  - Donation completed
  - Account verification status

---

## Technical Constraints & Decisions

### Must-Have
- Mobile-first responsive design
- Works seamlessly in US and India
- English language only
- Role-based access control (RBAC)
- NGO verification system
- No real-time tracking (async operations)

### Explicitly Out of Scope
- Volunteer management
- Pickup/delivery logistics
- Food quality verification
- Real-time location tracking
- Multi-language support
- SMS notifications
- Payment processing
- SSO authentication

---

## Success Metrics
- Number of successful donation connections
- NGO verification turnaround time
- Platform adoption rate
- Average donation fulfillment time
- User satisfaction ratings

---

## Risk Mitigation
1. **NGO Verification Delays**: Manual backup verification process
2. **Capacity Management**: Automated calculation prevents overbooking
3. **Communication Gaps**: Contact details shared immediately upon confirmation
4. **Data Accuracy**: Pin-drop location ensures precise addresses

---

## Project Timeline: 2-Day Sprint

### Day 1 (8-10 hours)
- **Morning**: Setup project structure, database schema, authentication
- **Afternoon**: Core APIs (User, NGO, Donation Request CRUD)
- **Evening**: Admin verification system, basic frontend setup

### Day 2 (8-10 hours)
- **Morning**: Map integration, calendar views, search/filter logic
- **Afternoon**: Dashboards, notifications, rating system
- **Evening**: Testing, bug fixes, deployment

---

## Cost Optimization Strategy
- Use free-tier services wherever possible
- Oracle Cloud Free Tier for hosting
- PostgreSQL (self-hosted or Oracle Autonomous DB Free Tier)
- OpenStreetMap + Leaflet (free map solution)
- Minimal third-party dependencies
- Efficient database indexing
- CDN for static assets (Cloudflare Free)

---

## Regulatory Considerations (Post-MVP)
- State-specific food donation laws (US)
- Good Samaritan Food Donation Act compliance
- India's food safety standards
- Data privacy (GDPR, local laws)
- NGO verification documentation requirements
