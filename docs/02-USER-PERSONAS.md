# User Personas - Plates for People

## Overview
This document defines the three primary user personas for the Plates for People platform, their goals, pain points, and user journeys.

---

## Persona 1: Sarah - The Restaurant Manager (Donor)

### Demographics
- **Age**: 35
- **Location**: Chicago, USA
- **Occupation**: Restaurant Manager at a mid-sized Italian restaurant
- **Tech Savviness**: Medium (comfortable with smartphones and web apps)

### Background
Sarah manages a restaurant that often has surplus food at the end of the day. She wants to donate this food rather than waste it but struggles to find reliable NGOs and coordinate donations consistently.

### Goals
- Quickly find nearby NGOs that are accepting food donations
- Ensure food reaches people in need before it spoils
- Track donation history for potential tax benefits
- Build a positive community reputation for her restaurant

### Pain Points
- Doesn't know which NGOs are accepting donations on a given day
- Wastes time calling multiple organizations
- Uncertain about NGO legitimacy
- Needs to coordinate pickup/delivery schedules
- Wants transparency in the donation process

### User Journey
1. **Discovery**: Opens app after closing shift with leftover food
2. **Search**: Uses map to find NGOs within 5km radius accepting dinner donations
3. **Selection**: Filters by availability for today, reviews NGO ratings
4. **Request**: Submits donation request (50 plates of pasta)
5. **Confirmation**: Receives notification that NGO accepted request
6. **Coordination**: Views NGO contact details, arranges pickup time
7. **Completion**: Marks donation as completed, leaves rating/feedback
8. **Tracking**: Views donation history on dashboard

### Technical Needs
- Mobile-responsive interface (often uses phone during shift)
- Simple, intuitive search and filter options
- Quick request submission (minimal form fields)
- Clear notification system
- Easy access to contact information

### Quote
*"I want to make sure good food goes to people who need it, not the trash bin. But I need to know who's accepting donations today and how to reach them quickly."*

---

## Persona 2: Rajesh - The NGO Coordinator (NGO User)

### Demographics
- **Age**: 42
- **Location**: Mumbai, India
- **Occupation**: Operations Manager at "Feeding Hands NGO"
- **Organization Size**: 3 locations serving 500+ people daily
- **Tech Savviness**: Medium-Low (uses WhatsApp, basic apps)

### Background
Rajesh coordinates food distribution across three shelter locations. His organization relies on food donations but struggles with unpredictable supply and managing capacity across multiple sites.

### Goals
- Manage donation capacity across multiple locations
- Ensure consistent food supply for beneficiaries
- Avoid over-commitment or wasted donor trips
- Build trust with donors through reliable communication
- Track donation patterns for planning

### Pain Points
- Receives calls at random times from donors
- Difficult to track capacity across multiple locations
- Sometimes overbooks and has to turn away donors
- Lacks visibility into donation trends
- Manual record-keeping is time-consuming
- Verification process is unclear

### User Journey
1. **Registration**: Submits NGO registration with government documents
2. **Verification**: Waits for admin approval (receives notification)
3. **Setup**: Adds three location branches with map pin-drop
4. **Capacity Setting**: Sets breakfast (100 plates), lunch (150 plates), dinner (200 plates) for each location
5. **Daily Management**: Toggles availability based on current needs
6. **Request Handling**: Receives donation request notification
7. **Evaluation**: Reviews donor details, donation quantity
8. **Confirmation**: Accepts request, views donor contact info
9. **Coordination**: Calls/messages donor to arrange pickup
10. **Tracking**: Marks donation as received, capacity auto-updates

### Technical Needs
- Simple capacity management interface
- Clear request notification system
- Easy toggle for daily availability
- Multi-location support with visual map
- Dashboard showing real-time capacity status
- Mobile-accessible (often manages on-the-go)

### Quote
*"We want to accept every donation we can, but we need to know our limits. Having a clear system helps us serve our community better and never waste a donor's effort."*

---

## Persona 3: Amanda - The Platform Administrator (Admin)

### Demographics
- **Age**: 29
- **Location**: Remote (US-based)
- **Occupation**: Platform Operations Manager
- **Tech Savviness**: High (comfortable with admin dashboards, data analysis)

