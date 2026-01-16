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
} from '@ionic/react';
import { mailOutline, lockClosedOutline, restaurantOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter email and password');
      setShowToast(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      // Redirect will be handled by App.tsx based on user role
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
      <IonContent className="ion-padding" fullscreen>
        <div className="login-container">
          <div className="login-header">
            <IonIcon icon={restaurantOutline} className="logo-icon" />
            <h1>Plates for People</h1>
            <p className="tagline">Share Food, Share Love</p>
          </div>

          <IonCard className="login-card">
            <IonCardHeader>
              <IonCardTitle>Login</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={mailOutline} slot="start" />
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value || '')}
                    required
                    autocomplete="email"
                  />
                </IonItem>

                <IonItem className="ion-margin-bottom">
                  <IonIcon icon={lockClosedOutline} slot="start" />
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value || '')}
                    required
                    autocomplete="current-password"
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  className="ion-margin-top"
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Login'}
                </IonButton>
              </form>

              <div className="login-footer">
                <IonText color="medium">
                  <p>
                    Don't have an account?{' '}
                    <IonText color="primary" onClick={() => history.push('/register')}>
                      <strong style={{ cursor: 'pointer' }}>Register</strong>
                    </IonText>
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={error}
          duration={3000}
          color="danger"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
