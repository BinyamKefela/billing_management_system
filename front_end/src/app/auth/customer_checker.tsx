'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useCustomerCheck(redirectTo: string = '/auth/unauthorized') {
  const router = useRouter();

  useEffect(() => {
    const is_superuser = Cookies.get('is_superuser');
    if (is_superuser === 'true') {
      console.log('User is superuser, bypassing customer check ');
      return;
    }
    console.log('Checking customer status...');
    

    const isCustomer = Cookies.get('is_customer');

    if (isCustomer !== 'true') {
      console.log('User is not a customer, redirecting...');
      router.push(redirectTo);
    } else {
      console.log('User is a customer ✅');
    }
  }, [redirectTo, router]);

  return null;
}
