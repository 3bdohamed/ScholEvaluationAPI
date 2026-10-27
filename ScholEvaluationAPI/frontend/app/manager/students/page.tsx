'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiUrl } from "@/lib/api";

interface Student {
  id: number;
  name: string;
  studentcode: string;
  studentclass: string;
  studentclasses?: {
    id?: number;
    name?: string | null;
      stage?: string | null;
      teatcherstudents: {
          teacher: { subjects: Subject };
      }[];
  } | null;
  group: string;
  password: string;
}

interface StudentForm {
  name: string;
  studentcode: string;
  password: string;
  studentclass: string;
  group: string;
}

interface StudentClassOption {
  id: number;
  name: string;
  stage: string;
}

interface ExerciseQuestion {
  degrees?: number | null;
}

interface Exercise {
  id: number;
  classname: string;
  type: string;
  subjectid: number;
  subjects?: { subjectName?: string | null } | null;
  evaluationNum?: number | string | null;
  degrees?: number | null;
  question?: ExerciseQuestion[] | null;
  qwrites?: ExerciseQuestion[] | null;
  paragraphs?: {
    question: ExerciseQuestion[] | null;
    qwrites: ExerciseQuestion[] | null;
  }[] | null;
}

interface Subject {
  id: number;
  subjectName: string;
}

interface SolvedExercise {
  exerciseid: number;
  correctanswer: number;
  totalanswer: number;
  senddate: string;
  iscorrected?: boolean | null;
}

interface StudentDetails extends Student {
  solvedexercises: SolvedExercise[] | null;
}

interface DegreeTotals {
  earned: number;
  possible: number;
}

interface StudentDegreeReport {
  student: Pick<Student, "name" | "studentcode" | "studentclass" | "group">;
  subjects: {
    name: string;
    evaluations: DegreeTotals;
    classAssignments: DegreeTotals;
    homework: DegreeTotals;
    overall: DegreeTotals;
  }[];
}

const emptyForm: StudentForm = {
  name: "",
  studentcode: "",
  password: "",
  studentclass: "",
  group: "",
};

function isStudent(value: unknown): value is Student {
  if (!value || typeof value !== "object") {
    return false;
  }

  const student = value as Record<string, unknown>;
  return typeof student.id === "number"
    && typeof student.name === "string"
    && typeof student.studentcode === "string"
    && typeof student.studentclass === "string"
    && typeof student.group === "string"
    && typeof student.password === "string";
}

function isStudentClassOption(value: unknown): value is StudentClassOption {
  if (!value || typeof value !== "object") {
    return false;
  }
  const studentClass = value as Record<string, unknown>;
  return typeof studentClass.id === "number"
    && typeof studentClass.name === "string"
    && typeof studentClass.stage === "string";
}

function getExerciseDegrees(exercise: Exercise) {
  if (typeof exercise.degrees === "number") {
    return exercise.degrees;
  }

  const questionDegrees = (questions: ExerciseQuestion[] | null | undefined) =>
    (questions ?? []).reduce((total, question) => total + (question.degrees ?? 1), 0);
  const writtenDegrees = (questions: ExerciseQuestion[] | null | undefined) =>
    (questions ?? []).reduce((total, question) => total + (question.degrees ?? 0), 0);

  return questionDegrees(exercise.question)
    + writtenDegrees(exercise.qwrites)
    + (exercise.paragraphs ?? []).reduce(
      (total, paragraph) => total
        + questionDegrees(paragraph.question)
        + writtenDegrees(paragraph.qwrites),
      0,
    );
}

function isExercise(value: unknown): value is Exercise {
  if (!value || typeof value !== "object") {
    return false;
  }
  const exercise = value as Record<string, unknown>;
  return typeof exercise.id === "number"
    && typeof exercise.classname === "string"
    && typeof exercise.type === "string"
    && typeof exercise.subjectid === "number";
}

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") {
    return false;
  }
  const subject = value as Record<string, unknown>;
  return typeof subject.id === "number" && typeof subject.subjectName === "string";
}

function isSolvedExercise(value: unknown): value is SolvedExercise {
  if (!value || typeof value !== "object") {
    return false;
  }
  const submission = value as Record<string, unknown>;
  return typeof submission.exerciseid === "number"
    && typeof submission.correctanswer === "number"
    && typeof submission.totalanswer === "number"
    && typeof submission.senddate === "string";
}

