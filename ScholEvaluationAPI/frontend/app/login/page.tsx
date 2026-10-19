'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

export default  function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
     async function checkToken() {
      console.log("Checking token in localStorage...");
      if (localStorage.getItem("token") != null) {
        const response = await fetch(apiUrl("/students/0"), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (response.ok) {
          router.push('/student');
        }
      }
      console.log("Token check completed.");
     
    }
     checkToken();

  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Replace '/api/login' with your actual backend API URL or Next.js API route
      const response = await fetch(apiUrl("/authentication/login/student"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: code, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid code or password.');
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("expiration", data.expiration);
      localStorage.setItem("userType", "student");

      // Success: Redirect to evaluations or dashboard page
      router.push('/student');
      window.dispatchEvent(new Event("auth-change"));
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
            Welcome Back
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Log in to your account
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter your credentials to access the evaluation platform.
          </p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="code">
              Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="0123456789"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-300">
          Need access?{' '}
          <Link href="/about" className="font-medium text-blue-600 hover:underline">
            Contact administrator
          </Link>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-300">
          Are you a teacher?{" "}
          <Link href="/login/teacher" className="font-medium text-blue-600 hover:underline">
            Teacher sign in
          </Link>
        </div>

      </div>
    </div>
  );
}