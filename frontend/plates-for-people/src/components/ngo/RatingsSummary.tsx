import React from 'react';
import { IonIcon } from '@ionic/react';
import { star, starOutline, starHalf } from 'ionicons/icons';
import './RatingsSummary.css';

interface RatingsSummaryProps {
  averageRating: number | null;
  totalRatings: number;
  size?: 'small' | 'medium' | 'large';
}

export const RatingsSummary: React.FC<RatingsSummaryProps> = ({
  averageRating,
  totalRatings,
  size = 'medium',
}) => {
  const renderStars = () => {
    if (averageRating === null) {
      return (
        <div className={`stars-container ${size}`}>
          {[...Array(5)].map((_, i) => (
            <IonIcon key={i} icon={starOutline} className="star-icon empty" />
          ))}
        </div>
      );
    }

    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<IonIcon key={i} icon={star} className="star-icon filled" />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<IonIcon key="half" icon={starHalf} className="star-icon half" />);
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(averageRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<IonIcon key={`empty-${i}`} icon={starOutline} className="star-icon empty" />);
    }

    return <div className={`stars-container ${size}`}>{stars}</div>;
  };

  return (
    <div className="ratings-summary">
      {renderStars()}
      <div className="rating-text">
        {averageRating !== null ? (
          <>
            <span className="rating-value">{averageRating.toFixed(1)}</span>
            <span className="rating-count">({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})</span>
          </>
        ) : (
          <span className="no-ratings">No ratings yet</span>
        )}
      </div>
    </div>
  );
};
