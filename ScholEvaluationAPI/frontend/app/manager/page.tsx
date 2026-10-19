'use client';

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ManagerPage() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token") || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userType");
    window.dispatchEvent(new Event("auth-change"));
    router.replace("/login/manager");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Manager portal</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Manager access</h1>
            <p className="mt-2 text-sm text-gray-600">You are signed in to the manager area.</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sign out
          </button>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          <p className="mt-2 text-sm text-gray-600">Add, update, or remove student accounts.</p>
          <Link
            href="/manager/students"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage students
          </Link>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Teachers</h2>
          <p className="mt-2 text-sm text-gray-600">Add, update, or remove teacher accounts.</p>
          <Link
            href="/manager/teachers"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage teachers
          </Link>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
          <p className="mt-2 text-sm text-gray-600">Add, update, or remove student classes.</p>
          <Link
            href="/manager/classes"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage classes
          </Link>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
          <p className="mt-2 text-sm text-gray-600">Add, update, or remove school subjects.</p>
          <Link
            href="/manager/subjects"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage subjects
          </Link>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
          <p className="mt-2 text-sm text-gray-600">Create and manage exercises, questions, and reading paragraphs.</p>
          <Link
            href="/manager/exercises"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage exercises
          </Link>
        </section>
      </div>
    </main>
  );
}
