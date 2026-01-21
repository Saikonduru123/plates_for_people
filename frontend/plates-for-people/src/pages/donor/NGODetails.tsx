import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonChip,
  IonLabel,
  IonBadge,
  useIonToast,
} from '@ionic/react';
import { callOutline, personOutline, locationOutline, timeOutline, checkmarkCircle, addOutline } from 'ionicons/icons';
import { MapComponent } from '../../components/maps/MapComponent';
import { RatingsSummary } from '../../components/ngo/RatingsSummary';
import { searchService } from '../../services/searchService';
import { ratingService } from '../../services/ratingService';
import { NGOSearchResult } from '../../types';
import './NGODetails.css';

const NGODetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation<{ ngo?: NGOSearchResult }>();
  const [present] = useIonToast();

  const [ngo, setNgo] = useState<NGOSearchResult | null>(location.state?.ngo || null);
  const [loading, setLoading] = useState(!location.state?.ngo);
  const [ratingSummary, setRatingSummary] = useState<{
    average_rating: number | null;
    total_ratings: number;
    rating_distribution: Record<number, number>;
  } | null>(null);

  useEffect(() => {
    loadNGODetails();
  }, [id]);

  const loadNGODetails = async () => {
    try {
      // If we already have NGO data from route state, just load ratings
      if (location.state?.ngo) {
        // Load rating summary
        try {
          const summary = await ratingService.getNGORatingSummary(location.state.ngo.ngo_id);
          setRatingSummary(summary);
        } catch (error) {
          console.error('Failed to load ratings:', error);
          // Continue without ratings
        }
        return;
      }

      // Otherwise, search for the NGO
      setLoading(true);

      // Use the location from search results
      const searchResults = await searchService.searchNGOs({
        latitude: 19.076, // Default coords, will be updated
        longitude: 72.8777,
        radius: 100, // Maximum allowed radius (100km)
      });

      const foundNGO = searchResults.find((n) => n.location_id === parseInt(id));

      if (!foundNGO) {
        throw new Error('NGO not found');
      }

      setNgo(foundNGO);

      // Load rating summary
      try {
        const summary = await ratingService.getNGORatingSummary(foundNGO.ngo_id);
        setRatingSummary(summary);
      } catch (error) {
        console.error('Failed to load ratings:', error);
        // Continue without ratings
      }
    } catch (error: any) {
      present({
        message: error.message || 'Failed to load NGO details',
        duration: 3000,
        color: 'danger',
      });
      history.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDonation = () => {
    if (!ngo) return;
    history.push({
      pathname: '/donor/create-donation',
      state: {
        locationId: ngo.location_id,
        ngoName: ngo.ngo_name,
        locationName: ngo.location_name,
      },
    });
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/donor/search-ngos" />
            </IonButtons>
            <IonTitle>NGO Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner />
            <p>Loading NGO details...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!ngo) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/search-ngos" />
          </IonButtons>
          <IonTitle>{ngo.ngo_name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="ngo-details-container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <IonBadge color="success" className="verified-badge-inline">
                <IonIcon icon={checkmarkCircle} />
                Verified
              </IonBadge>
              <h1>{ngo.ngo_name}</h1>
              <p className="location-name">
                <IonIcon icon={locationOutline} />
                {ngo.location_name}
              </p>
              {ngo.average_rating !== null && (
                <div className="hero-rating">
                  <RatingsSummary averageRating={ngo.average_rating} totalRatings={ngo.total_ratings} size="medium" />
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="primary-action">
            <IonButton expand="block" size="large" onClick={handleCreateDonation} className="create-donation-btn-top">
              <IonIcon slot="start" icon={addOutline} />
              Create Donation Request
            </IonButton>
          </div>

          {/* Map Section */}
          <IonCard className="map-card">
            <div className="map-wrapper" key={`map-wrapper-${ngo.location_id}`}>
              <MapComponent
                key={`ngo-detail-map-${ngo.location_id}`}
                center={[ngo.coordinates.latitude, ngo.coordinates.longitude]}
                markers={[
                  {
                    id: ngo.location_id,
                    name: ngo.ngo_name,
                    address: ngo.location_name,
                    city: ngo.address.city,
                    latitude: ngo.coordinates.latitude,
                    longitude: ngo.coordinates.longitude,
                  },
                ]}
                zoom={15}
                singleMarker={true}
              />
            </div>
          </IonCard>

          {/* Address Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={locationOutline} /> Location
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="address-line">{ngo.address.line1}</p>
              {ngo.address.line2 && <p className="address-line">{ngo.address.line2}</p>}
              <p className="address-line">
                {ngo.address.city}, {ngo.address.state} {ngo.address.zip_code}
              </p>
              <p className="address-line">{ngo.address.country}</p>
              {ngo.distance_km !== undefined && (
                <IonChip color="primary" className="distance-chip">
                  <IonLabel>{ngo.distance_km.toFixed(1)} km away</IonLabel>
                </IonChip>
              )}
            </IonCardContent>
          </IonCard>

          {/* Contact Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Contact Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="contact-row">
                <IonIcon icon={personOutline} />
                <div>
                  <p className="contact-label">Contact Person</p>
                  <p className="contact-value">{ngo.contact.person}</p>
                </div>
              </div>
              <div className="contact-row">
                <IonIcon icon={callOutline} />
                <div>
                  <p className="contact-label">Phone</p>
                  <p className="contact-value">
                    <a href={`tel:${ngo.contact.phone}`}>{ngo.contact.phone}</a>
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Quick Info Cards */}
          <div className="quick-info-grid">
            {ngo.distance_km !== undefined && (
              <IonCard className="info-card">
                <IonCardContent>
                  <div className="info-card-content">
                    <IonIcon icon={locationOutline} color="primary" />
                    <div>
                      <p className="info-label">Distance</p>
                      <p className="info-value">{ngo.distance_km.toFixed(1)} km</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {ngo.available_capacity !== null && (
              <IonCard className="info-card">
                <IonCardContent>
                  <div className="info-card-content">
                    <IonIcon icon={timeOutline} color="success" />
                    <div>
                      <p className="info-label">Capacity</p>
                      <p className="info-value">{ngo.available_capacity} plates</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            )}
          </div>

          {/* Rating Distribution (if available) */}
          {ratingSummary && ratingSummary.total_ratings > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Ratings & Reviews</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="rating-stats">
                  <div className="average-rating">
                    <h2>{ratingSummary.average_rating?.toFixed(1) || 'N/A'}</h2>
                    <RatingsSummary averageRating={ratingSummary.average_rating} totalRatings={ratingSummary.total_ratings} size="medium" />
                  </div>
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingSummary.rating_distribution[stars] || 0;
                      const percentage = ratingSummary.total_ratings > 0 ? (count / ratingSummary.total_ratings) * 100 : 0;
                      return (
                        <div key={stars} className="rating-bar-row">
                          <span className="stars-label">{stars} ⭐</span>
                          <div className="rating-bar">
                            <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="count-label">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NGODetails;
