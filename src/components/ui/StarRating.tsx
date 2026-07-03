import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, readonly = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);

  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`${sizes[size]} transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(star * 2)}
          disabled={readonly}
        >
          <span className={star * 2 <= (hover || value) ? 'text-yellow-400' : 'text-gray-600'}>★</span>
        </button>
      ))}
    </div>
  );
};
