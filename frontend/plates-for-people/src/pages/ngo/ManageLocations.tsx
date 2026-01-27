import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonAlert,
  IonBadge,
  IonToggle,
  useIonToast,
  useIonViewWillEnter,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addCircleOutline,
  locationOutline,
  createOutline,
  trashOutline,
  mapOutline,
  callOutline,
  timeOutline,
  checkmarkCircle,
  closeCircle,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { ngoService } from '../../services/ngoService';
import type { NGOLocation } from '../../types';
import './ManageLocations.css';

const ManageLocations: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<NGOLocation[]>([]);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<NGOLocation | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load locations when component mounts
  useEffect(() => {
    loadLocations();
  }, []);

  // Reload locations every time the page comes into view (handles back navigation)
  useIonViewWillEnter(() => {
    loadLocations();
  });

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await ngoService.getLocations();
      setLocations(data);
    } catch (error: any) {
      console.error('Failed to load locations:', error);
      present({
        message: 'Failed to load locations',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadLocations();
    event.detail.complete();
  };

  const handleAddLocation = () => {
    history.push('/ngo/locations/add');
  };

  const handleEditLocation = (location: NGOLocation) => {
    history.push(`/ngo/locations/edit/${location.id}`, { location });
  };

  const handleViewOnMap = (location: NGOLocation) => {
    // Open in Google Maps
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const handleToggleActive = async (location: NGOLocation) => {
    try {
      await ngoService.updateLocation(location.id, {
        is_active: !location.is_active,
      } as any);

      present({
        message: `Location ${!location.is_active ? 'activated' : 'deactivated'}`,
        duration: 2000,
        color: 'success',
      });

      // Reload locations
      await loadLocations();
    } catch (error: any) {
      present({
        message: 'Failed to update location status',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleDeleteClick = (location: NGOLocation) => {
    setLocationToDelete(location);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;

    try {
      setDeletingId(locationToDelete.id);
      await ngoService.deleteLocation(locationToDelete.id);

      present({
        message: 'Location deleted successfully',
        duration: 3000,
        color: 'success',
      });

      // Reload locations
      await loadLocations();
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to delete location',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setDeletingId(null);
      setLocationToDelete(null);
      setShowDeleteAlert(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderLocationCard = (location: NGOLocation) => {
    return (
      <IonCard key={location.id} className="location-card">
        <IonCardContent>
          <div className="location-header">
            <div className="location-title-section">
              <h3 className="location-name">{location.location_name}</h3>
              <IonBadge color={location.is_active ? 'success' : 'medium'} className="status-badge">
                {location.is_active ? 'Active' : 'Inactive'}
              </IonBadge>
            </div>
            <IonToggle checked={location.is_active} onIonChange={() => handleToggleActive(location)} className="active-toggle" />
          </div>

          <div className="location-details">
            <div className="detail-row">
              <IonIcon icon={locationOutline} />
              <div className="detail-text">
                <p>{location.address_line1}</p>
                {location.address_line2 && <p>{location.address_line2}</p>}
                <p>
                  {location.city}, {location.state} {location.zip_code}
                </p>
                <p>{location.country}</p>
              </div>
            </div>

            <div className="detail-row">
              <IonIcon icon={callOutline} />
              <div className="detail-text">
                <p>
                  <strong>{location.contact_person}</strong>
                </p>
                <a href={`tel:${location.contact_phone}`}>{location.contact_phone}</a>
              </div>
            </div>

            {location.operating_hours && (
              <div className="detail-row">
                <IonIcon icon={timeOutline} />
                <div className="detail-text">
                  <p>{location.operating_hours}</p>
                </div>
              </div>
            )}

            <div className="detail-row coordinates">
              <IonIcon icon={mapOutline} />
              <div className="detail-text">
                <p>
                  Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="detail-row meta">
              <p className="created-date">Created: {location.created_at ? formatDate(location.created_at) : 'N/A'}</p>
            </div>
          </div>

          <div className="location-actions">
            <IonButton fill="outline" size="small" onClick={() => handleViewOnMap(location)}>
              <IonIcon slot="start" icon={mapOutline} />
              View on Map
            </IonButton>

            <IonButton fill="solid" size="small" color="primary" onClick={() => handleEditLocation(location)}>
              <IonIcon slot="start" icon={createOutline} />
              Edit
            </IonButton>

            <IonButton fill="solid" size="small" color="danger" onClick={() => handleDeleteClick(location)} disabled={deletingId === location.id}>
              {deletingId === location.id ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon slot="start" icon={trashOutline} />
                  Delete
                </>
              )}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ngo/dashboard" />
            </IonButtons>
            <IonTitle>Manage Locations</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading locations...</p>
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
            <IonBackButton defaultHref="/ngo/dashboard" />
          </IonButtons>
          <IonTitle>Manage Locations</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleAddLocation}>
              <IonIcon slot="icon-only" icon={addCircleOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="manage-locations-container">
          {locations.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={locationOutline} className="empty-icon" />
              <h3>No Locations Yet</h3>
              <p>Add your first location to start accepting donation requests.</p>
              <IonButton onClick={handleAddLocation}>
                <IonIcon slot="start" icon={addCircleOutline} />
                Add Location
              </IonButton>
            </div>
          ) : (
            <>
              <div className="locations-header">
                <h2 className="page-heading">My Locations</h2>
                <p className="locations-count">
                  {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
                </p>
              </div>

              <div className="locations-list">{locations.map((location) => renderLocationCard(location))}</div>
            </>
          )}
        </div>

        {/* Floating Action Button */}
        {locations.length > 0 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleAddLocation}>
              <IonIcon icon={addCircleOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => {
            setShowDeleteAlert(false);
            setLocationToDelete(null);
          }}
          header="Delete Location"
          message={`Are you sure you want to delete "${locationToDelete?.location_name}"? This action cannot be undone.`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: handleDeleteConfirm,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ManageLocations;
