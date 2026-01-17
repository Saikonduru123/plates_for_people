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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonChip,
  IonBadge,
  IonToast,
} from '@ionic/react';
import {
  starOutline,
  star,
  personOutline,
  calendarOutline,
  chatboxOutline,
  trophyOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { ngoService } from '../../services/ngoService';
import type { Rating, NGORatingSummary } from '../../types';
import './ViewRatings.css';

const ViewRatings: React.FC = () => {
  const [summary, setSummary] = useState<NGORatingSummary | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const data = await ngoService.getRatingSummary();
      setSummary(data);
      setRatings(data.recent_ratings || []);
    } catch (error: any) {
      console.error('Error loading ratings:', error);
      setToastMessage('Failed to load ratings');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadRatings();
    event.detail.complete();
  };

  const getFilteredRatings = (): Rating[] => {
    if (filterRating === 'all') {
      return ratings;
    }
    return ratings.filter((r) => r.rating === filterRating);
  };

  const renderStars = (rating: number, size: 'small' | 'medium' | 'large' = 'medium') => {
    const stars = [];
    const iconSize = size === 'small' ? '16px' : size === 'medium' ? '20px' : '28px';
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          style={{ fontSize: iconSize, color: i <= rating ? '#ffc409' : '#ccc' }}
        />
      );
    }
    return <div className="stars-container">{stars}</div>;
  };

  const renderRatingDistribution = () => {
    if (!summary || summary.total_ratings === 0) return null;

    const distribution = summary.rating_distribution;
    const maxCount = Math.max(...Object.values(distribution));

    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const percentage = summary.total_ratings > 0 ? (count / summary.total_ratings) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={star} className="distribution-row">
              <div className="distribution-label">
                {star} <IonIcon icon={starOutline} />
              </div>
              <div className="distribution-bar-container">
                <div
                  className="distribution-bar"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: getBarColor(star),
                  }}
                ></div>
              </div>
              <div className="distribution-count">
                {count} ({percentage.toFixed(0)}%)
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getBarColor = (rating: number): string => {
    if (rating >= 4) return '#4caf50'; // Green
    if (rating === 3) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDonorName = (rating: Rating): string => {
    // For now, we just show "Donor" since the donation object doesn't include donor details
    // In a real implementation, you might fetch donor info or include it in the API response
    return `Donor #${rating.donor_id}`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ngo/dashboard" />
            </IonButtons>
            <IonTitle>View Ratings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading ratings...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const filteredRatings = getFilteredRatings();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/ngo/dashboard" />
          </IonButtons>
          <IonTitle>View Ratings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="view-ratings-container">
          {/* Overall Rating Summary */}
          {summary && summary.total_ratings > 0 ? (
            <>
              <IonCard className="summary-card">
                <IonCardContent>
                  <div className="summary-header">
                    <IonIcon icon={trophyOutline} className="trophy-icon" />
                    <h2>Overall Rating</h2>
                  </div>
                  <div className="average-rating-display">
                    <div className="rating-number">{summary.average_rating.toFixed(1)}</div>
                    <div className="rating-stars-large">
                      {renderStars(Math.round(summary.average_rating), 'large')}
                    </div>
                    <div className="total-ratings-text">
                      Based on {summary.total_ratings} rating{summary.total_ratings !== 1 ? 's' : ''}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Rating Distribution */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={statsChartOutline} className="section-icon" />
                    Rating Distribution
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>{renderRatingDistribution()}</IonCardContent>
              </IonCard>

              {/* Filter */}
              <IonCard>
                <IonCardContent>
                  <div className="filter-container">
                    <label className="filter-label">Filter by Rating:</label>
                    <IonSelect
                      value={filterRating}
                      onIonChange={(e) => setFilterRating(e.detail.value)}
                      interface="popover"
                    >
                      <IonSelectOption value="all">All Ratings</IonSelectOption>
                      <IonSelectOption value={5}>5 Stars</IonSelectOption>
                      <IonSelectOption value={4}>4 Stars</IonSelectOption>
                      <IonSelectOption value={3}>3 Stars</IonSelectOption>
                      <IonSelectOption value={2}>2 Stars</IonSelectOption>
                      <IonSelectOption value={1}>1 Star</IonSelectOption>
                    </IonSelect>
                  </div>
                  <div className="filter-results">
                    Showing {filteredRatings.length} of {ratings.length} rating
                    {ratings.length !== 1 ? 's' : ''}
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Ratings List */}
              {filteredRatings.length > 0 ? (
                <div className="ratings-list">
                  {filteredRatings.map((rating) => (
                    <IonCard key={rating.id} className="rating-card">
                      <IonCardContent>
                        <div className="rating-header">
                          <div className="rating-info">
                            <div className="donor-info">
                              <IonIcon icon={personOutline} className="donor-icon" />
                              <span className="donor-name">{getDonorName(rating)}</span>
                            </div>
                            <div className="rating-date">
                              <IonIcon icon={calendarOutline} />
                              {formatDate(rating.created_at)}
                            </div>
                          </div>
                          <div className="rating-stars">{renderStars(rating.rating)}</div>
                        </div>

                        {rating.feedback && (
                          <div className="rating-feedback">
                            <IonIcon icon={chatboxOutline} className="feedback-icon" />
                            <p className="feedback-text">{rating.feedback}</p>
                          </div>
                        )}

                        {rating.donation && (
                          <div className="donation-info">
                            <IonBadge color="light" className="donation-badge">
                              Donation #{rating.donation_id}
                            </IonBadge>
                            {rating.donation.meal_type && (
                              <IonChip className="meal-chip" color="primary" outline>
                                {rating.donation.meal_type}
                              </IonChip>
                            )}
                          </div>
                        )}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              ) : (
                <IonCard>
                  <IonCardContent>
                    <div className="no-results">
                      <IonIcon icon={starOutline} className="no-results-icon" />
                      <p>No ratings found with the selected filter.</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="empty-state">
              <IonIcon icon={starOutline} className="empty-icon" />
              <h3>No Ratings Yet</h3>
              <p>
                You haven't received any ratings yet.
                <br />
                Complete donations to start receiving feedback from donors!
              </p>
            </div>
          )}
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color="danger"
        position="top"
      />
    </IonPage>
  );
};

export default ViewRatings;