### Background
Amanda oversees the Plates for People platform, ensuring NGOs are legitimate, monitoring platform health, and generating reports for stakeholders. She manages user issues and maintains platform integrity.

### Goals
- Verify NGO legitimacy quickly and accurately
- Monitor platform usage and growth metrics
- Generate reports for stakeholders and funders
- Identify and resolve user issues
- Ensure data quality and accuracy
- Prevent fraud or misuse

### Pain Points
- Manual NGO verification is time-consuming
- Needs comprehensive view of platform activity
- Requires flexible reporting for different stakeholders
- Must balance quick approvals with thorough verification
- Limited time to review all details

### User Journey
1. **Daily Login**: Reviews pending NGO registrations
2. **Verification**: Checks NGO documents, cross-references with government databases
3. **Decision**: Approves or requests additional information
4. **Monitoring**: Reviews dashboard for unusual activity patterns
5. **Report Generation**: Filters donations by date range, exports CSV
6. **Issue Resolution**: Edits user details if needed, investigates complaints
7. **Analytics Review**: Analyzes trends (popular areas, peak times, top donors/NGOs)

### Technical Needs
- Comprehensive admin dashboard
- Efficient verification workflow
- Advanced filtering and search capabilities
- Export functionality (CSV, Excel)
- User management tools
- Audit logs for all actions
- Data visualization (charts, graphs)

### Quote
*"I need to ensure every NGO on our platform is legitimate while keeping the approval process fast. Data-driven insights help us grow the platform and attract funding."*

---

## Role-Based Access Control (RBAC) Summary

### Role: Donor
**Permissions:**
- Create donation requests
- View own donation history
- Search and view NGO profiles
- Rate and review NGOs
- Update own profile
- View own dashboard

**Restrictions:**
- Cannot access NGO management features
- Cannot view other donors' data
- Cannot access admin functions

---

### Role: NGO
**Permissions:**
- Manage multiple locations
- Set capacity and availability
- View and respond to donation requests
- View donation history for own organization
- Update organization profile
- View own dashboard
- View donor contact details (only for confirmed requests)

**Restrictions:**
- Cannot access other NGOs' data
- Cannot create donation requests
- Cannot access admin functions
- **Cannot login until verified by admin**

---

### Role: Admin
**Permissions:**
- Full access to all platform data
- Verify/reject NGO registrations
- Edit user and NGO profiles
- View all donation requests and history
- Generate platform-wide reports
- Suspend/activate user accounts
- Access audit logs
- Export data

**Restrictions:**
- Cannot delete historical donation records (audit trail)
- Cannot impersonate users (view only)

---

## User Persona Comparison Matrix

| Aspect | Sarah (Donor) | Rajesh (NGO) | Amanda (Admin) |
|--------|---------------|--------------|----------------|
| **Primary Goal** | Donate surplus food | Receive consistent donations | Ensure platform integrity |
| **Frequency of Use** | 2-3 times/week | Daily | Daily |
| **Device** | Mobile (70%) | Mobile (60%) | Desktop (80%) |
| **Time Spent** | 5-10 min/session | 15-30 min/session | 1-2 hours/day |
| **Key Feature** | Map search | Capacity management | Analytics dashboard |
| **Pain Point** | Finding available NGOs | Managing capacity | Verification speed |
| **Success Metric** | Donations completed | Donations received | NGOs verified |

---

## Design Implications

### For Donors
- Large, touch-friendly buttons for mobile
- Map as primary interface
- Quick filters (distance, meal type, date)
- Minimal form fields for requests
- Clear status indicators

### For NGOs
- Multi-step registration wizard
- Visual capacity indicators (progress bars)
- Toggle switches for easy availability updates
- Notification badges for new requests
- Simple accept/reject buttons

### For Admins
- Data-dense dashboards
- Sortable, filterable tables
- Bulk action capabilities
- Export buttons prominently placed
- Search across all entities

---

## Accessibility Considerations
- Color-blind friendly design (don't rely solely on color for status)
- Screen reader compatible
- Keyboard navigation support
- Minimum touch target size: 44x44px
- High contrast text
- Clear error messages

---

## Internationalization Notes (Future)
While the MVP only supports English, the platform should be designed with i18n in mind:
- Date/time formatting (US vs India)
- Measurement units (miles vs kilometers)
- Phone number formats
- Address formats
- Currency (if payments added later)
