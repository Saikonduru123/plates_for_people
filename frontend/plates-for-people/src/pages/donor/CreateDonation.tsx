import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonNote,
  IonDatetime,
  IonModal,
  useIonToast,
  useIonRouter,
  IonProgressBar,
} from '@ionic/react';
import { checkmarkCircle, arrowBack, arrowForward } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import type { CreateDonationRequest, MealType } from '../../types';
import './CreateDonation.css';

interface LocationState {
  ngoId?: number;
  locationId?: number;
  ngoName?: string;
  locationName?: string;
}

const CreateDonation: React.FC = () => {
  const location = useLocation<LocationState>();
  const router = useIonRouter();
  const [present] = useIonToast();
  
  // Get NGO details from route state
  const ngoId = location.state?.ngoId;
  const locationId = location.state?.locationId;
  const ngoName = location.state?.ngoName || 'Selected NGO';
  const locationName = location.state?.locationName || '';

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Partial<CreateDonationRequest>>({
    ngo_location_id: locationId,
    meal_type: undefined,
    quantity_plates: undefined,
    donation_date: '',
    pickup_time_start: '',
    pickup_time_end: '',
    food_type: '',
    special_instructions: '',
    description: '',
  });

  // Date/time modal state
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  // Step 1: NGO Selection (pre-filled)
  const renderStep1 = () => (
    <div className="form-step">
      <h2>NGO Selection</h2>
      <p className="step-description">Confirm the NGO for your donation</p>
      
      <IonCard className="ngo-selection-card">
        <IonCardContent>
          <div className="ngo-info">
            <IonIcon icon={checkmarkCircle} color="success" />
            <div>
              <h3>{ngoName}</h3>
              {locationName && <p className="location-text">{locationName}</p>}
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {!locationId && (
        <IonNote color="danger" className="error-note">
          No NGO location selected. Please go back and select an NGO.
        </IonNote>
      )}
    </div>
  );

  // Step 2: Food Details
  const renderStep2 = () => (
    <div className="form-step">
      <h2>Food Details</h2>
      <p className="step-description">Tell us about your donation</p>

      <IonItem>
        <IonLabel position="stacked">Meal Type *</IonLabel>
        <IonSelect
          value={formData.meal_type}
          placeholder="Select meal type"
          onIonChange={(e) => setFormData({ ...formData, meal_type: e.detail.value })}
        >
          <IonSelectOption value="breakfast">Breakfast</IonSelectOption>
          <IonSelectOption value="lunch">Lunch</IonSelectOption>
          <IonSelectOption value="dinner">Dinner</IonSelectOption>
        </IonSelect>
      </IonItem>

      <IonItem>
        <IonLabel position="stacked">Food Type *</IonLabel>
        <IonInput
          value={formData.food_type}
          placeholder="e.g., Rice, Curry, Chapati"
          onIonChange={(e) => setFormData({ ...formData, food_type: e.detail.value! })}
        />
      </IonItem>

      <IonItem>
        <IonLabel position="stacked">Number of Plates *</IonLabel>
        <IonInput
          type="number"
          min="1"
          value={formData.quantity_plates}
          placeholder="Enter quantity"
          onIonChange={(e) => setFormData({ ...formData, quantity_plates: parseInt(e.detail.value!, 10) })}
        />
      </IonItem>

      <IonItem>
        <IonLabel position="stacked">Description</IonLabel>
        <IonTextarea
          value={formData.description}
          placeholder="Brief description of the food"
          rows={3}
          onIonChange={(e) => setFormData({ ...formData, description: e.detail.value! })}
        />
      </IonItem>
    </div>
  );

  // Step 3: Schedule & Special Instructions
  const renderStep3 = () => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'Select date';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    const formatTime = (timeStr: string) => {
      if (!timeStr) return 'Select time';
      return timeStr;
    };

    return (
      <div className="form-step">
        <h2>Schedule & Instructions</h2>
        <p className="step-description">When can the NGO pick up the food?</p>

        <IonItem button onClick={() => setShowDateModal(true)}>
          <IonLabel position="stacked">Donation Date *</IonLabel>
          <IonNote slot="end">{formatDate(formData.donation_date || '')}</IonNote>
        </IonItem>

        <IonModal isOpen={showDateModal} onDidDismiss={() => setShowDateModal(false)}>
          <IonDatetime
            presentation="date"
            value={formData.donation_date}
            min={new Date().toISOString()}
            onIonChange={(e) => {
              setFormData({ ...formData, donation_date: e.detail.value as string });
              setShowDateModal(false);
            }}
          />
        </IonModal>

        <IonItem button onClick={() => setShowStartTimeModal(true)}>
          <IonLabel position="stacked">Pickup Start Time *</IonLabel>
          <IonNote slot="end">{formatTime(formData.pickup_time_start || '')}</IonNote>
        </IonItem>

        <IonModal isOpen={showStartTimeModal} onDidDismiss={() => setShowStartTimeModal(false)}>
          <IonDatetime
            presentation="time"
            value={formData.pickup_time_start}
            onIonChange={(e) => {
              const time = (e.detail.value as string).substring(11, 16); // Extract HH:MM
              setFormData({ ...formData, pickup_time_start: time });
              setShowStartTimeModal(false);
            }}
          />
        </IonModal>

        <IonItem button onClick={() => setShowEndTimeModal(true)}>
          <IonLabel position="stacked">Pickup End Time *</IonLabel>
          <IonNote slot="end">{formatTime(formData.pickup_time_end || '')}</IonNote>
        </IonItem>

        <IonModal isOpen={showEndTimeModal} onDidDismiss={() => setShowEndTimeModal(false)}>
          <IonDatetime
            presentation="time"
            value={formData.pickup_time_end}
            onIonChange={(e) => {
              const time = (e.detail.value as string).substring(11, 16); // Extract HH:MM
              setFormData({ ...formData, pickup_time_end: time });
              setShowEndTimeModal(false);
            }}
          />
        </IonModal>

        <IonItem>
          <IonLabel position="stacked">Special Instructions</IonLabel>
          <IonTextarea
            value={formData.special_instructions}
            placeholder="Any special handling requirements, dietary info, etc."
            rows={4}
            onIonChange={(e) => setFormData({ ...formData, special_instructions: e.detail.value! })}
          />
        </IonItem>
      </div>
    );
  };

  // Step 4: Review & Confirm
  const renderStep4 = () => (
    <div className="form-step">
      <h2>Review & Confirm</h2>
      <p className="step-description">Please review your donation details</p>

      <IonCard className="review-card">
        <IonCardContent>
          <div className="review-section">
            <h3>NGO Details</h3>
            <p><strong>Organization:</strong> {ngoName}</p>
            {locationName && <p><strong>Location:</strong> {locationName}</p>}
          </div>

          <div className="review-section">
            <h3>Food Details</h3>
            <p><strong>Meal Type:</strong> {formData.meal_type}</p>
            <p><strong>Food Type:</strong> {formData.food_type}</p>
            <p><strong>Quantity:</strong> {formData.quantity_plates} plates</p>
            {formData.description && (
              <p><strong>Description:</strong> {formData.description}</p>
            )}
          </div>

          <div className="review-section">
            <h3>Schedule</h3>
            <p><strong>Date:</strong> {formData.donation_date ? new Date(formData.donation_date).toLocaleDateString() : 'Not set'}</p>
            <p><strong>Pickup Time:</strong> {formData.pickup_time_start} - {formData.pickup_time_end}</p>
          </div>

          {formData.special_instructions && (
            <div className="review-section">
              <h3>Special Instructions</h3>
              <p>{formData.special_instructions}</p>
            </div>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!locationId;
      case 2:
        return !!(
          formData.meal_type &&
          formData.food_type &&
          formData.quantity_plates &&
          formData.quantity_plates > 0
        );
      case 3:
        return !!(
          formData.donation_date &&
          formData.pickup_time_start &&
          formData.pickup_time_end
        );
      case 4:
        return validateStep(1) && validateStep(2) && validateStep(3);
      default:
        return false;
    }
  };

  // Navigation
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      present({
        message: 'Please fill in all required fields',
        duration: 2000,
        color: 'warning',
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.goBack();
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      present({
        message: 'Please fill in all required fields',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      // Format date to YYYY-MM-DD
      const dateObj = new Date(formData.donation_date!);
      const formattedDate = dateObj.toISOString().split('T')[0];

      const donationData: CreateDonationRequest = {
        ngo_location_id: formData.ngo_location_id!,
        meal_type: formData.meal_type as MealType,
        food_type: formData.food_type!,
        quantity_plates: formData.quantity_plates!,
        donation_date: formattedDate,
        pickup_time_start: formData.pickup_time_start!,
        pickup_time_end: formData.pickup_time_end!,
        description: formData.description || undefined,
        special_instructions: formData.special_instructions || undefined,
      };

      const response = await donationService.createDonation(donationData);

      present({
        message: '✅ Donation request created successfully!',
        duration: 3000,
        color: 'success',
      });

      // Navigate to donation details
      router.push(`/donor/donation/${response.id}`, 'forward', 'replace');
    } catch (error: any) {
      console.error('Failed to create donation:', error);
      present({
        message: error.response?.data?.detail || 'Failed to create donation request',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/search-ngos" />
          </IonButtons>
          <IonTitle>Create Donation</IonTitle>
        </IonToolbar>
        <IonProgressBar value={currentStep / 4} />
      </IonHeader>

      <IonContent className="create-donation-content">
        <div className="step-indicator">
          <div className="step-dots">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`step-dot ${currentStep >= step ? 'active' : ''} ${
                  currentStep === step ? 'current' : ''
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <p className="step-label">
            Step {currentStep} of 4: {
              currentStep === 1 ? 'NGO Selection' :
              currentStep === 2 ? 'Food Details' :
              currentStep === 3 ? 'Schedule' :
              'Review'
            }
          </p>
        </div>

        <div className="form-container">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="button-container">
          <IonButton
            expand="block"
            fill="outline"
            onClick={handleBack}
            disabled={loading}
          >
            <IonIcon slot="start" icon={arrowBack} />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </IonButton>

          {currentStep < 4 ? (
            <IonButton
              expand="block"
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
          ) : (
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={loading || !validateStep(4)}
            >
              {loading ? 'Creating...' : 'Submit Donation'}
              <IonIcon slot="end" icon={checkmarkCircle} />
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateDonation;
