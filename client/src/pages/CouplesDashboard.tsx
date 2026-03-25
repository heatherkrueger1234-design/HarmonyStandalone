import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function CouplesDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation('/harmony-hub', { replace: true }); }, [setLocation]);
  return null;
}
