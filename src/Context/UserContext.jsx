import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userDetails, setUserDetails] = useState(() => {
    // Initialize from localStorage if available
    const savedDetails = localStorage.getItem('userDetails');
    return savedDetails ? JSON.parse(savedDetails) : null;
  });

  const updateUserDetails = (details) => {
    // Store in both context and localStorage
    setUserDetails(details);
    localStorage.setItem('userDetails', JSON.stringify(details));
  };

  const clearUserDetails = () => {
    // Clear from both context and localStorage
    setUserDetails(null);
    localStorage.removeItem('userDetails');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
  };

  return (
    <UserContext.Provider value={{ 
      userDetails, 
      updateUserDetails, 
      clearUserDetails,
      // Add convenient getters
      isLoggedIn: !!userDetails,
      isAdmin: userDetails?.user_type === 1,
      userName: userDetails?.username || '',
      userType: userDetails?.user_type,
      userEmail: userDetails?.email,
      userDepartment: userDetails?.department,
      userLocation: userDetails?.location
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};