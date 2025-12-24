import React from 'react';
import hotelLogo from '/mapazz.png';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-100/10 rounded-full animate-ping"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo Container */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto mb-4 relative">
            {/* Rotating Ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500/60 border-r-purple-500/40 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-transparent border-b-purple-400/40 border-l-blue-400/30 rounded-full animate-spin-reverse"></div>
            
            {/* Logo */}
            <div className="absolute inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
              <img 
                src={hotelLogo} 
                alt="Mapazz Hotel" 
                className="w-16 h-16 object-contain animate-bounce"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>
          
          {/* Hotel Name */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 animate-fade-in">
            MAPAZZ
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in-delay">
            Hotel Management System
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-64 mx-auto mb-6">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-loading-bar"></div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-500 text-sm animate-pulse">
          Loading your experience...
        </p>

        {/* Floating Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>


    </div>
  );
};

export default LoadingScreen;