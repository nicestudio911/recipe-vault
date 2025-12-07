import { useSyncStore } from '@/store/syncStore';
import { useEffect } from 'react';
// TODO: Install @react-native-community/netinfo
// import NetInfo from '@react-native-community/netinfo';

export const useSync = () => {
  const { syncNow, status, lastSync, error } = useSyncStore();

  // TODO: Implement network monitoring when NetInfo is installed
  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener((state) => {
  //     if (state.isConnected && status === 'idle') {
  //       syncNow().catch(console.error);
  //     }
  //   });
  //   return () => unsubscribe();
  // }, [status, syncNow]);

  return {
    syncNow,
    status,
    lastSync,
    error,
  };
};

