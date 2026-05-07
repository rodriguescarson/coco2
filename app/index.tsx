import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Storage } from '../lib/storage';

export default function Index() {
  const [done, setDone] = useState<{ onboarded: boolean } | null>(null);
  useEffect(() => {
    Storage.getOnboarded().then((onboarded) => setDone({ onboarded }));
  }, []);
  if (!done) return <View />;
  return <Redirect href={done.onboarded ? '/(tabs)' : '/onboarding'} />;
}
