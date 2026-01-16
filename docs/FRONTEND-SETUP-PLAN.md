# Frontend Development Plan - Plates for People

## Technology Stack

### Core Framework: **Ionic React + Capacitor**
- **Ionic Framework 8**: Mobile-first UI components
- **React 18**: Modern React with hooks
- **TypeScript**: Type safety throughout
- **Capacitor 6**: Native mobile capabilities
- **Vite**: Fast build tool

### Key Libraries:
1. **Routing**: React Router (built into Ionic)
2. **State Management**: React Context + Zustand (lightweight)
3. **API Client**: Axios with interceptors
4. **Maps**: Leaflet (lightweight) or Google Maps
5. **Forms**: React Hook Form + Zod validation
6. **Date Handling**: date-fns
7. **Icons**: Ionicons (built-in)
8. **Styling**: Ionic CSS + Custom CSS Variables

### Mobile Features:
- ✅ **Geolocation**: Find nearby NGOs
- ✅ **Camera**: Upload verification documents
- ✅ **Push Notifications**: Real-time donation updates
- ✅ **Offline Mode**: PWA with service workers
- ✅ **Native Navigation**: iOS/Android navigation patterns
- ✅ **Biometric Auth**: Fingerprint/Face ID (optional)

## Project Structure

```
frontend/
├── public/
│   ├── assets/
│   │   ├── icon/          # App icons
│   │   └── images/        # Static images
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/        # Buttons, Cards, etc
│   │   ├── forms/         # Form components
│   │   ├── maps/          # Map components
│   │   └── notifications/ # Notification components
│   ├── pages/            # Route pages
│   │   ├── auth/         # Login, Register
│   │   ├── donor/        # Donor pages
│   │   ├── ngo/          # NGO pages
│   │   └── admin/        # Admin pages
│   ├── services/         # API services
│   │   ├── api.ts        # Axios instance
│   │   ├── authService.ts
│   │   ├── donationService.ts
│   │   ├── ngoService.ts
│   │   └── notificationService.ts
│   ├── context/          # React Context
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useGeolocation.ts
│   │   └── useNotifications.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Helper functions
│   │   ├── storage.ts    # Local storage
│   │   └── validation.ts # Validators
│   ├── theme/            # Theming
│   │   ├── variables.css
│   │   └── global.css
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── routes.tsx        # Route configuration
├── capacitor.config.ts   # Capacitor config
├── ionic.config.json     # Ionic config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Pages to Build (Priority Order)

### Phase 1: Authentication & Core (Hours 1-3)
1. **Splash Screen** - App loading
2. **Onboarding** - Welcome slides
3. **Login Page** - Email/password
4. **Register Page** - Donor/NGO selection
5. **Forgot Password** - Password reset

### Phase 2: Donor Flow (Hours 4-6)
6. **Donor Dashboard** - Stats, quick actions
7. **Search NGOs** - Map + list view
8. **NGO Details** - Location info, ratings
9. **Create Donation** - Form with date/time picker
10. **Donation History** - List of donations
11. **Rate NGO** - 5-star rating + feedback

### Phase 3: NGO Flow (Hours 7-9)
12. **NGO Registration** - Multi-step form
13. **NGO Dashboard** - Incoming requests, stats
14. **Manage Locations** - Add/edit locations
15. **Set Capacity** - Calendar view
16. **Donation Requests** - Confirm/reject
17. **NGO Profile** - View/edit profile

### Phase 4: Admin & Polish (Hours 10-12)
18. **Admin Dashboard** - System overview
19. **NGO Verification** - Approve/reject
20. **User Management** - List users
21. **Notifications Center** - View all notifications
22. **Settings** - User preferences
23. **Profile** - Edit user profile

## Mobile-Specific Features

### 1. **Responsive Design**
```css
/* Mobile first approach */
@media (min-width: 768px) {
  /* Tablet */
}
@media (min-width: 1024px) {
  /* Desktop */
}
```

### 2. **Touch Gestures**
- Swipe to delete notifications
- Pull to refresh lists
- Swipe between tabs
- Long press for actions

### 3. **Native Feel**
- iOS: Cupertino style (back swipe, bottom tabs)
- Android: Material Design (FAB, top tabs)
- Auto-detection based on platform

### 4. **Offline Support**
- Cache API responses
- Queue actions when offline
- Sync when back online
- Show offline indicator

### 5. **Performance**
- Lazy loading routes
- Virtual scrolling for long lists
- Image optimization
- Code splitting

## Implementation Steps

### Step 1: Setup Project (30 min)
```bash
# Install Ionic CLI globally
npm install -g @ionic/cli

