import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonBackButton,
  IonBadge,
} from '@ionic/react';
import { create as pencilIcon } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { User } from '../../types';
import './ManageUsers.css';

const ManageUsers: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchText, selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to load users';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((user) => user.email?.toLowerCase().includes(search) || user.role?.toLowerCase().includes(search));
    }

    setFilteredUsers(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadUsers();
    event.detail.complete();
  };

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Are you sure you want to deactivate ${user.email}?`)) return;

    try {
      setProcessingId(user.id);
      console.log(`Attempting to deactivate user ${user.id}`);
      await adminService.deactivateUser(user.id);
      console.log('User deactivated successfully');
      present({
        message: `${user.email} has been deactivated`,
        duration: 2000,
        color: 'success',
      });
      await loadUsers();
    } catch (err: any) {
      console.error('Deactivate error:', err);
      console.error('Error response:', err.response?.data);
      const message = err.response?.data?.detail || err.message || 'Failed to deactivate user';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async (user: User) => {
    try {
      setProcessingId(user.id);
      await adminService.activateUser(user.id);
      present({
        message: `${user.email} has been activated`,
        duration: 2000,
        color: 'success',
      });
      await loadUsers();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to activate user';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditNGO = (user: User) => {
    // Navigate to NGO edit page
    history.push(`/admin/ngo/${user.id}`);
  };

  const getRoleIcon = (role: string) => {
    return role === 'ngo' ? '🏢' : '👤';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'ngo':
        return 'success';
      case 'donor':
        return 'primary';
      default:
        return 'medium';
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <IonTitle>Manage Users</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading users...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Manage Users</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="manage-users">
          {/* Filters Section */}
          <div className="filters-section">
            <IonSearchbar
              value={searchText}
              onIonInput={(e) => setSearchText(e.detail.value || '')}
              placeholder="Search by email or role..."
              className="search-bar"
            />

            <IonSegment value={selectedRole} onIonChange={(e) => setSelectedRole(e.detail.value as string)}>
              <IonSegmentButton value="all">
                <IonLabel>All Users ({users.length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="donor">
                <IonLabel>Donors ({users.filter((u) => u.role === 'donor').length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="ngo">
                <IonLabel>NGOs ({users.filter((u) => u.role === 'ngo').length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="admin">
                <IonLabel>Admins ({users.filter((u) => u.role === 'admin').length})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '64px' }}>👤</div>
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-list">
              {filteredUsers.map((user) => (
                <IonCard key={user.id} className="user-card">
                  <IonCardContent>
                    <div className="user-card-header">
                      <div className="user-info">
                        <div className="user-icon-badge">
                          <span style={{ fontSize: '24px' }}>{getRoleIcon(user.role)}</span>
                        </div>
                        <div className="user-details">
                          <div className="user-email">{user.email}</div>
                          <div className="user-meta">
                            <IonBadge color={getRoleColor(user.role)}>{user.role.toUpperCase()}</IonBadge>
                            <span className="status-badge" style={{ marginLeft: '8px' }}>
                              {user.is_active ? (
                                <>
                                  <span style={{ fontSize: '16px', color: 'var(--ion-color-success)', marginRight: '6px' }}>✓</span>
                                  <span style={{ color: 'var(--ion-color-success)' }}>Active</span>
                                </>
                              ) : (
                                <>
                                  <span style={{ fontSize: '16px', color: 'var(--ion-color-danger)', marginRight: '6px' }}>✕</span>
                                  <span style={{ color: 'var(--ion-color-danger)' }}>Inactive</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="user-actions">
                        {user.role === 'ngo' && (
                          <IonButton size="small" color="primary" fill="outline" onClick={() => handleEditNGO(user)} style={{ marginRight: '8px' }}>
                            <IonIcon slot="start" icon={pencilIcon} />
                            Edit
                          </IonButton>
                        )}
                        {user.is_active ? (
                          <IonButton
                            size="small"
                            color="danger"
                            fill="outline"
                            onClick={() => handleDeactivate(user)}
                            disabled={processingId === user.id}>
                            {processingId === user.id ? <IonSpinner name="dots" /> : 'Deactivate'}
                          </IonButton>
                        ) : (
                          <IonButton
                            size="small"
                            color="success"
                            fill="outline"
                            onClick={() => handleActivate(user)}
                            disabled={processingId === user.id}>
                            {processingId === user.id ? <IonSpinner name="dots" /> : 'Activate'}
                          </IonButton>
                        )}
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

interface IonButtonsProps {
  slot?: string;
  children?: React.ReactNode;
}

const IonButtons: React.FC<IonButtonsProps> = ({ slot, children }) => {
  return (
    <div slot={slot} style={{ display: 'flex', alignItems: 'center' }}>
      {children}
    </div>
  );
};

export default ManageUsers;
