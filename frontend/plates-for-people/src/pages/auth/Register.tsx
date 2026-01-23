import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonText,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSegment,
  IonSegmentButton,
  IonBackButton,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
} from '@ionic/react';
import { mailOutline, lockClosedOutline, personOutline, callOutline, businessOutline, documentTextOutline, homeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import type { UserRole } from '../../types';
import './Register.css';

const Register: React.FC = () => {
  const history = useHistory();
  const { registerDonor, registerNGO } = useAuth();

  const [role, setRole] = useState<UserRole>('donor');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    organization_name: '',
    registration_number: '',
    address: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.full_name) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (role === 'ngo') {
      if (!formData.organization_name || !formData.registration_number || !formData.address) {
        setError('Please fill in all NGO details');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setShowToast(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (role === 'donor') {
        await registerDonor({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: 'donor',
          phone_number: formData.phone_number || undefined,
        });
      } else {
        await registerNGO({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: 'ngo',
          phone_number: formData.phone_number,
          organization_name: formData.organization_name,
          registration_number: formData.registration_number,
          address: formData.address,
          description: formData.description || undefined,
        });
      }

      // Redirect will be handled by App.tsx
      history.push('/dashboard');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        <div className="register-container">
          <IonCard className="register-card">
            <IonCardHeader>
              <IonCardTitle>Create Account</IonCardTitle>
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <IonSegment value={role} onIonChange={(e) => setRole(e.detail.value as UserRole)} style={{ width: '100%' }}>
                  <IonSegmentButton value="donor">
                    <IonLabel>Donor</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="ngo">
                    <IonLabel>NGO</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>
            </IonCardHeader>

            <IonCardContent>
              <form onSubmit={handleRegister}>
                {/* Basic Information Header */}
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>Basic Information</div>

                {/* Common Fields */}
                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={mailOutline} slot="start" />
                  <IonLabel position="floating">Email *</IonLabel>
                  <IonInput type="email" value={formData.email} onIonInput={(e) => handleInputChange('email', e.detail.value || '')} required />
                </IonItem>

                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={personOutline} slot="start" />
                  <IonLabel position="floating">{role === 'donor' ? 'Full Name *' : 'Contact Person Name *'}</IonLabel>
                  <IonInput
                    type="text"
                    value={formData.full_name}
                    onIonInput={(e) => handleInputChange('full_name', e.detail.value || '')}
                    required
                  />
                </IonItem>

                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={callOutline} slot="start" />
                  <IonLabel position="floating">Phone Number {role === 'ngo' ? '*' : '(Optional)'}</IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.phone_number}
                    onIonInput={(e) => handleInputChange('phone_number', e.detail.value || '')}
                    required={role === 'ngo'}
                  />
                </IonItem>

                {/* NGO-specific Fields */}
                {role === 'ngo' && (
                  <>
                    <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '24px', marginBottom: '16px' }}></div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>Organization Details</div>
                    <IonItem className="ion-margin-bottom">
                      <IonIcon icon={businessOutline} slot="start" />
                      <IonLabel position="floating">Organization Name *</IonLabel>
                      <IonInput
                        type="text"
                        value={formData.organization_name}
                        onIonInput={(e) => handleInputChange('organization_name', e.detail.value || '')}
                        required
                      />
                    </IonItem>

                    <IonItem className="ion-margin-bottom">
                      <IonIcon icon={documentTextOutline} slot="start" />
                      <IonLabel position="floating">Registration Number *</IonLabel>
                      <IonInput
                        type="text"
                        value={formData.registration_number}
                        onIonInput={(e) => handleInputChange('registration_number', e.detail.value || '')}
                        required
                      />
                    </IonItem>

                    <IonItem className="ion-margin-bottom">
                      <IonIcon icon={homeOutline} slot="start" />
                      <IonLabel position="floating">Address *</IonLabel>
                      <IonInput
                        type="text"
                        value={formData.address}
                        onIonInput={(e) => handleInputChange('address', e.detail.value || '')}
                        required
                      />
                    </IonItem>

                    <IonItem className="ion-margin-bottom">
                      <IonIcon icon={documentTextOutline} slot="start" />
                      <IonLabel position="floating">Description (Optional)</IonLabel>
                      <IonInput type="text" value={formData.description} onIonInput={(e) => handleInputChange('description', e.detail.value || '')} />
                    </IonItem>
                  </>
                )}

                {/* Security Section */}
                <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '24px', marginBottom: '16px' }}></div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>Security</div>

                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={lockClosedOutline} slot="start" />
                  <IonLabel position="floating">Password *</IonLabel>
                  <IonInput
                    type="password"
                    value={formData.password}
                    onIonInput={(e) => handleInputChange('password', e.detail.value || '')}
                    required
                  />
                </IonItem>

                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={lockClosedOutline} slot="start" />
                  <IonLabel position="floating">Confirm Password *</IonLabel>
                  <IonInput
                    type="password"
                    value={formData.confirmPassword}
                    onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value || '')}
                    required
                  />
                </IonItem>

                <IonButton expand="block" type="submit" disabled={loading} className="ion-margin-top">
                  {loading ? <IonSpinner name="crescent" /> : 'Register'}
                </IonButton>
              </form>

              <div className="register-footer">
                <IonText color="medium">
                  <p>
                    Already have an account?{' '}
                    <IonText color="primary" onClick={() => history.push('/login')}>
                      <strong style={{ cursor: 'pointer' }}>Login</strong>
                    </IonText>
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={error} duration={3000} color="danger" position="top" />
      </IonContent>
    </IonPage>
  );
};

export default Register;
