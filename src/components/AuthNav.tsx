"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type PublicUser = { id: string; name: string; email: string; role: string };

export default function AuthNav() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const { user: current } = await api<{ user: PublicUser }>('/auth/me');
        sessionStorage.setItem('gucair_user', JSON.stringify(current));
        if (active) setUser(current);
      } catch {
        sessionStorage.removeItem('gucair_user');
        if (active) setUser(null);
      }
    };
    void sync();
    window.addEventListener('gucair-auth-change', sync);
    return () => {
      active = false;
      window.removeEventListener('gucair-auth-change', sync);
    };
  }, []);

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' });
    } catch {
      // Clear local account display even when the session has already expired.
    }
    sessionStorage.removeItem('gucair_user');
    setUser(null);
    window.dispatchEvent(new Event('gucair-auth-change'));
    router.push('/');
  }

  return user ? <>
    <Link className="navlink" href={user.role === 'university_admin' ? '/university' : user.role === 'super_admin' ? '/admin' : '/dashboard'}>Workspace</Link>
    <Link className="navlink" href="/notifications">Notifications</Link>
    <Link className="navlink" href="/account">Account</Link>
    <button type="button" className="btn btn-secondary" onClick={logout}>Sign out</button>
  </> : <>
    <Link className="navlink" href="/register">Register</Link>
    <Link className="btn" href="/login">Sign in</Link>
  </>;
}
