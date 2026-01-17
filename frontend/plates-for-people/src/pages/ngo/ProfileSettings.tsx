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
  IonBadge,
  useIonRouter,
} from '@ionic/react';
import {
  personOutline,
  businessOutline,
  callOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
  alertCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { ngoService } from '../../services/ngoService';
import type { NGOProfile } from '../../types';
import './ProfileSettings.css';

interface ProfileFormData {
  organization_name: string;
  contact_person: string;
  phone: string;
}

interface FormErrors {
  organization_name?: string;
  contact_person?: string;
  phone?: string;
}

const ProfileSettings: React.FC = () => {
  const router = useIonRouter();
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    organization_name: '',
    contact_person: '',
    phone: '',
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
      const data = await ngoService.getProfile();
      setProfile(data);
      setFormData({
        organization_name: data.organization_name || '',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
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

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }

    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToastMessage('Please fix the errors in the form', 'danger');
      return;
    }

    setSaving(true);
    try {
      await ngoService.updateProfile({
        organization_name: formData.organization_name.trim(),
        contact_person: formData.contact_person.trim(),
        phone: formData.phone.trim(),
      });

      showToastMessage('Profile updated successfully!', 'success');
      setHasChanges(false);
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToastMessage(
        error.response?.data?.detail || 'Failed to update profile',
        'danger'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    router.push('/ngo/dashboard', 'back');
  };

  const getVerificationStatusBadge = () => {
    if (!profile) return null;

    const statusConfig = {
      pending: {
        color: 'warning',
        icon: alertCircleOutline,
        text: 'Pending Verification',
      },
      verified: {
        color: 'success',
        icon: checkmarkCircleOutline,
        text: 'Verified',
      },
      rejected: {
        color: 'danger',
        icon: closeCircleOutline,
        text: 'Rejected',
      },
    };

    const config = statusConfig[profile.verification_status];

    return (
      <div className={`verification-status ${profile.verification_status}`}>
        <IonIcon icon={config.icon} />
        <span>{config.text}</span>
      </div>
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
            <IonTitle>Profile Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
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
            <IonBackButton defaultHref="/ngo/dashboard" />
          </IonButtons>
          <IonTitle>Profile Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="profile-settings-container">
          {/* Verification Status Card */}
          {profile && (
            <IonCard className="verification-card">
              <IonCardContent>
                <div className="verification-header">
                  <IonIcon icon={shieldCheckmarkOutline} className="shield-icon" />
                  <div className="verification-info">
                    <h3>Verification Status</h3>
                    {getVerificationStatusBadge()}
                  </div>
                </div>

                {profile.verification_status === 'pending' && (
                  <p className="verification-message">
                    Your account is pending verification. An admin will review your registration
                    documents shortly.
                  </p>
                )}

                {profile.verification_status === 'rejected' && profile.rejection_reason && (
                  <div className="rejection-info">
                    <p className="rejection-label">Rejection Reason:</p>
                    <p className="rejection-reason">{profile.rejection_reason}</p>
                    <p className="rejection-help">
                      Please contact support to resolve this issue.
                    </p>
                  </div>
                )}

                {profile.verification_status === 'verified' && profile.verified_at && (
                  <p className="verification-message">
                    Verified on {new Date(profile.verified_at).toLocaleDateString('default', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Profile Information Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={businessOutline} className="section-icon" />
                Organization Information
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {/* Organization Name */}
              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon={businessOutline} />
                  Organization Name
                </label>
                <IonInput
                  value={formData.organization_name}
                  onIonInput={(e) => handleInputChange('organization_name', e.detail.value || '')}
                  placeholder="Enter organization name"
                  className={errors.organization_name ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.organization_name && (
                  <p className="error-text">{errors.organization_name}</p>
                )}
              </div>

              {/* Registration Number (Read-only) */}
              {profile && (
                <div className="form-group">
                  <label className="form-label">
                    <IonIcon icon={documentTextOutline} />
                    Registration Number
                  </label>
                  <IonInput
                    value={profile.registration_number}
                    readonly
                    className="readonly-input"
                  />
                  <p className="helper-text">
                    Registration number cannot be changed. Contact support if needed.
                  </p>
                </div>
              )}

              {/* Contact Person */}
              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon={personOutline} />
                  Contact Person
                </label>
                <IonInput
                  value={formData.contact_person}
                  onIonInput={(e) => handleInputChange('contact_person', e.detail.value || '')}
                  placeholder="Enter contact person name"
                  className={errors.contact_person ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.contact_person && <p className="error-text">{errors.contact_person}</p>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label required">
                  <IonIcon icon={callOutline} />
                  Phone Number
                </label>
                <IonInput
                  type="tel"
                  value={formData.phone}
                  onIonInput={(e) => handleInputChange('phone', e.detail.value || '')}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'input-error' : ''}
                  disabled={saving}
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              {/* Save/Cancel Buttons */}
              <div className="form-actions">
                <IonButton
                  expand="block"
                  color="medium"
                  fill="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <>
                      <IonSpinner name="crescent" />
                      <span style={{ marginLeft: '8px' }}>Saving...</span>
                    </>
                  ) : (
                    <>
                      <IonIcon slot="start" icon={checkmarkCircleOutline} />
                      Save Changes
                    </>
                  )}
                </IonButton>
              </div>

              {!hasChanges && (
                <p className="no-changes-text">No changes to save</p>
              )}
            </IonCardContent>
          </IonCard>

          {/* Info Card */}
          <IonCard className="info-card">
            <IonCardContent>
              <div className="info-content">
                <IonIcon icon={alertCircleOutline} className="info-icon" />
                <div className="info-text">
                  <strong>Note:</strong> Changes to your organization name and contact details
                  will be reflected immediately. Your registration number is permanent and cannot
                  be changed.
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
        position="top"
      />
    </IonPage>
  );
};

export default ProfileSettings;
