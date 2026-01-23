import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonButtons,
} from '@ionic/react';
import {
  peopleOutline,
  businessOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  fastFoodOutline,
  statsChartOutline,
  logOutOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import NotificationBell from '../../components/NotificationBell';
import type { AdminDashboard } from '../../types';
import './AdminDashboard.css';

const AdminDashboardPage: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const [present] = useIonToast();

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getDashboard();
      setDashboard(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to load dashboard';
      setError(message);
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDashboard();
    event.detail.complete();
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Admin Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" style={{ '--padding-start': '8px', '--padding-end': '8px' }}>
              <NotificationBell />
            </IonButton>
            <IonButton fill="clear" onClick={handleLogout} className="logout-button">
              <IonIcon icon={logOutOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="admin-dashboard">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>Welcome, {user?.email?.split('@')[0] || 'Admin'}</h1>
            <p className="subtitle">System Overview & Management</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <IonCard className="stat-card">
              <IonCardContent>
                <div className="stat-icon" style={{ backgroundColor: '#3880ff20' }}>
                  <IonIcon icon={peopleOutline} color="primary" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{dashboard.total_users}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="stat-card">
              <IonCardContent>
                <div className="stat-icon" style={{ backgroundColor: '#10dc6020' }}>
                  <IonIcon icon={businessOutline} color="success" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{dashboard.verified_ngos + dashboard.pending_verifications}</div>
                  <div className="stat-label">Total NGOs</div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="stat-card">
              <IonCardContent>
                <div className="stat-icon" style={{ backgroundColor: '#ffc40920' }}>
                  <IonIcon icon={hourglassOutline} color="warning" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{dashboard.pending_verifications}</div>
                  <div className="stat-label">Pending Verifications</div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="stat-card">
              <IonCardContent>
                <div className="stat-icon" style={{ backgroundColor: '#10dc6020' }}>
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{dashboard.verified_ngos}</div>
                  <div className="stat-label">Verified NGOs</div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="stat-card">
              <IonCardContent>
                <div className="stat-icon" style={{ backgroundColor: '#f4772620' }}>
                  <IonIcon icon={fastFoodOutline} color="danger" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{dashboard.total_donations}</div>
                  <div className="stat-label">Total Donations</div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="stat-card">
              <IonCardContent>
                <div className="stat-icon" style={{ backgroundColor: '#3880ff20' }}>
                  <IonIcon icon={statsChartOutline} color="primary" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{dashboard.completed_donations}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            <IonGrid>
              <IonRow>
                <IonCol sizeLg="4" sizeMd="4" size="12">
                  <IonCard className="action-card" button onClick={() => history.push('/admin/verify-ngos')}>
                    <IonCardContent>
                      <IonIcon icon={businessOutline} className="action-icon" />
                      <div className="action-label">Verify NGOs</div>
                      {dashboard.pending_verifications > 0 && (
                        <IonBadge color="warning" className="action-badge">
                          {dashboard.pending_verifications}
                        </IonBadge>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol sizeLg="4" sizeMd="4" size="12">
                  <IonCard className="action-card" button onClick={() => history.push('/admin/users')}>
                    <IonCardContent>
                      <IonIcon icon={peopleOutline} className="action-icon" />
                      <div className="action-label">Manage Users</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol sizeLg="4" sizeMd="4" size="12">
                  <IonCard className="action-card" button onClick={() => history.push('/admin/reports')}>
                    <IonCardContent>
                      <IonIcon icon={statsChartOutline} className="action-icon" />
                      <div className="action-label">View Reports</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>

          {/* System Status */}
          <IonCard>
            <IonCardContent>
              <h3 className="section-title">System Status</h3>
              <div className="status-item">
                <span>Platform Status</span>
                <IonBadge color="success">Operational</IonBadge>
              </div>
              <div className="status-item">
                <span>Active Users</span>
                <strong>{dashboard.active_users}</strong>
              </div>
              <div className="status-item">
                <span>Pending Actions</span>
                <IonBadge color={dashboard.pending_verifications > 0 ? 'warning' : 'success'}>{dashboard.pending_verifications}</IonBadge>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboardPage;
