import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sos/panic');
  }, [router]);

  return null;
}
