import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DonorDashboard from './pages/donor/DonorDashboard';
import SearchNGOs from './pages/donor/SearchNGOs';
import NGODetails from './pages/donor/NGODetails';
import CreateDonation from './pages/donor/CreateDonation';
import DonationDetails from './pages/donor/DonationDetails';
import DonationHistory from './pages/donor/DonationHistory';
import RateNGO from './pages/donor/RateNGO';
import NGODashboard from './pages/ngo/NGODashboard';
import ManageDonations from './pages/ngo/ManageDonations';
import ManageLocations from './pages/ngo/ManageLocations';
import AddEditLocation from './pages/ngo/AddEditLocation';
import ManageCapacity from './pages/ngo/ManageCapacity';
import ViewRatings from './pages/ngo/ViewRatings';
import ProfileSettings from './pages/ngo/ProfileSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyNGOs from './pages/admin/VerifyNGOs';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

// Protected Route component
const ProtectedRoute: React.FC<{ component: React.FC<any>; exact?: boolean; path: string }> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <IonSpinner />
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

// Main app routing
const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <IonSpinner />
      </div>
    );
  }

  return (
    <IonRouterOutlet>
      {/* Public Routes */}
      <Route exact path="/login" component={Login} />
      <Route exact path="/register" component={Register} />

      {/* Protected Routes - Donor */}
      <Route exact path="/donor/dashboard">
        {isAuthenticated && user?.role === 'donor' ? (
          <DonorDashboard />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/donor/search-ngos">
        {isAuthenticated && user?.role === 'donor' ? (
          <SearchNGOs />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/donor/ngo/:id">
        {isAuthenticated && user?.role === 'donor' ? (
          <NGODetails />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/donor/create-donation">
        {isAuthenticated && user?.role === 'donor' ? (
          <CreateDonation />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/donor/donation/:id">
        {isAuthenticated && user?.role === 'donor' ? (
          <DonationDetails />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/donor/donations">
        {isAuthenticated && user?.role === 'donor' ? (
          <DonationHistory />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/donor/rate/:donation_id">
        {isAuthenticated && user?.role === 'donor' ? (
          <RateNGO />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* NGO Routes */}
      <Route exact path="/ngo/dashboard">
        {isAuthenticated && user?.role === 'ngo' ? (
          <NGODashboard />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/donations">
        {isAuthenticated && user?.role === 'ngo' ? (
          <ManageDonations />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/locations">
        {isAuthenticated && user?.role === 'ngo' ? (
          <ManageLocations />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/locations/add">
        {isAuthenticated && user?.role === 'ngo' ? (
          <AddEditLocation />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/locations/edit/:id">
        {isAuthenticated && user?.role === 'ngo' ? (
          <AddEditLocation />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/capacity">
        {isAuthenticated && user?.role === 'ngo' ? (
          <ManageCapacity />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/ratings">
        {isAuthenticated && user?.role === 'ngo' ? (
          <ViewRatings />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/ngo/profile">
        {isAuthenticated && user?.role === 'ngo' ? (
          <ProfileSettings />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Admin Routes */}
      <Route exact path="/admin/dashboard">
        {isAuthenticated && user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route exact path="/admin/verify-ngos">
        {isAuthenticated && user?.role === 'admin' ? (
          <VerifyNGOs />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Dashboard Route - Redirect based on role */}
      <Route exact path="/dashboard">
        {isAuthenticated ? (
          user?.role === 'donor' ? (
            <Redirect to="/donor/dashboard" />
          ) : user?.role === 'ngo' ? (
            <Redirect to="/ngo/dashboard" />
          ) : user?.role === 'admin' ? (
            <Redirect to="/admin/dashboard" />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>Unknown role</h1>
            </div>
          )
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Default Route */}
      <Route exact path="/">
        <Redirect to={isAuthenticated ? '/dashboard' : '/login'} />
      </Route>
    </IonRouterOutlet>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
