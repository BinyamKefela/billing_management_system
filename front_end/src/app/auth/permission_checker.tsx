'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function usePermissionCheck(requiredPermission: string | string[], redirectTo: string = '/auth/unauthorized') {
  const router = useRouter();

  useEffect(() => {
    console.log('Checking permissions...'+Cookies.get('permissions'));
    const permissionsCookie = Cookies.get('permissions');
    const userPermissions = permissionsCookie ? JSON.parse(permissionsCookie) : [];

    let hasPermission = false;

    if (Array.isArray(requiredPermission)) {
      hasPermission = requiredPermission.every(perm => userPermissions.includes(perm));
    } else {
      hasPermission = userPermissions.includes(requiredPermission);
    }

    if (!hasPermission) {
      console.log(`Missing permission: ${requiredPermission}, redirecting...`);
      router.push(redirectTo);
    }
  }, [requiredPermission, redirectTo, router]);

  return null;
}