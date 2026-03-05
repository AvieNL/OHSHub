'use client';

import { createContext, useContext } from 'react';

const AdminContext = createContext(false);

export function useIsAdmin(): boolean {
  return useContext(AdminContext);
}

export function AdminContextProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
}
