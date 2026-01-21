import React, { useState, useEffect } from 'react';
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
  IonCardContent,
  IonButton,
  IonInput,
  IonSpinner,
  IonToast,
  IonIcon,
  useIonRouter,
} from '@ionic/react';
import { donorService } from '../../services/donorService';
import { useAuth } from '../../context/AuthContext';
import type { DonorProfile } from '../../types';
import './DonorProfileSettings.css';

interface ProfileFormData {
  organization_name: string;
  contact_person: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface FormErrors {
  organization_name?: string;
  contact_person?: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

const DonorProfileSettings: React.FC = () => {
  const router = useIonRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    organization_name: '',
    contact_person: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await donorService.getProfile();
      setProfile(data);
      setFormData({
        organization_name: data.organization_name || '',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        country: data.country || '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showToastMessage('Failed to load profile', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'danger') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.organization_name?.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }

    if (!formData.contact_person?.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.address_line1?.trim()) {
      newErrors.address_line1 = 'Address is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zip_code?.trim()) {
      newErrors.zip_code = 'Zip code is required';
    }

    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error when user types
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToastMessage('Please fix the errors', 'danger');
      return;
    }

    setSaving(true);
    try {
      await donorService.updateProfile(formData);

      setHasChanges(false);
      showToastMessage('Profile updated successfully!', 'success');

      // Reload profile
      await loadProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToastMessage(error.message || 'Failed to update profile', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/donor/dashboard" />
            </IonButtons>
            <IonTitle>Profile Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading profile...</p>
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
            <IonBackButton defaultHref="/donor/dashboard" />
          </IonButtons>
          <IonTitle>Profile Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="profile-settings-container">
          {/* Organization Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Organization Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="business-outline" />
                  Organization Name
                </label>
                <IonInput
                  value={formData.organization_name}
                  onIonInput={(e) => handleInputChange('organization_name', e.detail.value!)}
                  placeholder="Enter organization name"
                  className={errors.organization_name ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.organization_name && <p className="error-text">{errors.organization_name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="person-outline" />
                  Contact Person
                </label>
                <IonInput
                  value={formData.contact_person}
                  onIonInput={(e) => handleInputChange('contact_person', e.detail.value!)}
                  placeholder="Enter contact person name"
                  className={errors.contact_person ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.contact_person && <p className="error-text">{errors.contact_person}</p>}
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="call-outline" />
                  Phone Number
                </label>
                <IonInput
                  type="tel"
                  value={formData.phone}
                  onIonInput={(e) => handleInputChange('phone', e.detail.value!)}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <IonIcon icon="mail-outline" />
                  Email (from account)
                </label>
                <IonInput value={user?.email} readonly className="readonly-input" />
                <p className="helper-text">Email is linked to your account and cannot be changed here.</p>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Address Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Address Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="location-outline" />
                  Address Line 1
                </label>
                <IonInput
                  value={formData.address_line1}
                  onIonInput={(e) => handleInputChange('address_line1', e.detail.value!)}
                  placeholder="Enter street address"
                  className={errors.address_line1 ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.address_line1 && <p className="error-text">{errors.address_line1}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <IonIcon icon="location-outline" />
                  Address Line 2
                </label>
                <IonInput
                  value={formData.address_line2}
                  onIonInput={(e) => handleInputChange('address_line2', e.detail.value!)}
                  placeholder="Apartment, suite, etc. (optional)"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="business-outline" />
                  City
                </label>
                <IonInput
                  value={formData.city}
                  onIonInput={(e) => handleInputChange('city', e.detail.value!)}
                  placeholder="Enter city"
                  className={errors.city ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="map-outline" />
                  State
                </label>
                <IonInput
                  value={formData.state}
                  onIonInput={(e) => handleInputChange('state', e.detail.value!)}
                  placeholder="Enter state"
                  className={errors.state ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.state && <p className="error-text">{errors.state}</p>}
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="mail-outline" />
                  Zip Code
                </label>
                <IonInput
                  value={formData.zip_code}
                  onIonInput={(e) => handleInputChange('zip_code', e.detail.value!)}
                  placeholder="Enter zip code"
                  className={errors.zip_code ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.zip_code && <p className="error-text">{errors.zip_code}</p>}
              </div>

              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon="globe-outline" />
                  Country
                </label>
                <IonInput
                  value={formData.country}
                  onIonInput={(e) => handleInputChange('country', e.detail.value!)}
                  placeholder="Enter country"
                  className={errors.country ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.country && <p className="error-text">{errors.country}</p>}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Save Button */}
          <div className="action-buttons">
            <IonButton onClick={handleSave} disabled={saving || !hasChanges} className="save-button">
              <IonIcon icon="checkmark-circle-outline" slot="start" />
              {saving ? 'Saving...' : 'Save Changes'}
            </IonButton>
          </div>
        </div>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} color={toastColor} />
      </IonContent>
    </IonPage>
  );
};

export default DonorProfileSettings;
