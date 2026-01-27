import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import {
  heartOutline,
  peopleOutline,
  restaurantOutline,
  statsChartOutline,
  shieldCheckmarkOutline,
  mapOutline,
  arrowForward,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const history = useHistory();

  const handleLogin = () => {
    history.push('/login');
  };

  const handleRegister = () => {
    history.push('/register');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="landing-toolbar">
          <IonTitle className="landing-header-title">
            <span className="logo-icon">🍽️</span> Plates for People
          </IonTitle>
          <div slot="end" className="header-actions">
            <IonButton fill="clear" onClick={handleLogin}>
              Login
            </IonButton>
            <IonButton onClick={handleRegister}>
              Get Started
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Bridging the Gap Between <span className="highlight">Surplus Food</span> and <span className="highlight">Those in Need</span>
            </h1>
            <p className="hero-subtitle">
              Join our mission to reduce food waste and fight hunger. Connect donors with verified NGOs to make every meal count.
            </p>
            <div className="hero-actions">
              <IonButton size="large" onClick={handleRegister} className="cta-button">
                Start Making a Difference
                <IonIcon icon={arrowForward} slot="end" />
              </IonButton>
              <IonButton size="large" fill="outline" onClick={handleLogin} className="secondary-button">
                Sign In
              </IonButton>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Meals Donated</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Donors</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">NGO Partners</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Our platform makes food donation simple, transparent, and impactful
          </p>

          <div className="features-grid">
            <IonCard className="feature-card">
              <IonCardContent>
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <IonIcon icon={restaurantOutline} />
                </div>
                <h3>Easy Donation</h3>
                <p>
                  Donors can quickly list surplus food with details about quantity, type, and pickup location. Our smart system matches you with the nearest NGOs.
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard className="feature-card">
              <IonCardContent>
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <IonIcon icon={mapOutline} />
                </div>
                <h3>Smart Matching</h3>
                <p>
                  Our intelligent algorithm matches food donations with nearby NGOs based on location, capacity, and food preferences for maximum efficiency.
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard className="feature-card">
              <IonCardContent>
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <IonIcon icon={shieldCheckmarkOutline} />
                </div>
                <h3>Verified NGOs</h3>
                <p>
                  All NGO partners are thoroughly verified by our admin team. Every organization is vetted for authenticity and commitment to serving communities.
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard className="feature-card">
              <IonCardContent>
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <IonIcon icon={statsChartOutline} />
                </div>
                <h3>Real-time Tracking</h3>
                <p>
                  Track your donations from creation to completion. Get updates when NGOs accept, pick up, and distribute your food donations.
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard className="feature-card">
              <IonCardContent>
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <IonIcon icon={heartOutline} />
                </div>
                <h3>Impact Metrics</h3>
                <p>
                  See the difference you're making with detailed analytics. Track meals provided, people fed, and environmental impact of reducing food waste.
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard className="feature-card">
              <IonCardContent>
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                  <IonIcon icon={peopleOutline} />
                </div>
                <h3>Community Driven</h3>
                <p>
                  Join a growing community of donors, NGOs, and volunteers working together to eliminate hunger and reduce food waste in our cities.
                </p>
              </IonCardContent>
            </IonCard>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
              Every day, tons of edible food goes to waste while millions go hungry. <strong>Plates for People</strong> is on a mission to change that. We've built a platform that makes it effortless for individuals, restaurants, and businesses to donate surplus food to verified NGOs who serve those in need.
            </p>
            <p className="mission-text">
              We believe that food is a fundamental right, not a privilege. Through technology and community collaboration, we're creating a world where no one goes to bed hungry and no good food goes to waste.
            </p>
            <div className="mission-values">
              <div className="value-item">
                <span className="value-emoji">🌍</span>
                <h4>Sustainability</h4>
                <p>Reducing food waste to protect our planet</p>
              </div>
              <div className="value-item">
                <span className="value-emoji">🤝</span>
                <h4>Transparency</h4>
                <p>Complete visibility into donation flow</p>
              </div>
              <div className="value-item">
                <span className="value-emoji">💪</span>
                <h4>Impact</h4>
                <p>Creating measurable change in communities</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of donors and NGOs working together to end hunger and food waste</p>
            <div className="cta-buttons">
              <IonButton size="large" onClick={handleRegister} className="cta-primary">
                Sign Up Now
                <IonIcon icon={arrowForward} slot="end" />
              </IonButton>
              <IonButton size="large" fill="outline" color="light" onClick={handleLogin}>
                Already have an account? Login
              </IonButton>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <h3><span className="logo-icon">🍽️</span> Plates for People</h3>
              <p>Making every meal count</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Platform</h4>
                <ul>
                  <li>How it Works</li>
                  <li>For Donors</li>
                  <li>For NGOs</li>
                  <li>Impact Stories</li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li>About Us</li>
                  <li>Our Mission</li>
                  <li>Contact</li>
                  <li>Support</li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                  <li>Cookie Policy</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Plates for People. All rights reserved.</p>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;

