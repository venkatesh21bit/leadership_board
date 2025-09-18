'use client';

import { useAuthStore } from '@/app/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

export default function AuthCallback() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('username');

    if (token && username) {
      // Verify token with backend and get user data
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          // Store user data in auth store
          setUser({
            access_token: token,
            github_username: data.user.github_username,
            email: data.user.email,
            full_name: data.user.full_name,
            category: data.user.category,
            points: data.user.points || 0,
            pr_count: data.user.pr_count || 0,
            issues_solved: data.user.issues_solved || 0
          });
          
          // Close the popup and notify the parent window
          if (window.opener) {
            window.opener.postMessage(
              { type: 'AUTH_SUCCESS' },
              window.location.origin,
            );
            window.close();
          } else {
            // If not in popup, redirect to main page
            router.push('/');
          }
        }
      })
      .catch(error => {
        console.error('Auth verification failed:', error);
        // Close popup or redirect
        if (window.opener) {
          window.close();
        } else {
          router.push('/');
        }
      });
    } else {
      // No valid parameters, close popup or redirect
      if (window.opener) {
        window.close();
      } else {
        router.push('/');
      }
    }
  }, [searchParams, setUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">
          Processing authentication...
        </h1>
        <p className="mt-2 text-gray-600">
          Please wait while we complete the sign-in process.
        </p>
      </div>
    </div>
  );
}