# Create Ionic React app
ionic start plates-for-people blank --type=react

# Add dependencies
cd plates-for-people
npm install axios react-hook-form zod zustand date-fns leaflet react-leaflet
npm install -D @types/leaflet

# Add Capacitor for mobile
ionic integrations enable capacitor
```

### Step 2: Configure Environment (15 min)
```typescript
// src/config/environment.ts
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  GOOGLE_MAPS_KEY: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  APP_NAME: 'Plates for People',
  VERSION: '1.0.0'
};
```

### Step 3: Setup API Client (30 min)
```typescript
// src/services/api.ts
import axios from 'axios';
import { config } from '../config/environment';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors, refresh token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 4: Create Auth Context (45 min)
```typescript
// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: number;
  email: string;
  role: 'donor' | 'ngo' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.me();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('accessToken', response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 5: Build Core Components (2-3 hours)
- Loading spinner
- Error boundary
- Toast notifications
- Modal dialogs
- Form inputs
- Cards
- Lists

### Step 6: Implement Pages (8-10 hours)
Follow the page priority list above

### Step 7: Add Mobile Features (2-3 hours)
- Geolocation
- Camera
- Push notifications
- Offline support

### Step 8: Testing (2 hours)
- Test on iOS simulator
- Test on Android emulator
- Test on real devices
- Test offline mode
- Test different screen sizes

## Mobile Deployment

### iOS (App Store)
```bash
# Build iOS app
ionic capacitor add ios
ionic capacitor copy ios
ionic capacitor open ios

# In Xcode:
# - Configure signing
# - Set app icons
# - Build & archive
# - Submit to App Store
```

### Android (Play Store)
```bash
# Build Android app
ionic capacitor add android
ionic capacitor copy android
ionic capacitor open android

# In Android Studio:
# - Configure signing
# - Set app icons
# - Build APK/AAB
# - Submit to Play Store
```

### PWA (Web)
```bash
# Build for web
npm run build

# Deploy to hosting (Netlify, Vercel, etc)
# Works offline with service workers
```

## Responsive Breakpoints

```typescript
// src/utils/responsive.ts
export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};
```

## Testing Strategy

### Unit Tests
- Jest + React Testing Library
- Test components in isolation
- Test hooks
- Test utilities

### Integration Tests
- Test page flows
- Test API integration
- Test state management

### E2E Tests
- Cypress or Playwright
- Test complete user journeys
- Test on mobile viewports

### Device Testing
- iOS Safari
- Android Chrome
- Various screen sizes
- Touch interactions

## Performance Optimization

1. **Code Splitting**: Lazy load routes
2. **Image Optimization**: Compress, use WebP
3. **API Caching**: Cache GET requests
4. **Virtual Scrolling**: For long lists
5. **Bundle Size**: Analyze and optimize
6. **Service Workers**: Cache static assets

## Accessibility (a11y)

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode
- ✅ Touch target size (44px minimum)

## Estimated Timeline

**Total: 16-20 hours for complete frontend**

- Hours 1-3: Setup + Auth + Core Components
- Hours 4-6: Donor Flow
- Hours 7-9: NGO Flow
- Hours 10-12: Admin + Polish
- Hours 13-16: Mobile features + Testing
- Hours 17-20: Bug fixes + Optimization

## Next Immediate Steps

1. ✅ Create Ionic React project
2. ✅ Install dependencies
3. ✅ Configure environment
4. ✅ Setup folder structure
5. ✅ Create API client
6. ✅ Build Auth Context
7. → Start with Login page

---

**Ready to start implementation?**

Choose approach:
- **A**: Full Ionic (best for mobile + web)
- **B**: React + Tailwind (web-focused, mobile-responsive)
- **C**: React Native (pure mobile only)

**Recommendation: Option A (Ionic)** - gives us everything we need!
