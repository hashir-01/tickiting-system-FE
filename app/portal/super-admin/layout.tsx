'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('userRole')?.toUpperCase() !== 'SUPER_ADMIN') {
      router.replace('/login');
      return;
    }
    setPassed(true);
  }, [router]);

  return passed ? <>{children}</> : null;
}