import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonText, IonIcon, IonToast, IonSpinner } from '@ionic/react';
import { mailOutline, lockClosedOutline, restaurantOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import { CustomInput } from '../../components/CustomInput';
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
      const userData = await login({ email, password });
      // Redirect based on user role
      if (userData.role === 'ngo') {
        window.location.href = '/ngo/dashboard';
      } else if (userData.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/donor/dashboard';
      }
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

          <div className="login-card">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue</p>

            <form onSubmit={handleLogin}>
              <CustomInput label="Email" type="email" value={email} onChange={setEmail} placeholder="Enter your email" icon={mailOutline} required />

              <CustomInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                icon={lockClosedOutline}
                required
              />

              <IonButton expand="block" type="submit" disabled={loading} className="login-button">
                {loading ? <IonSpinner name="crescent" /> : 'Sign In'}
              </IonButton>
            </form>

            <div className="login-footer">
              <p>
                Don't have an account?{' '}
                <span className="register-link" onClick={() => history.push('/register')}>
                  Create Account
                </span>
              </p>
            </div>
          </div>
        </div>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={error} duration={3000} color="danger" position="top" />
      </IonContent>
    </IonPage>
  );
};

export default Login;
