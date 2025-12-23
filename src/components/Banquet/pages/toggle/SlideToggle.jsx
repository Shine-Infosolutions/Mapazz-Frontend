// SlideToggle.js
import React from 'react';

const SlideToggle = ({ isOn, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`relative w-14 h-7 bg-gray-300 rounded-full cursor-pointer transition-all duration-300 ${
        isOn ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      <div
        className={`absolute top-0 left-0 w-7 h-7 bg-white rounded-full transition-all duration-300 transform ${
          isOn ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </div>
  );
};

export default SlideToggle;
