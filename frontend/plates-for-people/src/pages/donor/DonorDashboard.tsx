import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import {
  logOutOutline,
  checkmarkCircleOutline,
  statsChartOutline,
  settingsOutline,
  fastFoodOutline,
  hourglassOutline,
  starOutline,
  close,
  addCircle,
  search,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { donorService } from '../../services/donorService';
import { donationService } from '../../services/donationService';
import type { DonorDashboard, Donation } from '../../types';
import { getErrorMessage } from '../../utils/errorUtils';
import { getStatusText } from '../../utils/formatUtils';
import { formatDisplayDate } from '../../utils/dateUtils';
import './DonorDashboard.css';

const DonorDashboardPage: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] = useState<DonorDashboard | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load dashboard stats
      const dashboardData = await donorService.getDashboard();
      setDashboard(dashboardData);

      // Load recent donations
      const donations = await donationService.getMyDonations();
      // Sort by created_at desc and take first 5
      const recent = donations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      setRecentDonations(recent);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDashboardData();
    event.detail.complete();
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const handleDonationClick = (donation: Donation) => {
    history.push(`/donor/donation/${donation.id}`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/donor/profile')} fill="clear" style={{ '--padding-start': '12px', '--padding-end': '12px' }}>
              <IonIcon icon={settingsOutline} style={{ fontSize: '28px', color: '#667eea' }} />
            </IonButton>
            <IonButton onClick={handleLogout} fill="clear" style={{ '--padding-start': '12px', '--padding-end': '12px' }}>
              <IonIcon icon={logOutOutline} style={{ fontSize: '28px', color: '#e53e3e' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="dashboard-container">
          {/* Welcome Section */}
          <div className="dashboard-header">
            <h1>Welcome back!</h1>
            <p>Track your food donations and make a difference</p>
          </div>

          {/* Stats Grid */}
          {dashboard && (
            <div className="stats-grid">
              <div className="stat-card">
                <IonIcon icon={fastFoodOutline} className="stat-icon" />
                <div className="stat-value">{dashboard.total_donations}</div>
                <div className="stat-label">Total Donations</div>
              </div>

              <div className="stat-card">
                <IonIcon icon={checkmarkCircleOutline} className="stat-icon" />
                <div className="stat-value">{dashboard.completed_donations}</div>
                <div className="stat-label">Completed</div>
              </div>

              <div className="stat-card">
                <IonIcon icon={hourglassOutline} className="stat-icon" />
                <div className="stat-value">{dashboard.pending_donations}</div>
                <div className="stat-label">Pending</div>
              </div>

              <div className="stat-card">
                <IonIcon icon={starOutline} className="stat-icon" />
                <div className="stat-value">{dashboard.total_meals_donated}</div>
                <div className="stat-label">Meals Donated</div>
              </div>
            </div>
          )}

          {/* Additional Stats */}
          {dashboard && (
            <div className="stats-grid">
              <div className="stat-card">
                <IonIcon icon={close} className="stat-icon" style={{ color: '#e53e3e' }} />
                <div className="stat-value">{dashboard.cancelled_donations}</div>
                <div className="stat-label">Cancelled</div>
              </div>

              <div className="stat-card">
                <IonIcon icon={statsChartOutline} className="stat-icon" style={{ color: '#f59e0b' }} />
                <div className="stat-value">{dashboard.average_rating.toFixed(1)}</div>
                <div className="stat-label">Avg Rating</div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <IonButton expand="block" className="action-btn" onClick={() => history.push('/donor/donate-now')}>
                <IonIcon icon={addCircle} slot="start" />
                Donate Now
              </IonButton>
              <IonButton expand="block" className="action-btn secondary" onClick={() => history.push('/donor/search-ngos')}>
                <IonIcon icon={search} slot="start" />
                Find NGOs
              </IonButton>
              <IonButton expand="block" className="action-btn secondary" onClick={() => history.push('/donor/donations')}>
                <IonIcon icon={fastFoodOutline} slot="start" />
                My Donations
              </IonButton>
            </div>
          </div>

          {/* Recent Donations */}
          <div className="recent-donations">
            <h2>Recent Donations</h2>
            {recentDonations.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={fastFoodOutline} />
                <p>No donations yet</p>
                <p className="empty-subtitle">Start making a difference by donating food!</p>
                <IonButton onClick={() => history.push('/donor/donate-now')} className="empty-action-btn">
                  <IonIcon icon={addCircle} slot="start" />
                  Make Your First Donation
                </IonButton>
              </div>
            ) : (
              <div>
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="donation-item" onClick={() => handleDonationClick(donation)}>
                    <div className="donation-header">
                      <span className="donation-ngo">{donation.ngo_name || donation.food_type}</span>
                      <span className={`donation-status ${donation.status.toLowerCase()}`}>{getStatusText(donation.status)}</span>
                    </div>
                    <div className="donation-info">
                      <span>
                        <IonIcon icon={fastFoodOutline} />
                        {donation.food_type} • {donation.quantity_plates} plates • {donation.meal_type}
                      </span>
                      <span>
                        <IonIcon icon={hourglassOutline} />
                        {formatDisplayDate(donation.donation_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DonorDashboardPage;
