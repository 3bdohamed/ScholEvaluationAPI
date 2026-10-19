'use client';

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

interface ManagerLoginResponse {
  token?: string;
  expiration?: string;
  message?: string;
}

export default function ManagerLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token") && localStorage.getItem("userType") === "manager") {
      router.replace("/manager");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/authentication/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      });
      const responseBody = await response.text();
      let result: ManagerLoginResponse;
      try {
        result = JSON.parse(responseBody) as ManagerLoginResponse;
      } catch {
        throw new Error(responseBody || `Unable to sign in (${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(result.message || `Invalid manager credentials (${response.status}).`);
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
      localStorage.setItem("userType", "manager");
      window.dispatchEvent(new Event("auth-change"));
      router.replace("/manager");
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
            Restricted access
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manager sign in</h1>
          <p className="text-sm text-gray-600">Enter your manager credentials to continue.</p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="manager-name" className="text-sm font-medium text-gray-700">
              Manager name
            </label>
            <input
              id="manager-name"
              type="text"
              autoComplete="username"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="manager-password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="manager-password"
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
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
