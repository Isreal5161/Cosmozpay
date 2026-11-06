import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext({
  user: null,
  setUser: () => {},
  activities: [],
  setActivities: () => {},
  addActivity: () => {},
});

export function useUser() {
  const context = useContext(UserContext);
  return context;
}

export default UserContext;

// Hook to add new activity
export function useAddActivity() {
  const { addActivity, setActivities } = useContext(UserContext);

  if (typeof addActivity === 'function') return addActivity;

  return (newActivity) => {
    // Add the new activity to the beginning of the list
    setActivities((prevActivities) => [newActivity, ...(prevActivities || [])]);
  };
}