function isStudentDetails(value: unknown): value is StudentDetails {
  if (!isStudent(value)) {
    return false;
  }
  const details = value as Student & { solvedexercises?: unknown };
  return details.solvedexercises === null
    || (Array.isArray(details.solvedexercises) && details.solvedexercises.every(isSolvedExercise));
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

export default function ManageStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportingStudentId, setReportingStudentId] = useState<number | null>(null);
  const [degreeReport, setDegreeReport] = useState<StudentDegreeReport | null>(null);
  const [studentClassOptions, setStudentClassOptions] = useState<StudentClassOption[]>([]);
  const [changingClassStudentId, setChangingClassStudentId] = useState<number | null>(null);
  const [selectedStudentClassId, setSelectedStudentClassId] = useState("");
  const [isLoadingStudentClasses, setIsLoadingStudentClasses] = useState(false);
  const [isChangingStudentClass, setIsChangingStudentClass] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadStudents = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "manager") {
        router.replace("/login/manager");
        return;
      }

      try {
        const result = await requestApi("/students", token);
        if (!Array.isArray(result) || !result.every(isStudent)) {
          throw new Error("The student list returned an unexpected response.");
        }
        if (isActive) {
          setStudents(result);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load students.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadStudents();
    return () => {
      isActive = false;
    };
  }, [router]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [
        student.name,
        student.studentcode,
        student.studentclasses?.name ?? "",
        student.studentclass,
        student.group,
      ]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [searchTerm, students]);

  const handleDownloadReport = async (selectedStudent: Student) => {
    setError(null);
    setNotice(null);
    setDegreeReport(null);
    setReportingStudentId(selectedStudent.id);

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      setReportingStudentId(null);
      return;
    }

    try {
      const [rawDetails, rawExercises, rawSubjects] = await Promise.all([
        requestApi(`/students/${selectedStudent.id}`, token),
        requestApi("/exercise", token),
        requestApi("/subject", token),
      ]);
      if (!isStudentDetails(rawDetails)) {
        throw new Error(`Student details for ${selectedStudent.name} returned an unexpected response.`);
      }
      if (!Array.isArray(rawExercises) || !rawExercises.every(isExercise)) {
        throw new Error("The exercise list returned an unexpected response.");
      }
      if (!Array.isArray(rawSubjects) || !rawSubjects.every(isSubject)) {
        throw new Error("The subject list returned an unexpected response.");
      }
      const exercises = rawExercises as Exercise[];
        const subjects1 = rawSubjects as Subject[];
        const subjects = rawDetails.studentclasses?.teatcherstudents.map((ts) => ts.teacher.subjects) as Subject[];

      const student = rawDetails;
      const assignedExercises = exercises.filter((exercise) =>
        exercise.classname === student.studentclass
        && (
          !exercise.type.startsWith("Evaluation ")
          || exercise.type === `Evaluation ${student.group}`
        ),
      );
      const submissionsByExercise = new Map<number, SolvedExercise>();
      for (const submission of student.solvedexercises ?? []) {
        if (!assignedExercises.some((exercise) => exercise.id === submission.exerciseid)) {
          continue;
        }
        const previous = submissionsByExercise.get(submission.exerciseid);
        if (!previous || submission.senddate > previous.senddate) {
          submissionsByExercise.set(submission.exerciseid, submission);
        }
      }

      const exercisesBySubject = new Map<number, {
        subjectName: string;
        evaluations: DegreeTotals;
        classAssignments: DegreeTotals;
        homework: DegreeTotals;
        overall: DegreeTotals;
      }>();
      for (const subject of subjects) {
        exercisesBySubject.set(subject.id, {
          subjectName: subject.subjectName,
          evaluations: { earned: 0, possible: 0 },
          classAssignments: { earned: 0, possible: 0 },
          homework: { earned: 0, possible: 0 },
          overall: { earned: 0, possible: 0 },
        });
      }
      for (const exercise of assignedExercises) {
        const subject = exercisesBySubject.get(exercise.subjectid) ?? {
          subjectName: exercise.subjects?.subjectName || `Subject #${exercise.subjectid}`,
          evaluations: { earned: 0, possible: 0 },
          classAssignments: { earned: 0, possible: 0 },
          homework: { earned: 0, possible: 0 },
          overall: { earned: 0, possible: 0 },
        };
        const submission = submissionsByExercise.get(exercise.id);
        const possible = submission?.totalanswer ?? getExerciseDegrees(exercise);
        const points = submission?.correctanswer ?? 0;
        const category = exercise.type.startsWith("Evaluation ")
          ? subject.evaluations
          : exercise.type === "Class Assiment"
            ? subject.classAssignments
            : exercise.type === "Home Assiment"
              ? subject.homework
              : null;

        if (category) {
          category.earned += points;
          category.possible += possible;
        }
        subject.overall.earned += points;
        subject.overall.possible += possible;
        exercisesBySubject.set(exercise.subjectid, subject);
      }

      setDegreeReport({
        student: {
          name: student.name,
          studentcode: student.studentcode,
          studentclass: student.studentclass,
          group: student.group,
        },
        subjects: Array.from(exercisesBySubject.values())
          .map((subject) => ({
            name: subject.subjectName,
            evaluations: subject.evaluations,
            classAssignments: subject.classAssignments,
            homework: subject.homework,
            overall: subject.overall,
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      });
      setNotice(`Degree report is ready for ${student.name}.`);
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "Unable to create the student degree report.");
    } finally {
      setReportingStudentId(null);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingStudentId(null);
  };

  const handleEdit = (student: Student) => {
    setForm({
      name: student.name,
      studentcode: student.studentcode,
      password: student.password,
      studentclass: student.studentclass,
      group: student.group,
    });
    setEditingStudentId(student.id);
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

    const payload: Omit<StudentForm, "password"> & { password?: string,id:number | undefined } = {
      name: form.name.trim(),
      id: editingStudentId ?? undefined,
      studentcode: form.studentcode.trim(),
      studentclass: form.studentclass.trim(),
      group: form.group.trim(),
    };
    if (form.password) {
      payload.password = form.password;
    }

    let saved = false;
    try {
      await requestApi(
        editingStudentId === null ? "/students" : `/students/${editingStudentId}`,
        token,
        {
          method: editingStudentId === null ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      );
      saved = true;

      const result = await requestApi("/students/", token);
      if (!Array.isArray(result) || !result.every(isStudent)) {
        throw new Error("The student list returned an unexpected response.");
      }
      setStudents(result);
      setNotice(editingStudentId === null ? "Student added successfully." : "Student updated successfully.");
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save this student.";
      setError(saved ? `Student saved, but the list could not be refreshed: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingStudentId(student.id);

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      setDeletingStudentId(null);
      return;
    }

    try {
      await requestApi(`/students/${student.id}`, token, { method: "DELETE",body: JSON.stringify({ id: student.id,password: student.password }) });
      setStudents((currentStudents) => currentStudents.filter((current) => current.id !== student.id));
      if (editingStudentId === student.id) {
        resetForm();
      }
      setNotice("Student deleted successfully.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete this student.");
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleOpenClassSelector = async (student: Student) => {
    setError(null);
    setNotice(null);
    if (changingClassStudentId === student.id) {
      setChangingClassStudentId(null);
      setSelectedStudentClassId("");
      return;
    }

    setChangingClassStudentId(student.id);
    setSelectedStudentClassId(student.studentclasses?.id?.toString() ?? "");
    if (studentClassOptions.length > 0) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      setChangingClassStudentId(null);
      return;
    }

    setIsLoadingStudentClasses(true);
    try {
      const result = await requestApi("/studentclass", token);
      if (!Array.isArray(result) || !result.every(isStudentClassOption)) {
        throw new Error("The class list returned an unexpected response.");
      }
      setStudentClassOptions(result);
    } catch (classError) {
      setChangingClassStudentId(null);
      setError(classError instanceof Error ? classError.message : "Unable to load student classes.");
    } finally {
      setIsLoadingStudentClasses(false);
    }
  };

  const handleChangeStudentClass = async (student: Student) => {
    if (!selectedStudentClassId) {
      setError("Select a class before saving.");
      return;
    }

    const studentClassId = Number(selectedStudentClassId);
    if (!Number.isInteger(studentClassId)) {
      setError("The selected class is invalid.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return;
    }

    setError(null);
    setNotice(null);
    setIsChangingStudentClass(true);
    let classChanged = false;
    try {
      await requestApi("/students/addclass", token, {
        method: "POST",
        body: JSON.stringify({
          id: student.id,
          number: studentClassId,
          password: student.password,
        }),
      });
      classChanged = true;

      const result = await requestApi("/students", token);
      if (!Array.isArray(result) || !result.every(isStudent)) {
        throw new Error("The updated student list returned an unexpected response.");
      }
      setStudents(result);
      setChangingClassStudentId(null);
      setSelectedStudentClassId("");
      setNotice(`Class updated for ${student.name}.`);
    } catch (classError) {
      const message = classError instanceof Error
        ? classError.message
        : "Unable to change this student's class.";
      setError(classChanged ? `Class changed, but the student list could not be refreshed: ${message}` : message);
    } finally {
      setIsChangingStudentClass(false);
    }
  };

  const reportTotals = degreeReport?.subjects.reduce((totals, subject) => ({
    evaluations: {
      earned: totals.evaluations.earned + subject.evaluations.earned,
      possible: totals.evaluations.possible + subject.evaluations.possible,
    },
    classAssignments: {
      earned: totals.classAssignments.earned + subject.classAssignments.earned,
      possible: totals.classAssignments.possible + subject.classAssignments.possible,
    },
    homework: {
      earned: totals.homework.earned + subject.homework.earned,
      possible: totals.homework.possible + subject.homework.possible,
    },
    overall: {
      earned: totals.overall.earned + subject.overall.earned,
      possible: totals.overall.possible + subject.overall.possible,
    },
  }), {
    evaluations: { earned: 0, possible: 0 },
    classAssignments: { earned: 0, possible: 0 },
    homework: { earned: 0, possible: 0 },
    overall: { earned: 0, possible: 0 },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/manager" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              ← Manager portal
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Manage students</h1>
            <p className="mt-1 text-sm text-gray-600">Create student accounts and update or remove existing students.</p>
          </div>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700" role="status">
            {notice}
          </p>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingStudentId === null ? "Add a student" : "Edit student"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="student-name" className="text-sm font-medium text-gray-700">Full name</label>
              <input
                id="student-name"
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-code" className="text-sm font-medium text-gray-700">Student code</label>
              <input
                id="student-code"
                type="text"
                required
                readOnly={editingStudentId !== null}
                value={form.studentcode}
                onChange={(event) => setForm({ ...form, studentcode: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 read-only:bg-gray-50 read-only:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-password" className="text-sm font-medium text-gray-700">
                Password {editingStudentId !== null && <span className="font-normal text-gray-500">(leave blank to keep current)</span>}
              </label>
              <input
                id="student-password"
                type="text"
                required={editingStudentId === null}
                readOnly={editingStudentId !== null}
                autoComplete={editingStudentId === null ? "new-password" : "off"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 read-only:bg-gray-50 read-only:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-class" className="text-sm font-medium text-gray-700">Class</label>
              <select
                id="student-class"
                required
                value={form.studentclass}
                onChange={(event) => setForm({ ...form, studentclass: event.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>Select a class</option>
                <option value="secondary1">secondary1</option>
                <option value="secondary2">secondary2</option>
                <option value="secondary3">secondary3</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="student-group" className="text-sm font-medium text-gray-700">Group</label>
              <select
                id="student-group"
                required
                value={form.group}
                onChange={(event) => setForm({ ...form, group: event.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>Select a group</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving…" : editingStudentId === null ? "Add student" : "Save changes"}
              </button>
              {editingStudentId !== null && (
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

        {degreeReport && (
          <section
            id="student-degree-report"
            aria-labelledby="student-degree-report-title"
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="student-degree-report-title" className="text-xl font-bold text-gray-900">
                Student degree report
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Print report
                </button>
                <button
                  type="button"
                  onClick={() => setDegreeReport(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <table className="mb-6 w-full border-collapse text-left text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th scope="row" className="w-1/5 px-3 py-3 font-semibold text-gray-700">Student name</th>
                  <td className="px-3 py-3 text-gray-900">{degreeReport.student.name}</td>
                  <th scope="row" className="w-1/5 px-3 py-3 font-semibold text-gray-700">Student code</th>
                  <td className="px-3 py-3 text-gray-900">{degreeReport.student.studentcode}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th scope="row" className="px-3 py-3 font-semibold text-gray-700">Class</th>
                  <td className="px-3 py-3 text-gray-900">{degreeReport.student.studentclass}</td>
                  <th scope="row" className="px-3 py-3 font-semibold text-gray-700">Group</th>
                  <td className="px-3 py-3 text-gray-900">{degreeReport.student.group}</td>
                </tr>
              </tbody>
            </table>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50 text-xs uppercase text-gray-600">
                    <th scope="col" className="px-3 py-3 font-semibold">Subject</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Evaluations</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Class assignment</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Home assignment</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {degreeReport.subjects.map((subject) => {
                    const formatDegree = ({ earned, possible }: DegreeTotals) =>
                      `${earned}/${possible}${possible > 0 ? ` (${Math.round((earned / possible) * 100)}%)` : ""}`;
                    return (
                      <tr key={subject.name}>
                        <th scope="row" className="px-3 py-3 font-semibold text-gray-900">{subject.name}</th>
                        <td className="px-3 py-3 text-gray-700">{formatDegree(subject.evaluations)}</td>
                        <td className="px-3 py-3 text-gray-700">{formatDegree(subject.classAssignments)}</td>
                        <td className="px-3 py-3 text-gray-700">{formatDegree(subject.homework)}</td>
                        <td className="px-3 py-3 font-semibold text-gray-900">{formatDegree(subject.overall)}</td>
                      </tr>
                    );
                  })}
                  {reportTotals && (
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <th scope="row" className="px-3 py-3 font-bold text-gray-900">Total</th>
                      <td className="px-3 py-3 font-semibold text-gray-800">
                        {reportTotals.evaluations.earned}/{reportTotals.evaluations.possible}
                        {reportTotals.evaluations.possible > 0
                          && ` (${Math.round((reportTotals.evaluations.earned / reportTotals.evaluations.possible) * 100)}%)`}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800">
                        {reportTotals.classAssignments.earned}/{reportTotals.classAssignments.possible}
                        {reportTotals.classAssignments.possible > 0
                          && ` (${Math.round((reportTotals.classAssignments.earned / reportTotals.classAssignments.possible) * 100)}%)`}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800">
                        {reportTotals.homework.earned}/{reportTotals.homework.possible}
                        {reportTotals.homework.possible > 0
                          && ` (${Math.round((reportTotals.homework.earned / reportTotals.homework.possible) * 100)}%)`}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-900">
                        {reportTotals.overall.earned}/{reportTotals.overall.possible}
                        {reportTotals.overall.possible > 0
                          && ` (${Math.round((reportTotals.overall.earned / reportTotals.overall.possible) * 100)}%)`}
                      </td>
                    </tr>
                  )}
                  {degreeReport.subjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-600">
                        No subjects are available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Student list</h2>
              <p className="mt-1 text-sm text-gray-600">
                {filteredStudents.length} of {students.length} students
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <span className="sr-only">Search students</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                >
                  <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name, code, class, group"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
                />
              </label>
            </div>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-600">Loading students…</p>
          ) : students.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No students found.</p>
          ) : filteredStudents.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No students match your search.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Name</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Student code</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Password</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Student class name</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Stage</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Group</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-3 py-3 font-medium text-gray-900">{student.name}</td>
                      <td className="px-3 py-3 text-gray-600">{student.studentcode}</td>
                      <td className="px-3 py-3 font-mono text-gray-600">{student.password}</td>
                      <td className="px-3 py-3 text-gray-600">{student.studentclasses?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-gray-600">{student.studentclass}</td>
                      <td className="px-3 py-3 text-gray-600">{student.group}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDownloadReport(student)}
                            disabled={reportingStudentId !== null}
                            aria-label={`View degree report for ${student.name}`}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                              <path d="M10 2.75v9m0 0 3.25-3.25M10 11.75 6.75 8.5M3.5 13.25v3h13v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {reportingStudentId === student.id ? "Preparing…" : "Report"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(student)}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(student)}
                            disabled={deletingStudentId === student.id}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingStudentId === student.id ? "Deleting…" : "Delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleOpenClassSelector(student)}
                            disabled={isLoadingStudentClasses || isChangingStudentClass}
                            aria-expanded={changingClassStudentId === student.id}
                            className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Change class
                          </button>
                          </div>
                          {changingClassStudentId === student.id && (
                            <div className="flex items-center gap-2">
                              <label className="sr-only" htmlFor={`student-class-${student.id}`}>
                                New class for {student.name}
                              </label>
                              <select
                                id={`student-class-${student.id}`}
                                value={selectedStudentClassId}
                                onChange={(event) => setSelectedStudentClassId(event.target.value)}
                                disabled={isLoadingStudentClasses || isChangingStudentClass}
                                className="max-w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="" disabled>
                                  {isLoadingStudentClasses ? "Loading classes…" : "Select a class"}
                                </option>
                                {studentClassOptions.map((studentClass) => (
                                  <option key={studentClass.id} value={studentClass.id}>
                                    {studentClass.name} · {studentClass.stage}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => void handleChangeStudentClass(student)}
                                disabled={
                                  isLoadingStudentClasses
                                  || isChangingStudentClass
                                  || !selectedStudentClassId
                                  || selectedStudentClassId === student.studentclasses?.id?.toString()
                                }
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isChangingStudentClass ? "Saving…" : "Save class"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setChangingClassStudentId(null);
                                  setSelectedStudentClassId("");
                                }}
                                disabled={isChangingStudentClass}
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
