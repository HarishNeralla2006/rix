
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-secondary border border-gray-800 rounded-xl p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;
