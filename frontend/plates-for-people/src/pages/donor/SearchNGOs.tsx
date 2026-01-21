import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  useIonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { mapOutline, listOutline, locateOutline, filterOutline, star } from 'ionicons/icons';
import { MapComponent } from '../../components/maps/MapComponent';
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchService } from '../../services/searchService';
import { NGOSearchResult } from '../../types';
import { useHistory } from 'react-router-dom';
import './SearchNGOs.css';

type ViewMode = 'map' | 'list';

const SearchNGOs: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [ngos, setNgos] = useState<NGOSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filters
  const [radius, setRadius] = useState<number>(25);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [mealType, setMealType] = useState<string>('');
  const [minCapacity, setMinCapacity] = useState<number | undefined>();

  // Geolocation
  const { latitude, longitude, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();

  // Default location (Mumbai) if geolocation fails
  const [userLat, setUserLat] = useState<number>(19.076);
  const [userLng, setUserLng] = useState<number>(72.8777);
  const [centerOnPosition, setCenterOnPosition] = useState<[number, number] | null>(null);
  const [locationFetched, setLocationFetched] = useState(false);

  // Auto-fetch location on mount
  useEffect(() => {
    if (!locationFetched) {
      getCurrentPosition().catch((err) => {
        console.log('Location fetch failed, using default location:', err);
        present({
          message: 'Using default location (Mumbai). Click "My Location" to try again.',
          duration: 3000,
          color: 'warning',
        });
      });
      setLocationFetched(true);
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setUserLat(latitude);
      setUserLng(longitude);
    }
  }, [latitude, longitude]);

  // Load NGOs on mount and when filters change
  useEffect(() => {
    loadNGOs();
  }, [userLat, userLng, radius, selectedDate, mealType, minCapacity]);

  const loadNGOs = async () => {
    try {
      setLoading(true);

      const params: any = {
        latitude: userLat,
        longitude: userLng,
        radius,
      };

      if (selectedDate) params.donation_date = selectedDate;
      if (mealType) params.meal_type = mealType;
      if (minCapacity) params.min_capacity = minCapacity;

      const results = await searchService.searchNGOs(params);
      setNgos(results);
    } catch (error: any) {
      present({
        message: error.message || 'Failed to load NGOs',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadNGOs();
    event.detail.complete();
  };

  const handleUseMyLocation = () => {
    if (geoLoading) return;
    getCurrentPosition();
    present({
      message: 'Getting your location...',
      duration: 2000,
      color: 'primary',
    });
  };

  const handleNGOClick = (ngo: NGOSearchResult) => {
    // Pass the NGO data through route state to avoid extra API call
    history.push({
      pathname: `/donor/ngo/${ngo.location_id}`,
      state: { ngo },
    });
  };

  const filteredNGOs = ngos.filter(
    (ngo) =>
      ngo.ngo_name.toLowerCase().includes(searchText.toLowerCase()) ||
      ngo.location_name.toLowerCase().includes(searchText.toLowerCase()) ||
      ngo.address.city.toLowerCase().includes(searchText.toLowerCase()),
  );

  const mapMarkers = filteredNGOs.map((ngo) => ({
    id: ngo.location_id,
    name: ngo.ngo_name,
    address: ngo.location_name,
    city: ngo.address.city,
    latitude: ngo.coordinates.latitude,
    longitude: ngo.coordinates.longitude,
    distance: ngo.distance_km,
    rating: ngo.average_rating || undefined,
    totalRatings: ngo.total_ratings,
  }));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/dashboard" />
          </IonButtons>
          <IonTitle>Search NGOs</IonTitle>
        </IonToolbar>

        {/* View Toggle */}
        <IonToolbar>
          <IonSegment value={viewMode} onIonChange={(e) => setViewMode(e.detail.value as ViewMode)}>
            <IonSegmentButton value="map">
              <IonIcon icon={mapOutline} />
              <IonLabel>Map</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="list">
              <IonIcon icon={listOutline} />
              <IonLabel>List</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>

        {/* Search and Filters */}
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search by name or location"
            debounce={300}
          />
        </IonToolbar>

        <IonToolbar className="filters-toolbar">
          <div className="filters-container">
            <IonButton size="small" fill="outline" onClick={handleUseMyLocation} disabled={geoLoading}>
              <IonIcon slot="start" icon={locateOutline} />
              {geoLoading ? 'Locating...' : 'My Location'}
            </IonButton>

            <IonSelect value={radius} onIonChange={(e) => setRadius(e.detail.value)} placeholder="Radius" interface="popover">
              <IonSelectOption value={1}>1 km</IonSelectOption>
              <IonSelectOption value={5}>5 km</IonSelectOption>
              <IonSelectOption value={10}>10 km</IonSelectOption>
              <IonSelectOption value={25}>25 km</IonSelectOption>
              <IonSelectOption value={50}>50 km</IonSelectOption>
            </IonSelect>

            <IonSelect value={mealType} onIonChange={(e) => setMealType(e.detail.value)} placeholder="Meal Type" interface="popover">
              <IonSelectOption value="">All</IonSelectOption>
              <IonSelectOption value="breakfast">Breakfast</IonSelectOption>
              <IonSelectOption value="lunch">Lunch</IonSelectOption>
              <IonSelectOption value="dinner">Dinner</IonSelectOption>
            </IonSelect>
          </div>
        </IonToolbar>

        {/* Results Count */}
        <IonToolbar>
          <div className="results-header">
            <IonLabel>
              {loading ? (
                <IonSpinner name="dots" />
              ) : (
                <span>
                  <strong>{filteredNGOs.length}</strong> NGOs found within <strong>{radius}km</strong>
                </span>
              )}
            </IonLabel>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {geoError && (
          <div className="error-banner">
            <p>{geoError}</p>
            <IonButton size="small" onClick={handleUseMyLocation}>
              Try Again
            </IonButton>
          </div>
        )}

        {viewMode === 'map' ? (
          <div className="map-container">
            <MapComponent
              key={`map-${viewMode}-${filteredNGOs.length}-${radius}`}
              center={[userLat, userLng]}
              markers={mapMarkers}
              onMarkerClick={(marker) => {
                const ngo = filteredNGOs.find((n) => n.location_id === marker.id);
                if (ngo) handleNGOClick(ngo);
              }}
              onMarkerPopupOpen={(position) => {
                // Center the map on the clicked marker
                setCenterOnPosition(position);
                setTimeout(() => setCenterOnPosition(null), 100);
              }}
              radius={radius}
              centerOnPosition={centerOnPosition}
            />
          </div>
        ) : (
          <div className="list-container">
            {loading ? (
              <div className="loading-container">
                <IonSpinner />
                <p>Loading NGOs...</p>
              </div>
            ) : filteredNGOs.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={mapOutline} className="empty-icon" />
                <h2>No NGOs Found</h2>
                <p>Try increasing the search radius or adjusting filters</p>
                <IonButton onClick={() => setRadius(50)}>Search within 50km</IonButton>
              </div>
            ) : (
              filteredNGOs.map((ngo) => (
                <IonCard key={ngo.location_id} button onClick={() => handleNGOClick(ngo)} className="ngo-card">
                  <IonCardHeader>
                    <div className="card-header-content">
                      <div>
                        <IonCardTitle>{ngo.ngo_name}</IonCardTitle>
                        <IonCardSubtitle>{ngo.location_name}</IonCardSubtitle>
                      </div>
                      <IonBadge color="primary">{ngo.distance_km.toFixed(1)} km</IonBadge>
                    </div>
                  </IonCardHeader>

                  <IonCardContent>
                    <div className="ngo-details">
                      <p className="address">
                        📍 {ngo.address.city}, {ngo.address.state}
                      </p>

                      {ngo.average_rating !== null && (
                        <div className="rating">
                          <IonIcon icon={star} color="warning" />
                          <span>
                            {ngo.average_rating.toFixed(1)} ({ngo.total_ratings} reviews)
                          </span>
                        </div>
                      )}

                      {ngo.available_capacity !== null && (
                        <IonChip color="success">
                          <IonLabel>Capacity: {ngo.available_capacity} plates</IonLabel>
                        </IonChip>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SearchNGOs;
