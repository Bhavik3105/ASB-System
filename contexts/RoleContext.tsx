'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RoleContextType {
  role: string;
  name: string;
  isViewer: boolean;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: '',
  name: '',
  isViewer: false,
  loading: true,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRole(data.data.role);
          setName(data.data.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleContext.Provider value={{ role, name, isViewer: role === 'viewer', loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
