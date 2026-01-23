import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonTextarea,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  useIonToast,
  IonIcon,
} from '@ionic/react';
import { checkmarkCircle as saveIcon } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { NGOProfile } from '../../types';
import './EditNGO.css';

const EditNGO: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();
  const [present] = useIonToast();

  const [ngoProfile, setNgoProfile] = useState<NGOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [organizationName, setOrganizationName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadNGOProfile();
  }, [userId]);

  const loadNGOProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading NGO profile for user_id:', userId);
      const ngos = await adminService.getAllNGOs();
      console.log('All NGOs:', ngos);
      const ngo = ngos.find((n) => n.user_id === parseInt(userId));
      console.log('Found NGO:', ngo);

      if (!ngo) {
        present({
          message: 'NGO profile not found',
          duration: 3000,
          color: 'danger',
        });
        history.goBack();
        return;
      }

      setNgoProfile(ngo);
      setOrganizationName(ngo.organization_name || '');
      setRegistrationNumber(ngo.registration_number || '');
      setContactPerson(ngo.contact_person || '');
      setPhone(ngo.phone || '');
    } catch (err: any) {
      console.error('Error loading NGO profile:', err);
      present({
        message: 'Failed to load NGO profile',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!ngoProfile) return;

    // Validation
    if (!organizationName.trim()) {
      present({
        message: 'Organization name is required',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!contactPerson.trim()) {
      present({
        message: 'Contact person is required',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!phone.trim()) {
      present({
        message: 'Phone number is required',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      setSaving(true);

      await adminService.updateNGOProfile(ngoProfile.id, {
        organization_name: organizationName,
        registration_number: registrationNumber,
        contact_person: contactPerson,
        phone: phone,
      });

      present({
        message: 'NGO profile updated successfully',
        duration: 2000,
        color: 'success',
      });

      // Navigate back to users page
      history.push('/admin/users');
    } catch (err: any) {
      console.error('Error updating NGO:', err);
      const message = err.response?.data?.detail || 'Failed to update NGO profile';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
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
              <IonBackButton defaultHref="/admin/users" />
            </IonButtons>
            <IonTitle>Edit NGO</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading NGO profile...</p>
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
            <IonBackButton defaultHref="/admin/users" />
          </IonButtons>
          <IonTitle>Edit NGO Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="edit-ngo-container">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>NGO Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Organization Name *</IonLabel>
                <IonInput
                  value={organizationName}
                  onIonInput={(e) => setOrganizationName(e.detail.value || '')}
                  placeholder="Enter organization name"
                  required
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Registration Number</IonLabel>
                <IonInput
                  value={registrationNumber}
                  onIonInput={(e) => setRegistrationNumber(e.detail.value || '')}
                  placeholder="Enter registration number"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Contact Person *</IonLabel>
                <IonInput
                  value={contactPerson}
                  onIonInput={(e) => setContactPerson(e.detail.value || '')}
                  placeholder="Enter contact person name"
                  required
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Phone Number *</IonLabel>
                <IonInput value={phone} onIonInput={(e) => setPhone(e.detail.value || '')} placeholder="Enter phone number" type="tel" required />
              </IonItem>

              <div className="form-actions">
                <IonButton expand="block" onClick={handleSubmit} disabled={saving} className="submit-btn">
                  {saving ? (
                    <>
                      <IonSpinner name="dots" />
                      <span style={{ marginLeft: '8px' }}>Saving...</span>
                    </>
                  ) : (
                    <>
                      <IonIcon slot="start" icon={saveIcon} />
                      Update NGO Profile
                    </>
                  )}
                </IonButton>

                <IonButton expand="block" fill="outline" onClick={() => history.goBack()} disabled={saving} className="cancel-btn">
                  Cancel
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {ngoProfile && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Additional Information</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="info-item">
                  <span className="info-label">Contact Person:</span>
                  <span className="info-value">{ngoProfile.contact_person}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{ngoProfile.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`info-value status-${ngoProfile.verification_status}`}>{ngoProfile.verification_status}</span>
                </div>
                {ngoProfile.verified_at && (
                  <div className="info-item">
                    <span className="info-label">Verified At:</span>
                    <span className="info-value">{new Date(ngoProfile.verified_at).toLocaleString()}</span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditNGO;
