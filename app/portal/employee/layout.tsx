'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole')?.toUpperCase();

    // 🔐 HARD SECURITY: Agar token hi nahi hai ya role authorized nahi hai
    if (!token || role === 'IAM' || role === 'SUPER_ADMIN' || role === 'MANAGER') {
      router.replace('/login');
      return;
    }
    
    setPassed(true);
  }, [router]);

  return passed ? <>{children}</> : null;
}