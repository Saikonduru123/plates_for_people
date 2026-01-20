import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonDatetime,
  IonBadge,
  IonChip,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  useIonToast,
  IonModal,
} from '@ionic/react';
import { restaurantOutline, calendarOutline, timeOutline, locationOutline, star, checkmarkCircleOutline, refreshOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { searchService } from '../../services/searchService';
import { donationService } from '../../services/donationService';
import { donorService } from '../../services/donorService';
import { useGeolocation } from '../../hooks/useGeolocation';
import { CustomSelect } from '../../components/CustomSelect';
import { DatePicker } from '../../components/DatePicker';
import { TimePicker } from '../../components/TimePicker';
import type { NGOSearchResult, MealType } from '../../types';
import './SmartDonate.css';

interface DonationParams {
  food_type: string;
  quantity_plates: number;
  meal_type: MealType;
  donation_date: string;
  pickup_time_start: string;
  pickup_time_end: string;
  description: string;
  special_instructions: string;
}

const SmartDonatePage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ selectedNGO?: NGOSearchResult; skipSelection?: boolean }>();
  const [present] = useIonToast();
  const { latitude, longitude, getCurrentPosition } = useGeolocation();

  // If coming from NGO details with pre-selected NGO, skip to step 1 (details) and set selected NGO
  const preSelectedNGO = location.state?.selectedNGO;
  const skipSelection = location.state?.skipSelection || false;

  // Steps: 1 = Details, 2 = NGO Selection, 3 = Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Donation details
  const [donationParams, setDonationParams] = useState<DonationParams>({
    food_type: '',
    quantity_plates: 0,
    meal_type: 'lunch' as MealType,
    donation_date: new Date().toISOString().split('T')[0],
    pickup_time_start: '12:00',
    pickup_time_end: '14:00',
    description: '',
    special_instructions: '',
  });

  // NGO search results
  const [availableNGOs, setAvailableNGOs] = useState<NGOSearchResult[]>([]);
  const [selectedNGO, setSelectedNGO] = useState<NGOSearchResult | null>(preSelectedNGO || null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User location
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [donorProfile, setDonorProfile] = useState<any>(null);

  // Load donor profile to get saved location
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await donorService.getProfile();
        setDonorProfile(profile);
      } catch (error) {
        console.error('Failed to load donor profile:', error);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setUserLat(latitude);
      setUserLng(longitude);
    }
  }, [latitude, longitude]);

  const searchMatchingNGOs = async () => {
    try {
      setLoading(true);

      // Priority 1: Try to get current GPS location
      let searchLat = userLat;
      let searchLng = userLng;

      try {
        await getCurrentPosition();
        // Wait a bit for the hook to update state
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (latitude && longitude) {
          searchLat = latitude;
          searchLng = longitude;
        }
      } catch (error) {
        console.log('GPS location not available, trying saved location');
      }

      // Priority 2: Use saved donor profile location if GPS failed
      if (!searchLat || !searchLng) {
        if (donorProfile?.latitude && donorProfile?.longitude) {
          searchLat = donorProfile.latitude;
          searchLng = donorProfile.longitude;
          console.log('Using saved profile location');
        } else {
          // Priority 3: Fallback to Mumbai as backup
          searchLat = 19.076;
          searchLng = 72.8777;
          console.log('Using backup Mumbai location');
          present({
            message: 'Using default location. Please update your profile with your location for better results.',
            duration: 3000,
            color: 'warning',
          });
        }
      }

      const searchParams = {
        latitude: searchLat!,
        longitude: searchLng!,
        radius: 100, // Max radius allowed by backend
        meal_type: donationParams.meal_type,
        donation_date: donationParams.donation_date,
        min_capacity: donationParams.quantity_plates,
      };

      const results = await searchService.searchNGOs(searchParams);

      // Sort by distance and rating
      const sorted = results.sort((a, b) => {
        // Prioritize by available capacity first
        if (a.available_capacity && b.available_capacity) {
          if (a.available_capacity >= donationParams.quantity_plates && b.available_capacity < donationParams.quantity_plates) {
            return -1;
          }
          if (b.available_capacity >= donationParams.quantity_plates && a.available_capacity < donationParams.quantity_plates) {
            return 1;
          }
        }

        // Then by rating
        const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
        if (Math.abs(ratingDiff) > 0.5) return ratingDiff;

        // Finally by distance
        return a.distance_km - b.distance_km;
      });

      setAvailableNGOs(sorted);

      if (sorted.length === 0) {
        present({
          message: 'No NGOs found with available capacity for your criteria. Try a different date, meal type, or reduce quantity.',
          duration: 4000,
          color: 'warning',
        });
      } else {
        // Skip NGO selection if coming from NGO details
        if (skipSelection && preSelectedNGO) {
          // Verify the pre-selected NGO is still in the results
          const ngoStillValid = sorted.find((n) => n.location_id === preSelectedNGO.location_id);
          if (ngoStillValid) {
            setSelectedNGO(ngoStillValid);
            setStep(2); // Go to NGO selection to show the pre-selected NGO
            return;
          } else {
            // NGO not available, show message and continue to selection
            present({
              message: 'The selected NGO is not available for these criteria. Please choose another.',
              duration: 3000,
              color: 'warning',
            });
          }
        }

        // If only one NGO, auto-select it and go to selection step
        if (sorted.length === 1) {
          setSelectedNGO(sorted[0]);
        }

        setStep(2);
      }
    } catch (error: any) {
      present({
        message: error.message || 'Failed to search NGOs',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDonation = async () => {
    if (!selectedNGO) {
      present({
        message: 'Please select an NGO',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);

      const donationRequest = {
        ngo_location_id: selectedNGO.location_id,
        ...donationParams,
      };

      const donation = await donationService.createDonation(donationRequest);

      present({
        message: 'Donation request submitted successfully!',
        duration: 3000,
        color: 'success',
      });

      // Navigate to donation details
      setTimeout(() => {
        history.push(`/donor/donation/${donation.id}`);
      }, 1000);
    } catch (error: any) {
      present({
        message: error.message || 'Failed to submit donation',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Donation Details</IonCardTitle>
        </IonCardHeader>
        <IonCardContent style={{ marginBottom: '24px' }}>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Food Type *</IonLabel>
              <IonInput
                value={donationParams.food_type}
                onIonInput={(e) => setDonationParams({ ...donationParams, food_type: e.detail.value! })}
                placeholder="e.g., Vegetarian meals, Biryani, Sandwiches"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Number of Plates *</IonLabel>
              <IonInput
                type="number"
                value={donationParams.quantity_plates}
                onIonInput={(e) =>
                  setDonationParams({
                    ...donationParams,
                    quantity_plates: parseInt(e.detail.value!) || 0,
                  })
                }
                placeholder="e.g., 50"
                min="1"
                required
              />
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '16px' }}>
              <IonLabel position="stacked" style={{ marginBottom: '8px' }}>
                Meal Type *
              </IonLabel>
              <IonSelect
                value={donationParams.meal_type}
                onIonChange={(e) => setDonationParams({ ...donationParams, meal_type: e.detail.value })}
                interface="popover"
                style={{ width: '100%', maxWidth: '100%', border: '1px solid #cecece', height: '42px', borderRadius: '8px' }}>
                <IonSelectOption value="breakfast">Breakfast</IonSelectOption>
                <IonSelectOption value="lunch">Lunch</IonSelectOption>
                <IonSelectOption value="dinner">Dinner</IonSelectOption>
                <IonSelectOption value="snacks">Snacks</IonSelectOption>
              </IonSelect>
            </IonItem>

            <DatePicker
              label="Donation Date"
              value={donationParams.donation_date}
              onChange={(date) => {
                const dateStr = date.split('T')[0];
                setDonationParams({ ...donationParams, donation_date: dateStr });
              }}
              min={new Date().toISOString()}
              required
            />

            <TimePicker
              label="Pickup Time"
              value={donationParams.pickup_time_start}
              onChange={(time) => {
                setDonationParams({
                  ...donationParams,
                  pickup_time_start: time,
                  pickup_time_end: time,
                });
              }}
              required
            />

            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={donationParams.description}
                onIonInput={(e) => setDonationParams({ ...donationParams, description: e.detail.value! })}
                placeholder="Any additional details about the food"
                rows={3}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Special Instructions</IonLabel>
              <IonTextarea
                value={donationParams.special_instructions}
                onIonInput={(e) =>
                  setDonationParams({
                    ...donationParams,
                    special_instructions: e.detail.value!,
                  })
                }
                placeholder="e.g., Please bring insulated containers"
                rows={2}
              />
            </IonItem>
          </IonList>

          <div className="button-container">
            <IonButton
              expand="block"
              onClick={searchMatchingNGOs}
              disabled={loading || !donationParams.food_type || donationParams.quantity_plates <= 0 || !donationParams.donation_date}>
              {loading ? (
                <>
                  <IonSpinner name="crescent" slot="start" />
                  Searching...
                </>
              ) : (
                <>
                  <IonIcon icon={locationOutline} slot="start" />
                  Find Best Matches
                </>
              )}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <IonCard className="summary-card">
        <IonCardHeader>
          <div className="summary-header">
            <IonCardTitle>Your Donation</IonCardTitle>
            <IonButton fill="clear" size="small" onClick={() => setStep(1)}>
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </div>
        </IonCardHeader>
        <IonCardContent>
          <div className="donation-summary">
            <IonChip color="primary">
              <IonLabel>{donationParams.quantity_plates} plates</IonLabel>
            </IonChip>
            <IonChip color="secondary">
              <IonLabel>{donationParams.meal_type}</IonLabel>
            </IonChip>
            <IonChip>
              <IonLabel>{donationParams.donation_date}</IonLabel>
            </IonChip>
          </div>
          <p className="food-type">{donationParams.food_type}</p>
        </IonCardContent>
      </IonCard>

      <div className="results-header">
        <h2>Available NGOs ({availableNGOs.length})</h2>
        <IonText color="medium">
          <p>Sorted by availability, rating, and distance</p>
        </IonText>
      </div>

      {availableNGOs.length === 0 ? (
        <div className="empty-state">
          <IonIcon icon={locationOutline} className="empty-icon" />
          <h3>No NGOs Found</h3>
          <p>Try adjusting your date or reducing the number of plates</p>
          <IonButton onClick={() => setStep(1)}>Modify Details</IonButton>
        </div>
      ) : (
        <div className="ngo-list">
          {availableNGOs.map((ngo) => (
            <IonCard
              key={ngo.location_id}
              button
              className={`ngo-option ${selectedNGO?.location_id === ngo.location_id ? 'selected' : ''}`}
              onClick={() => setSelectedNGO(ngo)}>
              <IonCardHeader>
                <div className="ngo-header">
                  <div>
                    <IonCardTitle>{ngo.ngo_name}</IonCardTitle>
                    <IonText color="medium">
                      <p>{ngo.location_name}</p>
                    </IonText>
                  </div>
                  {selectedNGO?.location_id === ngo.location_id && (
                    <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '2rem' }} />
                  )}
                </div>
              </IonCardHeader>
              <IonCardContent>
                <div className="ngo-details">
                  <IonBadge color="primary">{ngo.distance_km.toFixed(1)} km away</IonBadge>

                  {ngo.available_capacity !== null && (
                    <IonBadge color={ngo.available_capacity >= donationParams.quantity_plates ? 'success' : 'warning'}>
                      Capacity: {ngo.available_capacity} plates
                    </IonBadge>
                  )}

                  {ngo.average_rating && (
                    <div className="rating">
                      <IonIcon icon={star} color="warning" />
                      <span>
                        {ngo.average_rating.toFixed(1)} ({ngo.total_ratings})
                      </span>
                    </div>
                  )}
                </div>

                <div className="ngo-address">
                  <IonText color="medium">
                    <p>
                      📍 {ngo.address.city}, {ngo.address.state}
                    </p>
                  </IonText>
                </div>

                {ngo.available_capacity && ngo.available_capacity >= donationParams.quantity_plates && (
                  <IonChip color="success" className="recommended-chip">
                    <IonLabel>✓ Recommended</IonLabel>
                  </IonChip>
                )}
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      )}

      {selectedNGO && (
        <div className="sticky-footer">
          <IonButton expand="block" size="large" onClick={() => setStep(3)}>
            Continue with {selectedNGO.ngo_name}
          </IonButton>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <IonCard className="confirm-card">
        <IonCardHeader>
          <IonCardTitle>Confirm Donation</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="confirm-section">
            <h3>Donation Details</h3>
            <IonList>
              <IonItem>
                <IonLabel>Food Type</IonLabel>
                <IonText slot="end">{donationParams.food_type}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Quantity</IonLabel>
                <IonText slot="end">{donationParams.quantity_plates} plates</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Meal Type</IonLabel>
                <IonText slot="end">{donationParams.meal_type}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Date</IonLabel>
                <IonText slot="end">{donationParams.donation_date}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Pickup Time</IonLabel>
                <IonText slot="end">
                  {donationParams.pickup_time_start} - {donationParams.pickup_time_end}
                </IonText>
              </IonItem>
            </IonList>
          </div>

          {selectedNGO && (
            <div className="confirm-section">
              <h3>Selected NGO</h3>
              <IonList>
                <IonItem>
                  <IonLabel>Organization</IonLabel>
                  <IonText slot="end">{selectedNGO.ngo_name}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Location</IonLabel>
                  <IonText slot="end">{selectedNGO.location_name}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Distance</IonLabel>
                  <IonText slot="end">{selectedNGO.distance_km.toFixed(1)} km</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Address</IonLabel>
                  <IonText slot="end">
                    {selectedNGO.address.city}, {selectedNGO.address.state}
                  </IonText>
                </IonItem>
              </IonList>
            </div>
          )}

          <div className="button-container">
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonButton expand="block" fill="outline" onClick={() => setStep(2)} disabled={submitting}>
                    Back
                  </IonButton>
                </IonCol>
                <IonCol size="6">
                  <IonButton expand="block" color="success" onClick={handleSubmitDonation} disabled={submitting}>
                    {submitting ? (
                      <>
                        <IonSpinner name="crescent" slot="start" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/dashboard" />
          </IonButtons>
          <IonTitle>Donate Now</IonTitle>
        </IonToolbar>

        {/* Step Indicator */}
        <IonToolbar>
          <IonSegment value={step.toString()}>
            <IonSegmentButton value="1">
              <IonLabel>Details</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="2" disabled={step < 2}>
              <IonLabel>Select NGO</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="3" disabled={step < 3}>
              <IonLabel>Confirm</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="smart-donate-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </IonContent>
    </IonPage>
  );
};

export default SmartDonatePage;
