/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type NavContextValue = {
  open: boolean;
  toggle: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav deve essere usato dentro NavProvider');
  return ctx;
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const value = useMemo(() => ({ open, toggle }), [open, toggle]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
