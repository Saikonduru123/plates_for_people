import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonBackButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  useIonToast,
  useIonRouter,
} from '@ionic/react';
import { checkmarkCircle, locationOutline, starOutline, alertCircle } from 'ionicons/icons';
import { useParams, useLocation } from 'react-router-dom';
import StarRatingInput from '../../components/rating/StarRatingInput';
import { ratingService } from '../../services/ratingService';
import { donationService } from '../../services/donationService';
import { searchService } from '../../services/searchService';
import { ngoService } from '../../services/ngoService';
import type { Donation, NGOLocation, NGOProfile } from '../../types';
import './RateNGO.css';

interface LocationState {
  donationId?: number;
}

const RateNGO: React.FC = () => {
  const { donation_id } = useParams<{ donation_id: string }>();
  const location = useLocation<LocationState>();
  const router = useIonRouter();
  const [present] = useIonToast();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [ngoLocation, setNgoLocation] = useState<NGOLocation | null>(null);
  const [ngoProfile, setNgoProfile] = useState<NGOProfile | null>(null);
  const [loadingDonation, setLoadingDonation] = useState(true);

  const donationIdNum = parseInt(donation_id || String(location.state?.donationId || '0'), 10);

  useEffect(() => {
    loadDonation();
  }, [donation_id]);

  const loadDonation = async () => {
    if (!donationIdNum) {
      setLoadingDonation(false);
      return;
    }

    try {
      const data = await donationService.getDonation(donationIdNum);

      // Only allow rating for completed donations
      if (data.status.toLowerCase() !== 'completed') {
        present({
          message: 'You can only rate completed donations',
          duration: 3000,
          color: 'warning',
        });
        router.push('/donor/donations', 'back', 'replace');
        return;
      }

      setDonation(data);

      // Load NGO location details
      const ngoLocationData = await ngoService.getLocation(data.ngo_location_id);
      setNgoLocation(ngoLocationData);

      // Load NGO profile details
      const ngoProfileData = await searchService.getNGO(ngoLocationData.ngo_id);
      setNgoProfile(ngoProfileData);
    } catch (error: any) {
      console.error('Failed to load donation:', error);
      present({
        message: 'Failed to load donation details',
        duration: 2000,
        color: 'danger',
      });
      router.push('/donor/donations', 'back', 'replace');
    } finally {
      setLoadingDonation(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      present({
        message: 'Please select a star rating',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!feedback.trim()) {
      present({
        message: 'Please provide some feedback',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!donationIdNum) {
      present({
        message: 'Invalid donation',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    setLoading(true);
    try {
      await ratingService.createRating({
        donation_id: donationIdNum,
        rating,
        feedback: feedback.trim(),
      });

      present({
        message: '⭐ Thank you for your feedback!',
        duration: 3000,
        color: 'success',
      });

      // Navigate back to donation details
      router.push(`/donor/donation/${donationIdNum}`, 'back', 'replace');
    } catch (error: any) {
      console.error('Failed to submit rating:', error);

      // Check if already rated
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already rated')) {
        present({
          message: 'You have already rated this donation',
          duration: 3000,
          color: 'warning',
        });
        router.push(`/donor/donation/${donationIdNum}`, 'back', 'replace');
      } else {
        present({
          message: error.response?.data?.detail || 'Failed to submit rating',
          duration: 3000,
          color: 'danger',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/donations" />
          </IonButtons>
          <IonTitle>Rate NGO</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="rate-ngo-content">
        {loadingDonation ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading donation information...</p>
          </div>
        ) : (
          <div className="rate-ngo-container">
            {/* NGO Info Card */}
            <IonCard className="ngo-info-card">
              <IonCardContent>
                <div className="ngo-info-content">
                  <IonIcon icon={starOutline} className="ngo-icon" color="warning" />
                  <div>
                    <h2 className="ngo-name">{ngoProfile?.organization_name || 'NGO'}</h2>
                    {ngoLocation && (
                      <p className="ngo-location">
                        <IonIcon icon={locationOutline} />
                        {ngoLocation.location_name}
                      </p>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Rating Section */}
            <div className="rating-section">
              <h3 className="section-title">How was your experience?</h3>
              <p className="section-description">Your feedback helps us improve and helps others make informed decisions</p>

              <div className="star-rating-container">
                <StarRatingInput value={rating} onChange={setRating} size="large" />
                <p className="rating-label">{getRatingLabel(rating)}</p>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="feedback-section">
              <h3 className="section-title">Share your experience</h3>
              <IonTextarea
                value={feedback}
                onIonInput={(e) => setFeedback(e.detail.value!)}
                placeholder="Tell us about your experience with this NGO. What did you like? What could be improved?"
                rows={6}
                maxlength={500}
                counter
                className="feedback-textarea"
              />
              <p className="feedback-hint">💡 Tip: Mention the staff's responsiveness, pickup experience, and overall satisfaction</p>
            </div>

            {/* Submit Button */}
            <div className="submit-section">
              <IonButton
                expand="block"
                size="large"
                onClick={handleSubmit}
                disabled={loading || rating === 0 || !feedback.trim()}
                className="submit-button">
                {loading ? (
                  <>
                    <IonSpinner name="crescent" slot="start" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <IonIcon slot="start" icon={checkmarkCircle} />
                    Submit Rating
                  </>
                )}
              </IonButton>

              <p className="submit-note">Your rating will be public and help other donors</p>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RateNGO;
