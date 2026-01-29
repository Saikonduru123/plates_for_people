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
  IonItem,
  IonInput,
} from '@ionic/react';
import { addCircle as chevronDown, close as chevronUp, create as pencilIcon } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { User, NGOProfile, DonorProfile } from '../../types';
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
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [ngoProfiles, setNgoProfiles] = useState<{ [key: number]: NGOProfile }>({});
  const [donorProfiles, setDonorProfiles] = useState<{ [key: number]: DonorProfile }>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editingNgoId, setEditingNgoId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<NGOProfile>>({});
  const [savingNgo, setSavingNgo] = useState(false);
  const [settingCapacityId, setSettingCapacityId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [capacityFormData, setCapacityFormData] = useState({
    breakfast: 0,
    lunch: 0,
    snacks: 0,
    dinner: 0,
  });
  const [savingCapacity, setSavingCapacity] = useState(false);

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

      // Preload all NGO and donor profiles for displaying contact persons
      const [ngos, donors] = await Promise.all([adminService.getAllNGOs().catch(() => []), adminService.getAllDonors().catch(() => [])]);

      // Map profiles by user_id
      const ngoProfilesMap: { [key: number]: any } = {};
      const donorProfilesMap: { [key: number]: any } = {};

      ngos.forEach((ngo) => {
        ngoProfilesMap[ngo.user_id] = ngo;
      });

      donors.forEach((donor) => {
        donorProfilesMap[donor.user_id] = donor;
      });

      setNgoProfiles(ngoProfilesMap);
      setDonorProfiles(donorProfilesMap);
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

    // Filter out rejected NGOs
    filtered = filtered.filter((user) => {
      if (user.role === 'ngo') {
        const ngoProfile = ngoProfiles[user.id];
        // Only show pending and verified NGOs, hide rejected ones
        if (ngoProfile && ngoProfile.verification_status === 'rejected') {
          return false;
        }
      }
      return true;
    });

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

  const handleExpandUser = async (user: User) => {
    if (expandedUserId === user.id) {
      // Collapse if already expanded
      setExpandedUserId(null);
      return;
    }

    // Expand and load profile
    setLoadingProfile(true);
    try {
      if (user.role === 'ngo') {
        const ngos = await adminService.getAllNGOs();
        const ngoProfile = ngos.find((n) => n.user_id === user.id);
        if (ngoProfile) {
          setNgoProfiles((prev) => ({ ...prev, [user.id]: ngoProfile }));
        }
      } else if (user.role === 'donor') {
        const donors = await adminService.getAllDonors();
        const donorProfile = donors.find((d) => d.user_id === user.id);
        if (donorProfile) {
          setDonorProfiles((prev) => ({ ...prev, [user.id]: donorProfile }));
        }
      }
      setExpandedUserId(user.id);
    } catch (error) {
      console.error('Error loading profile:', error);
      present({
        message: 'Failed to load profile details',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      setLoadingProfile(false);
    }
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

  const handleEditNgo = (user: User) => {
    const ngoProfile = ngoProfiles[user.id];
    if (ngoProfile) {
      setEditingNgoId(user.id);
      setEditFormData({
        organization_name: ngoProfile.organization_name,
        registration_number: ngoProfile.registration_number,
        contact_person: ngoProfile.contact_person,
        phone: ngoProfile.phone,
      });
    }
  };

  const handleSaveNgoEdit = async (user: User) => {
    try {
      setSavingNgo(true);
      const ngoProfile = ngoProfiles[user.id];
      if (!ngoProfile || !ngoProfile.id) {
        throw new Error('NGO profile ID not found');
      }
      // Ensure all fields are strings (not undefined)
      const dataToSend = {
        organization_name: editFormData.organization_name || '',
        registration_number: editFormData.registration_number || '',
        contact_person: editFormData.contact_person || '',
        phone: editFormData.phone || '',
      };
      // Call backend to update NGO profile using NGO profile ID
      await adminService.updateNGOProfile(ngoProfile.id, dataToSend);
      present({
        message: 'NGO profile updated successfully',
        duration: 2000,
        color: 'success',
      });
      // Reload profiles
      const ngos = await adminService.getAllNGOs();
      const updatedNgoProfile = ngos.find((n) => n.user_id === user.id);
      if (updatedNgoProfile) {
        setNgoProfiles((prev) => ({ ...prev, [user.id]: updatedNgoProfile }));
      }
      setEditingNgoId(null);
      setEditFormData({});
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to update NGO profile';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setSavingNgo(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNgoId(null);
    setEditFormData({});
  };

  const handleSetCapacity = (user: User, locationId?: number) => {
    const ngoProfile = ngoProfiles[user.id];
    if (ngoProfile && ngoProfile.id) {
      setSettingCapacityId(user.id);

      // If locationId provided, use that location's capacity
      if (locationId && ngoProfile.locations) {
        const location = ngoProfile.locations.find((loc) => loc.id === locationId);
        if (location) {
          setSelectedLocationId(locationId);
          setCapacityFormData({
            breakfast: location.default_breakfast_capacity || 0,
            lunch: location.default_lunch_capacity || 0,
            snacks: location.default_snacks_capacity || 0,
            dinner: location.default_dinner_capacity || 0,
          });
        }
      } else {
        // No specific location selected
        setSelectedLocationId(null);
        setCapacityFormData({
          breakfast: 0,
          lunch: 0,
          snacks: 0,
          dinner: 0,
        });
      }
    }
  };

  const handleSaveCapacity = async (user: User) => {
    try {
      setSavingCapacity(true);

      if (!selectedLocationId) {
        present({
          message: 'Please select a location first',
          duration: 2000,
          color: 'warning',
        });
        return;
      }

      // Save capacity to backend for specific location
      await adminService.updateLocationCapacity(selectedLocationId, capacityFormData);

      present({
        message: 'Capacity updated successfully',
        duration: 2000,
        color: 'success',
      });

      // Update local state to reflect changes
      setNgoProfiles((prev) => {
        const ngoProfile = prev[user.id];
        if (ngoProfile && ngoProfile.locations) {
          const updatedLocations = ngoProfile.locations.map((loc) =>
            loc.id === selectedLocationId
              ? {
                  ...loc,
                  default_breakfast_capacity: capacityFormData.breakfast,
                  default_lunch_capacity: capacityFormData.lunch,
                  default_snacks_capacity: capacityFormData.snacks,
                  default_dinner_capacity: capacityFormData.dinner,
                }
              : loc,
          );
          return {
            ...prev,
            [user.id]: {
              ...ngoProfile,
              locations: updatedLocations,
            },
          };
        }
        return prev;
      });

      setSettingCapacityId(null);
      setSelectedLocationId(null);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to update capacity';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleCancelCapacity = () => {
    setSettingCapacityId(null);
    setSelectedLocationId(null);
    setCapacityFormData({ breakfast: 0, lunch: 0, snacks: 0, dinner: 0 });
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
              placeholder="Search by name or role..."
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
                          <div className="user-email">
                            {user.role === 'ngo' && ngoProfiles[user.id]
                              ? ngoProfiles[user.id].contact_person
                              : user.role === 'donor' && donorProfiles[user.id]
                                ? donorProfiles[user.id].contact_person
                                : user.email}
                          </div>
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
                        {(user.role === 'ngo' || user.role === 'donor') && (
                          <IonButton
                            size="small"
                            color="primary"
                            fill="outline"
                            onClick={() => handleExpandUser(user)}
                            style={{ marginRight: '8px' }}>
                            <IonIcon slot="icon-only" icon={expandedUserId === user.id ? chevronUp : chevronDown} />
                          </IonButton>
                        )}
                        {user.role === 'ngo' && (
                          <IonButton size="small" color="info" fill="outline" onClick={() => handleEditNgo(user)} style={{ marginRight: '8px' }}>
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

                    {/* Expandable Detail Section */}
                    {expandedUserId === user.id && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        {loadingProfile ? (
                          <div style={{ textAlign: 'center', padding: '16px' }}>
                            <IonSpinner />
                          </div>
                        ) : user.role === 'ngo' && ngoProfiles[user.id] ? (
                          <div style={{ paddingRight: '8px' }}>
                            {editingNgoId === user.id ? (
                              // Edit Mode
                              <div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Organization Name</label>
                                  <IonInput
                                    value={editFormData.organization_name || ''}
                                    onIonInput={(e) => setEditFormData({ ...editFormData, organization_name: e.detail.value || '' })}
                                    placeholder="Enter organization name"
                                    style={{ marginTop: '4px', fontSize: '14px' }}
                                  />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Registration Number</label>
                                  <IonInput
                                    value={editFormData.registration_number || ''}
                                    onIonInput={(e) => setEditFormData({ ...editFormData, registration_number: e.detail.value || '' })}
                                    placeholder="Enter registration number"
                                    style={{ marginTop: '4px', fontSize: '14px' }}
                                  />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Contact Person</label>
                                  <IonInput
                                    value={editFormData.contact_person || ''}
                                    onIonInput={(e) => setEditFormData({ ...editFormData, contact_person: e.detail.value || '' })}
                                    placeholder="Enter contact person"
                                    style={{ marginTop: '4px', fontSize: '14px' }}
                                  />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Phone</label>
                                  <IonInput
                                    value={editFormData.phone || ''}
                                    onIonInput={(e) => setEditFormData({ ...editFormData, phone: e.detail.value || '' })}
                                    placeholder="Enter phone number"
                                    style={{ marginTop: '4px', fontSize: '14px' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                  <IonButton expand="block" color="primary" onClick={() => handleSaveNgoEdit(user)} disabled={savingNgo}>
                                    {savingNgo ? <IonSpinner name="dots" /> : 'Save'}
                                  </IonButton>
                                  <IonButton expand="block" color="medium" fill="outline" onClick={handleCancelEdit}>
                                    Cancel
                                  </IonButton>
                                </div>
                                <IonButton expand="block" color="secondary" style={{ marginTop: '12px' }} onClick={() => handleSetCapacity(user)}>
                                  Set Capacity
                                </IonButton>
                              </div>
                            ) : (
                              // View Mode
                              <div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Organization Name</label>
                                  <div style={{ fontSize: '14px', marginTop: '4px' }}>{ngoProfiles[user.id].organization_name}</div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Registration Number</label>
                                  <div style={{ fontSize: '14px', marginTop: '4px' }}>{ngoProfiles[user.id].registration_number}</div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Contact Person</label>
                                  <div style={{ fontSize: '14px', marginTop: '4px' }}>{ngoProfiles[user.id].contact_person}</div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Email</label>
                                  <div style={{ fontSize: '14px', marginTop: '4px' }}>{user.email}</div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Phone</label>
                                  <div style={{ fontSize: '14px', marginTop: '4px' }}>{ngoProfiles[user.id].phone}</div>

                                  {/* Locations Section */}
                                  {ngoProfiles[user.id].locations && ngoProfiles[user.id].locations!.length > 0 && (
                                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                      <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: '#64748b' }}>
                                        Locations ({ngoProfiles[user.id].locations!.length})
                                      </h4>
                                      {ngoProfiles[user.id].locations!.map((location, idx) => (
                                        <div
                                          key={location.id}
                                          style={{
                                            marginBottom: '12px',
                                            padding: '12px',
                                            backgroundColor: selectedLocationId === location.id ? '#eff6ff' : '#f8fafc',
                                            borderRadius: '8px',
                                            border: selectedLocationId === location.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                          }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                                                {location.location_name}
                                              </div>
                                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                {location.city}, {location.state}
                                              </div>
                                            </div>
                                            {selectedLocationId === location.id ? (
                                              <div style={{ display: 'flex', gap: '6px' }}>
                                                <IonButton
                                                  size="small"
                                                  fill="solid"
                                                  color="success"
                                                  onClick={() => handleSaveCapacity(user)}
                                                  disabled={savingCapacity}
                                                  style={{ '--padding-start': '12px', '--padding-end': '12px', fontSize: '11px' }}>
                                                  {savingCapacity ? <IonSpinner name="dots" /> : 'Confirm'}
                                                </IonButton>
                                                <IonButton
                                                  size="small"
                                                  fill="outline"
                                                  color="medium"
                                                  onClick={handleCancelCapacity}
                                                  style={{ '--padding-start': '12px', '--padding-end': '12px', fontSize: '11px' }}>
                                                  Cancel
                                                </IonButton>
                                              </div>
                                            ) : (
                                              <IonButton
                                                size="small"
                                                fill="outline"
                                                color="primary"
                                                onClick={() => handleSetCapacity(user, location.id)}
                                                style={{ '--padding-start': '12px', '--padding-end': '12px', fontSize: '11px' }}>
                                                Set Capacity
                                              </IonButton>
                                            )}
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                            <div>
                                              <label style={{ fontSize: '10px', color: '#a0aec0', fontWeight: '600' }}>Breakfast</label>
                                              {selectedLocationId === location.id ? (
                                                <IonInput
                                                  type="number"
                                                  value={capacityFormData.breakfast}
                                                  onIonInput={(e) =>
                                                    setCapacityFormData({ ...capacityFormData, breakfast: parseInt(e.detail.value || '0') })
                                                  }
                                                  style={{
                                                    marginTop: '2px',
                                                    fontSize: '12px',
                                                    '--background': 'white',
                                                    '--padding-start': '8px',
                                                    '--padding-end': '8px',
                                                  }}
                                                />
                                              ) : (
                                                <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>
                                                  {location.default_breakfast_capacity || 0}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              <label style={{ fontSize: '10px', color: '#a0aec0', fontWeight: '600' }}>Lunch</label>
                                              {selectedLocationId === location.id ? (
                                                <IonInput
                                                  type="number"
                                                  value={capacityFormData.lunch}
                                                  onIonInput={(e) =>
                                                    setCapacityFormData({ ...capacityFormData, lunch: parseInt(e.detail.value || '0') })
                                                  }
                                                  style={{
                                                    marginTop: '2px',
                                                    fontSize: '12px',
                                                    '--background': 'white',
                                                    '--padding-start': '8px',
                                                    '--padding-end': '8px',
                                                  }}
                                                />
                                              ) : (
                                                <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>
                                                  {location.default_lunch_capacity || 0}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              <label style={{ fontSize: '10px', color: '#a0aec0', fontWeight: '600' }}>Snacks</label>
                                              {selectedLocationId === location.id ? (
                                                <IonInput
                                                  type="number"
                                                  value={capacityFormData.snacks}
                                                  onIonInput={(e) =>
                                                    setCapacityFormData({ ...capacityFormData, snacks: parseInt(e.detail.value || '0') })
                                                  }
                                                  style={{
                                                    marginTop: '2px',
                                                    fontSize: '12px',
                                                    '--background': 'white',
                                                    '--padding-start': '8px',
                                                    '--padding-end': '8px',
                                                  }}
                                                />
                                              ) : (
                                                <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>
                                                  {location.default_snacks_capacity || 0}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              <label style={{ fontSize: '10px', color: '#a0aec0', fontWeight: '600' }}>Dinner</label>
                                              {selectedLocationId === location.id ? (
                                                <IonInput
                                                  type="number"
                                                  value={capacityFormData.dinner}
                                                  onIonInput={(e) =>
                                                    setCapacityFormData({ ...capacityFormData, dinner: parseInt(e.detail.value || '0') })
                                                  }
                                                  style={{
                                                    marginTop: '2px',
                                                    fontSize: '12px',
                                                    '--background': 'white',
                                                    '--padding-start': '8px',
                                                    '--padding-end': '8px',
                                                  }}
                                                />
                                              ) : (
                                                <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>
                                                  {location.default_dinner_capacity || 0}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : user.role === 'donor' && donorProfiles[user.id] ? (
                          <div style={{ paddingRight: '8px' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Organization Name</label>
                              <div style={{ fontSize: '14px', marginTop: '4px' }}>{donorProfiles[user.id].organization_name}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Contact Person</label>
                              <div style={{ fontSize: '14px', marginTop: '4px' }}>{donorProfiles[user.id].contact_person}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Email</label>
                              <div style={{ fontSize: '14px', marginTop: '4px' }}>{user.email}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Phone</label>
                              <div style={{ fontSize: '14px', marginTop: '4px' }}>{donorProfiles[user.id].phone}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Address</label>
                              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                {donorProfiles[user.id].address_line1}
                                {donorProfiles[user.id].address_line2 && `, ${donorProfiles[user.id].address_line2}`}
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>City</label>
                              <div style={{ fontSize: '14px', marginTop: '4px' }}>{donorProfiles[user.id].city}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
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
