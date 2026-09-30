import React, { createContext, useContext } from 'react';

const UserContext = createContext({ user: null, setUser: () => {} });

export function useUser() {
  return useContext(UserContext);
}

export default UserContext;
