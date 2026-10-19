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

interface StudentClass {
  id: number;
  name: string;
  stage: string;
}

interface TeacherClassAssignment {
  id: number;
  studentclassid: number;
}

interface Teacher {
  id: number;
  firstname: string;
  lastname: string;
  teatchercode: string;
  subjectid: number;
  subjectname: string | null;
  subjects: Subject | null;
  goverment: string;
  schoolname: string;
  password: string;
  teatcherstudents?: TeacherClassAssignment[] | null;
}

interface TeacherForm {
  firstname: string;
  lastname: string;
  teatchercode: string;
  password: string;
  subjectid: string;
  goverment: string;
  schoolname: string;
}

const emptyForm: TeacherForm = {
  firstname: "",
  lastname: "",
  teatchercode: "",
  password: "",
  subjectid: "",
  goverment: "",
  schoolname: "",
};

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") {
    return false;
  }
  const subject = value as Record<string, unknown>;
  return typeof subject.id === "number" && typeof subject.subjectName === "string";
}

function isStudentClass(value: unknown): value is StudentClass {
  if (!value || typeof value !== "object") {
    return false;
  }
  const studentClass = value as Record<string, unknown>;
  return typeof studentClass.id === "number"
    && typeof studentClass.name === "string"
    && typeof studentClass.stage === "string";
}

function isTeacherClassAssignment(value: unknown): value is TeacherClassAssignment {
  if (!value || typeof value !== "object") {
    return false;
  }
  const assignment = value as Record<string, unknown>;
  return typeof assignment.id === "number" && typeof assignment.studentclassid === "number";
}

