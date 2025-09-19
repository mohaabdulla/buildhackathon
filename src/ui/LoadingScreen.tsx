import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <h1>The Great Food Amnesia</h1>
      <p>A Mystery Detective Game</p>
      <div className="loading-spinner"></div>
      <p>Loading database and assets...</p>
    </div>
  );
};
