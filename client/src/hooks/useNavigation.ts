import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export function useNavigation() {
  const [, setLocation] = useLocation();
  const selectedId = useSelector((state: RootState) => state.applicant.selectedId);

  useEffect(() => {
    if (selectedId) {
      setLocation(`/detail/${selectedId}`);
    }
  }, [selectedId, setLocation]);
}