function isTeacher(value: unknown): value is Teacher {
  if (!value || typeof value !== "object") {
    return false;
  }
  const teacher = value as Record<string, unknown>;
  return typeof teacher.id === "number"
    && typeof teacher.firstname === "string"
    && typeof teacher.lastname === "string"
    && typeof teacher.teatchercode === "string"
    && typeof teacher.subjectid === "number"
    && (typeof teacher.subjectname === "string" || teacher.subjectname === null)
    && typeof teacher.goverment === "string"
    && typeof teacher.schoolname === "string"
    && typeof teacher.password === "string"
    && (teacher.teatcherstudents === undefined
      || teacher.teatcherstudents === null
      || (Array.isArray(teacher.teatcherstudents) && teacher.teatcherstudents.every(isTeacherClassAssignment)));
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

export default function ManageTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<number | null>(null);
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [classSelectorTeacherId, setClassSelectorTeacherId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isUpdatingClasses, setIsUpdatingClasses] = useState(false);
  const [removingAssignmentId, setRemovingAssignmentId] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "manager") {
        router.replace("/login/manager");
        return;
      }

      try {
        const [teacherResult, subjectResult, classResult] = await Promise.all([
          requestApi("/teacher", token),
          requestApi("/subject", token),
          requestApi("/studentclass", token),
        ]);
        if (!Array.isArray(teacherResult) || !teacherResult.every(isTeacher)) {
          throw new Error("The teacher list returned an unexpected response.");
        }
        if (!Array.isArray(subjectResult) || !subjectResult.every(isSubject)) {
          throw new Error("The subject list returned an unexpected response.");
        }
        if (!Array.isArray(classResult) || !classResult.every(isStudentClass)) {
          throw new Error("The class list returned an unexpected response.");
        }
        if (isActive) {
          setTeachers(teacherResult);
          setSubjects(subjectResult);
          setStudentClasses(classResult);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load teachers.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      isActive = false;
    };
  }, [router]);

  const filteredTeachers = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) {
      return teachers;
    }
    return teachers.filter((teacher) =>
      [
        teacher.firstname,
        teacher.lastname,
        teacher.teatchercode,
        teacher.subjectname ?? teacher.subjects?.subjectName ?? "",
        teacher.schoolname,
        teacher.goverment,
      ].some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [searchTerm, teachers]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingTeacherId(null);
  };

  const handleEdit = (teacher: Teacher) => {
    setForm({
      firstname: teacher.firstname,
      lastname: teacher.lastname,
      teatchercode: teacher.teatchercode,
      password: teacher.password,
      subjectid: String(teacher.subjectid),
      goverment: teacher.goverment,
      schoolname: teacher.schoolname,
    });
    setEditingTeacherId(teacher.id);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setIsSaving(true);
    const payload: {
      id?: number;
      firstname: string;
      lastname: string;
      teatchercode: string;
      password?: string;
      subjectid: number;
      goverment: string;
      schoolname: string;
    } = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      teatchercode: form.teatchercode.trim(),
      subjectid: Number(form.subjectid),
      goverment: form.goverment.trim(),
      schoolname: form.schoolname.trim(),
    };
    if (editingTeacherId !== null) {
      payload.id = editingTeacherId;
    }
    if (editingTeacherId === null && form.password) {
      payload.password = form.password;
    }

    let saved = false;
    try {
      await requestApi(
        editingTeacherId === null ? "/teacher" : `/teacher/${editingTeacherId}`,
        token,
        {
          method: editingTeacherId === null ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      );
      saved = true;

      const result = await requestApi("/teacher", token);
      if (!Array.isArray(result) || !result.every(isTeacher)) {
        throw new Error("The updated teacher list returned an unexpected response.");
      }
      setTeachers(result);
      setNotice(editingTeacherId === null ? "Teacher added successfully." : "Teacher updated successfully.");
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save this teacher.";
      setError(saved ? `Teacher saved, but the list could not be refreshed: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!window.confirm(`Delete ${teacher.firstname} ${teacher.lastname}? This action cannot be undone.`)) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingTeacherId(teacher.id);
    try {
      await requestApi(`/teacher/${teacher.id}`, token, {
        method: "DELETE",
        body: JSON.stringify({ id: teacher.id, password: teacher.password }),
      });
      setTeachers((current) => current.filter((item) => item.id !== teacher.id));
      if (editingTeacherId === teacher.id) {
        resetForm();
      }
      setNotice(`Teacher ${teacher.firstname} ${teacher.lastname} deleted.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete this teacher.");
    } finally {
      setDeletingTeacherId(null);
    }
  };

  const refreshTeachers = async (token: string) => {
    const result = await requestApi("/teacher", token);
    if (!Array.isArray(result) || !result.every(isTeacher)) {
      throw new Error("The updated teacher list returned an unexpected response.");
    }
    setTeachers(result);
  };

  const handleOpenClassSelector = async (teacher: Teacher) => {
    setError(null);
    setNotice(null);
    if (classSelectorTeacherId === teacher.id) {
      setClassSelectorTeacherId(null);
      setSelectedClassId("");
      return;
    }

    setClassSelectorTeacherId(teacher.id);
    setSelectedClassId("");
  };

  const handleAddClass = async (teacher: Teacher) => {
    const number = Number(selectedClassId);
    if (!Number.isInteger(number) || number < 1) {
      setError("Select a class before saving.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setError(null);
    setNotice(null);
    setIsUpdatingClasses(true);
    let classAdded = false;
    try {
      await requestApi("/teacher/addclass", token, {
        method: "POST",
        body: JSON.stringify({ id: teacher.id, number, password: teacher.password }),
      });
      classAdded = true;
      await refreshTeachers(token);
      setClassSelectorTeacherId(null);
      setSelectedClassId("");
      setNotice(`Class added for ${teacher.firstname} ${teacher.lastname}.`);
    } catch (classError) {
      const message = classError instanceof Error ? classError.message : "Unable to add this class.";
      setError(classAdded ? `Class added, but the teacher list could not be refreshed: ${message}` : message);
    } finally {
      setIsUpdatingClasses(false);
    }
  };

  const handleRemoveClass = async (teacher: Teacher, assignment: TeacherClassAssignment) => {
    const className = studentClasses.find((item) => item.id === assignment.studentclassid)?.name
      ?? `class #${assignment.studentclassid}`;
    if (!window.confirm(`Remove ${teacher.firstname} ${teacher.lastname} from ${className}?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setError(null);
    setNotice(null);
    setRemovingAssignmentId(assignment.id);
    let classRemoved = false;
    try {
      await requestApi("/teacher/removeclass/", token, {
        method: "DELETE",
        body: JSON.stringify({ id: assignment.id, password: teacher.password }),
      });
      classRemoved = true;
      await refreshTeachers(token);
      setNotice(`${teacher.firstname} ${teacher.lastname} removed from ${className}.`);
    } catch (classError) {
      const message = classError instanceof Error ? classError.message : "Unable to remove this class.";
      setError(classRemoved ? `Class removed, but the teacher list could not be refreshed: ${message}` : message);
    } finally {
      setRemovingAssignmentId(null);
    }
  };

  const classNameForId = (id: number) =>
    studentClasses.find((studentClass) => studentClass.id === id)?.name ?? `Class #${id}`;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <Link href="/manager" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Manager portal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Manage teachers</h1>
          <p className="mt-1 text-sm text-gray-600">Create teacher accounts and update or remove existing teachers.</p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700" role="status">{notice}</p>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingTeacherId === null ? "Add a teacher" : "Edit teacher"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="teacher-firstname" className="text-sm font-medium text-gray-700">First name</label>
              <input id="teacher-firstname" required value={form.firstname} onChange={(event) => setForm({ ...form, firstname: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="space-y-1">
              <label htmlFor="teacher-lastname" className="text-sm font-medium text-gray-700">Last name</label>
              <input id="teacher-lastname" required value={form.lastname} onChange={(event) => setForm({ ...form, lastname: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="space-y-1">
              <label htmlFor="teacher-code" className="text-sm font-medium text-gray-700">Teacher code</label>
              <input id="teacher-code" required readOnly={editingTeacherId !== null} value={form.teatchercode} onChange={(event) => setForm({ ...form, teatchercode: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 read-only:bg-gray-50 read-only:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="space-y-1">
              <label htmlFor="teacher-password" className="text-sm font-medium text-gray-700">
                Password {editingTeacherId !== null && <span className="font-normal text-gray-500">(cannot be changed here)</span>}
              </label>
              <input id="teacher-password" type={editingTeacherId === null ? "password" : "text"} required={editingTeacherId === null} readOnly={editingTeacherId !== null} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 read-only:bg-gray-50 read-only:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="space-y-1">
              <label htmlFor="teacher-subject" className="text-sm font-medium text-gray-700">Subject</label>
              <select id="teacher-subject" required value={form.subjectid} onChange={(event) => setForm({ ...form, subjectid: event.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                <option value="" disabled>Select a subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subjectName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="teacher-school" className="text-sm font-medium text-gray-700">School</label>
              <input id="teacher-school" required value={form.schoolname} onChange={(event) => setForm({ ...form, schoolname: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="space-y-1">
              <label htmlFor="teacher-government" className="text-sm font-medium text-gray-700">Government</label>
              <input id="teacher-government" required value={form.goverment} onChange={(event) => setForm({ ...form, goverment: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
              <button type="submit" disabled={isSaving || subjects.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? "Saving…" : editingTeacherId === null ? "Add teacher" : "Save changes"}
              </button>
              {editingTeacherId !== null && (
                <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Teacher list</h2>
              <p className="mt-1 text-sm text-gray-600">{filteredTeachers.length} of {teachers.length} teachers</p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search teachers</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, code, subject" className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72" />
            </label>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-600" role="status">Loading teachers…</p>
          ) : teachers.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No teachers found.</p>
          ) : filteredTeachers.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No teachers match your search.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Name</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Teacher code</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Password</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Subject</th>
                    <th scope="col" className="px-3 py-3 font-semibold">School</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Government</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Assigned classes</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-3 py-3 font-medium text-gray-900">{teacher.firstname} {teacher.lastname}</td>
                      <td className="px-3 py-3 text-gray-600">{teacher.teatchercode}</td>
                      <td className="px-3 py-3 font-mono text-gray-600">{teacher.password}</td>
                      <td className="px-3 py-3 text-gray-600">{teacher.subjectname ?? teacher.subjects?.subjectName ?? `Subject #${teacher.subjectid}`}</td>
                      <td className="px-3 py-3 text-gray-600">{teacher.schoolname}</td>
                      <td className="px-3 py-3 text-gray-600">{teacher.goverment}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {(teacher.teatcherstudents ?? []).length === 0 ? (
                            <span className="text-gray-500">No classes assigned</span>
                          ) : (
                            (teacher.teatcherstudents ?? []).map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                              >
                                {classNameForId(assignment.studentclassid)}
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveClass(teacher, assignment)}
                                  disabled={removingAssignmentId === assignment.id || isUpdatingClasses}
                                  aria-label={`Remove ${classNameForId(assignment.studentclassid)} from ${teacher.firstname} ${teacher.lastname}`}
                                  className="font-semibold text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {removingAssignmentId === assignment.id ? "…" : "×"}
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleEdit(teacher)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
                          <button type="button" onClick={() => void handleDelete(teacher)} disabled={deletingTeacherId === teacher.id} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                            {deletingTeacherId === teacher.id ? "Deleting…" : "Delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleOpenClassSelector(teacher)}
                            disabled={isUpdatingClasses}
                            aria-expanded={classSelectorTeacherId === teacher.id}
                            className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Add class
                          </button>
                          </div>
                          {classSelectorTeacherId === teacher.id && (
                            <div className="flex items-center gap-2">
                              <label className="sr-only" htmlFor={`teacher-class-${teacher.id}`}>
                                Select class for {teacher.firstname} {teacher.lastname}
                              </label>
                              <select
                                id={`teacher-class-${teacher.id}`}
                                value={selectedClassId}
                                onChange={(event) => setSelectedClassId(event.target.value)}
                                disabled={isUpdatingClasses}
                                className="max-w-56 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="" disabled>Select a class</option>
                                {studentClasses.map((studentClass) => {
                                  const alreadyAssigned = (teacher.teatcherstudents ?? [])
                                    .some((assignment) => assignment.studentclassid === studentClass.id);
                                  return (
                                    <option
                                      key={studentClass.id}
                                      value={studentClass.id}
                                      disabled={alreadyAssigned}
                                    >
                                      {studentClass.name} · {studentClass.stage}{alreadyAssigned ? " (assigned)" : ""}
                                    </option>
                                  );
                                })}
                              </select>
                              <button
                                type="button"
                                onClick={() => void handleAddClass(teacher)}
                                disabled={isUpdatingClasses || !selectedClassId}
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdatingClasses ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setClassSelectorTeacherId(null);
                                  setSelectedClassId("");
                                }}
                                disabled={isUpdatingClasses}
                                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
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
