'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiUrl } from "@/lib/api";

interface Subject {
  id: number;
  subjectName: string;
}

interface SubjectForm {
  subjectName: string;
}

const emptyForm: SubjectForm = { subjectName: "" };

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") {
    return false;
  }
  const subject = value as Record<string, unknown>;
  return typeof subject.id === "number" && typeof subject.subjectName === "string";
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

export default function ManageSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadSubjects = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "manager") {
        router.replace("/login/manager");
        return;
      }

      try {
        const result = await requestApi("/subject", token);
        if (!Array.isArray(result) || !result.every(isSubject)) {
          throw new Error("The subject list returned an unexpected response.");
        }
        if (isActive) {
          setSubjects(result);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load subjects.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadSubjects();
    return () => {
      isActive = false;
    };
  }, [router]);

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) {
      return subjects;
    }
    return subjects.filter((subject) => subject.subjectName.toLocaleLowerCase().includes(query));
  }, [searchTerm, subjects]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingSubjectId(null);
  };

  const refreshSubjects = async (token: string) => {
    const result = await requestApi("/subject", token);
    if (!Array.isArray(result) || !result.every(isSubject)) {
      throw new Error("The updated subject list returned an unexpected response.");
    }
    setSubjects(result);
  };

  const handleEdit = (subject: Subject) => {
    setForm({ subjectName: subject.subjectName });
    setEditingSubjectId(subject.id);
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
        editingSubjectId === null ? "/subject/" : `/subject/${editingSubjectId}`,
        token,
        {
          method: editingSubjectId === null ? "POST" : "PUT",
          body: JSON.stringify({
            ...(editingSubjectId === null ? {} : { id: editingSubjectId }),
            subjectName: form.subjectName.trim(),
          }),
        },
      );
      saved = true;
      await refreshSubjects(token);
      setNotice(editingSubjectId === null ? "Subject added successfully." : "Subject updated successfully.");
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save this subject.";
      setError(saved ? `Subject saved, but the list could not be refreshed: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`Delete ${subject.subjectName}? This action cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingSubjectId(subject.id);
    let deleted = false;
    try {
      await requestApi(`/subject/${subject.id}`, token, {
        method: "DELETE",
        body: JSON.stringify({ id: subject.id }),
      });
      deleted = true;
      await refreshSubjects(token);
      if (editingSubjectId === subject.id) {
        resetForm();
      }
      setNotice(`${subject.subjectName} deleted successfully.`);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete this subject.";
      setError(deleted ? `Subject deleted, but the list could not be refreshed: ${message}` : message);
    } finally {
      setDeletingSubjectId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <Link href="/manager" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Manager portal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Manage subjects</h1>
          <p className="mt-1 text-sm text-gray-600">Create, edit, and remove school subjects.</p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700" role="status">{notice}</p>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingSubjectId === null ? "Add a subject" : "Edit subject"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="subject-name" className="text-sm font-medium text-gray-700">Subject name</label>
              <input
                id="subject-name"
                type="text"
                required
                value={form.subjectName}
                onChange={(event) => setForm({ subjectName: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving…" : editingSubjectId === null ? "Add subject" : "Save changes"}
              </button>
              {editingSubjectId !== null && (
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
              <h2 className="text-lg font-semibold text-gray-900">Subject list</h2>
              <p className="mt-1 text-sm text-gray-600">{filteredSubjects.length} of {subjects.length} subjects</p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search subjects</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search subjects"
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </label>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-600" role="status">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No subjects found.</p>
          ) : filteredSubjects.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No subjects match your search.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Subject name</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-3 py-3 font-medium text-gray-900">{subject.subjectName}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(subject)}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(subject)}
                            disabled={deletingSubjectId === subject.id}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingSubjectId === subject.id ? "Deleting…" : "Delete"}
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
