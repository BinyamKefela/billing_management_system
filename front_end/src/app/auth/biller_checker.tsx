'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useBillerCheck(redirectTo: string = '/auth/unauthorized') {
  const router = useRouter();

  useEffect(() => {
    const is_superuser = Cookies.get('is_superuser');
    if (is_superuser === 'true') {
      console.log('User is superuser, bypassing biller check ');
      return;
    }
    console.log('Checking biller status...');

    const isBiller = Cookies.get('is_biller');

    if (isBiller !== 'true') {
      console.log('User is not a biller, redirecting...');
      router.push(redirectTo);
    } else {
      console.log('User is a biller ✅');
    }
  }, [redirectTo, router]);

  return null;
}
