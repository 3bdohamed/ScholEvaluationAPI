'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiUrl } from "@/lib/api";

interface StudentClass {
  id: number;
  name: string;
  stage: string;
}

interface ClassForm {
  name: string;
  stage: string;
}

const emptyForm: ClassForm = { name: "", stage: "" };
const stages = ["secondary1", "secondary2", "secondary3"];

function isStudentClass(value: unknown): value is StudentClass {
  if (!value || typeof value !== "object") {
    return false;
  }
  const studentClass = value as Record<string, unknown>;
  return typeof studentClass.id === "number"
    && typeof studentClass.name === "string"
    && typeof studentClass.stage === "string";
}

async function requestApi(path: string, token: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userType");
    window.dispatchEvent(new Event("auth-change"));
    window.location.replace("/login/manager");
    throw new Error("Your manager session has expired. Please sign in again.");
  }

  const responseText = await response.text();
  let result: unknown = null;
  if (responseText) {
    try {
      result = JSON.parse(responseText) as unknown;
    } catch {
      result = responseText;
    }
  }

  if (!response.ok) {
    let message = typeof result === "string" ? result : "";
    if (result && typeof result === "object") {
      const details = result as Record<string, unknown>;
      const responseMessage = details.message ?? details.title ?? details.detail;
      if (typeof responseMessage === "string") {
        message = responseMessage;
      } else if (Array.isArray(details.errors)) {
        message = details.errors
          .filter((error): error is string => typeof error === "string")
          .join(" ");
      }
    }
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return result;
}

export default function ManageClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadClasses = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "manager") {
        router.replace("/login/manager");
        return;
      }

      try {
        const result = await requestApi("/studentclass", token);
        if (!Array.isArray(result) || !result.every(isStudentClass)) {
          throw new Error("The class list returned an unexpected response.");
        }
        if (isActive) {
          setClasses(result);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load classes.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadClasses();
    return () => {
      isActive = false;
    };
  }, [router]);

  const filteredClasses = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) {
      return classes;
    }
    return classes.filter((studentClass) =>
      studentClass.name.toLocaleLowerCase().includes(query)
      || studentClass.stage.toLocaleLowerCase().includes(query),
    );
  }, [classes, searchTerm]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingClassId(null);
  };

  const refreshClasses = async (token: string) => {
    const result = await requestApi("/studentclass", token);
    if (!Array.isArray(result) || !result.every(isStudentClass)) {
      throw new Error("The updated class list returned an unexpected response.");
    }
    setClasses(result);
  };

  const handleEdit = (studentClass: StudentClass) => {
    setForm({ name: studentClass.name, stage: studentClass.stage });
    setEditingClassId(studentClass.id);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSaving(true);

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      setIsSaving(false);
      return;
    }

    let saved = false;
    try {
      await requestApi(
        editingClassId === null ? "/studentclass/" : `/studentclass/${editingClassId}`,
        token,
        {
          method: editingClassId === null ? "POST" : "PUT",
          body: JSON.stringify({
            ...(editingClassId === null ? {} : { id: editingClassId }),
            name: form.name.trim(),
            stage: form.stage,
          }),
        },
      );
      saved = true;
      await refreshClasses(token);
      setNotice(editingClassId === null ? "Class added successfully." : "Class updated successfully.");
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save this class.";
      setError(saved ? `Class saved, but the list could not be refreshed: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (studentClass: StudentClass) => {
    if (!window.confirm(`Delete ${studentClass.name}? This action cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingClassId(studentClass.id);
    let deleted = false;
    try {
      await requestApi(`/studentclass/${studentClass.id}`, token, {
        method: "DELETE",
        body: JSON.stringify({ id: studentClass.id }),
      });
      deleted = true;
      await refreshClasses(token);
      if (editingClassId === studentClass.id) {
        resetForm();
      }
      setNotice(`${studentClass.name} deleted successfully.`);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete this class.";
      setError(deleted ? `Class deleted, but the list could not be refreshed: ${message}` : message);
    } finally {
      setDeletingClassId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <Link href="/manager" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Manager portal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Manage classes</h1>
          <p className="mt-1 text-sm text-gray-600">Create, edit, and remove student classes.</p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700" role="status">{notice}</p>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingClassId === null ? "Add a class" : "Edit class"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="class-name" className="text-sm font-medium text-gray-700">Class name</label>
              <input
                id="class-name"
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="class-stage" className="text-sm font-medium text-gray-700">Stage</label>
              <select
                id="class-stage"
                required
                value={form.stage}
                onChange={(event) => setForm({ ...form, stage: event.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>Select a stage</option>
                {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving…" : editingClassId === null ? "Add class" : "Save changes"}
              </button>
              {editingClassId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Class list</h2>
              <p className="mt-1 text-sm text-gray-600">{filteredClasses.length} of {classes.length} classes</p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search classes</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search class or stage"
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </label>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-600" role="status">Loading classes…</p>
          ) : classes.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No classes found.</p>
          ) : filteredClasses.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No classes match your search.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Class name</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Stage</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClasses.map((studentClass) => (
                    <tr key={studentClass.id}>
                      <td className="px-3 py-3 font-medium text-gray-900">{studentClass.name}</td>
                      <td className="px-3 py-3 text-gray-600">{studentClass.stage}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(studentClass)}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(studentClass)}
                            disabled={deletingClassId === studentClass.id}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingClassId === studentClass.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
