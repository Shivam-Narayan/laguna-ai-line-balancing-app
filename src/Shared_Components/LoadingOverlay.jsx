import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/animation/Animation - 1737702415499.json'; // Adjust this path

const LoadingOverlay = ({ title = "Loading...", message = "Please wait" }) => {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-[400px] flex flex-col items-center">
          <div className="w-24 h-24 mb-4">
            <Lottie 
              animationData={loadingAnimation} 
              loop={true}
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    );
  };

export default LoadingOverlay;