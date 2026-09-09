import { useState, useEffect } from 'react';
import { fetchMe } from '../api';

export function useAuth() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetchMe().then(setUser).catch(() => setUser(null));
  }, []);

  return { user, setUser };
}
