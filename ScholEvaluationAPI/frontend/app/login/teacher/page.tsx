'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

interface TeacherLoginResponse {
  token?: string;
  expiration?: string;
  message?: string;
}

export default function TeacherLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token") && localStorage.getItem("userType") === "teacher") {
      router.replace("/teacher");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/authentication/login/teacher"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      });

      const result: TeacherLoginResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Invalid teacher name or password.");
      }
      if (typeof result.token !== "string" || result.token.length === 0) {
        throw new Error("The login response did not include an authentication token.");
      }

      localStorage.setItem("token", result.token);
      if (typeof result.expiration === "string") {
        localStorage.setItem("expiration", result.expiration);
      } else {
        localStorage.removeItem("expiration");
      }
      localStorage.setItem("userType", "teacher");
      window.dispatchEvent(new Event("auth-change"));
      router.push("/teacher");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <header className="space-y-2 text-center">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Teacher access
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Teacher sign in</h1>
          <p className="text-sm text-gray-600">
            Enter your teacher credentials to access the evaluation platform.
          </p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="teacher-name" className="text-sm font-medium text-gray-700">
              Teacher code
            </label>
            <input
              id="teacher-name"
              type="text"
              autoComplete="username"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="teacher-password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="teacher-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Signing in…" : "Sign in as teacher"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Student?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Student sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
