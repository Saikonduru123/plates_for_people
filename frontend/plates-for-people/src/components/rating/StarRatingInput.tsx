import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import './StarRatingInput.css';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  size = 'large',
  readonly = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || value;

  const sizeClass = 
    size === 'small' ? 'star-rating-small' :
    size === 'medium' ? 'star-rating-medium' :
    'star-rating-large';

  return (
    <div className={`star-rating-input ${sizeClass} ${readonly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          className={`star-button ${displayRating >= rating ? 'filled' : ''}`}
          onClick={() => handleClick(rating)}
          onMouseEnter={() => handleMouseEnter(rating)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          aria-label={`${rating} star${rating !== 1 ? 's' : ''}`}
        >
          <IonIcon
            icon={displayRating >= rating ? star : starOutline}
            className="star-icon"
          />
        </button>
      ))}
    </div>
  );
};

export default StarRatingInput;
