import React, { createContext, useState, useContext } from 'react';

// Creating the context
const UploadContext = createContext({
  isUploadComplete: false,
  setUploadComplete: (status: boolean) => {},
});

// Creating a provider component
export const UploadProvider = ({ children }) => {
  const [isUploadComplete, setUploadComplete] = useState(false);

  return (
    <UploadContext.Provider value={{ isUploadComplete, setUploadComplete }}>
      {children}
    </UploadContext.Provider>
  );
};

// Custom hook for using context
export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadContext must be used within a UploadProvider');
  }
  return context;
};

export default UploadContext;