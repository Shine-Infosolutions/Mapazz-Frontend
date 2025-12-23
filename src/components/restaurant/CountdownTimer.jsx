import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ orderTime, prepTime, status }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!orderTime || !prepTime || prepTime <= 0) return;

    const calculateTimeLeft = () => {
      const orderDate = new Date(orderTime);
      const targetTime = new Date(orderDate.getTime() + (prepTime * 60 * 1000));
      const now = new Date();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsOverdue(true);
        setTimeLeft(Math.abs(difference));
      } else {
        setIsOverdue(false);
        setTimeLeft(difference);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [orderTime, prepTime]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!prepTime || prepTime <= 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
      isOverdue 
        ? 'bg-red-100 text-red-600 animate-pulse' 
        : timeLeft <= 60000 
        ? 'bg-yellow-100 text-yellow-600' 
        : 'bg-blue-100 text-blue-600'
    }`}>
      <span className="text-xs">
        {isOverdue ? '+' : ''}{formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default CountdownTimer;