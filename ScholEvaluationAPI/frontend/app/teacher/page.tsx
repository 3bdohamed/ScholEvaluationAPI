'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface TeacherSubject {
  subjectName: string;
}

interface ClassStudent {
  id: number;
  name: string;
  studentcode: string;
  studentclass: string;
  group: string;
}

interface StudentClass {
  id: number;
  name: string;
  stage: string;
  students: ClassStudent[] | null;
}

interface TeacherClass {
  id: number;
  studentclassid: number;
  classname: string;
  studentclasses: StudentClass | null;
}

interface Exercise {
  id: number;
  classname: string;
  subjectid: number;
  subjects?: TeacherSubject;
  evaluationNum: string | number;
  type: string;
}

interface Teacher {
  id: number;
  firstname: string;
  lastname: string;
  teatchercode: string;
  subjectid: number;
  subjectname: string | null;
  subjects: TeacherSubject | null;
  goverment: string;
  schoolname: string;
  teatcherstudents: TeacherClass[] | null;
}

interface BulkOpenResponse {
  updatedCount?: number;
  updatedIds?: number[];
  skipped?: { id: number; reason: string }[];
  notFoundIds?: number[];
}

function getOpenExerciseApiResult(responseBody: string) {
  let message: string | null = null;
  let indicatesFailure = false;

  if (!responseBody) {
    return { message, indicatesFailure };
  }

  try {
    const data: unknown = JSON.parse(responseBody);
    if (typeof data === "string") {
      message = data;
      indicatesFailure = /solv|already|before|error|fail|cannot|unable|invalid/i.test(data);
      return { message, indicatesFailure };
    }

    if (data && typeof data === "object") {
      const details = data as Record<string, unknown>;
      const responseMessage = details.message ?? details.title ?? details.detail ?? details.error;
      if (typeof responseMessage === "string") {
        message = responseMessage;
      } else if (Array.isArray(details.errors)) {
        message = details.errors
          .filter((error): error is string => typeof error === "string")
          .join(" ");
      }

      const status = details.status;
      const statusCode = details.statusCode;
      indicatesFailure = details.success === false
        || details.isSuccess === false
        || details.isError === true
        || details.hasError === true
        || details.ok === false
        || (typeof status === "string" && /error|fail/i.test(status))
        || (typeof statusCode === "number" && statusCode >= 400)
        || Boolean(details.error)
        || (Array.isArray(details.errors) && details.errors.length > 0)
        || (message !== null && /solv|already|before|error|fail|cannot|unable|invalid/i.test(message));

      return { message, indicatesFailure };
    }
  } catch {
    message = responseBody;
    indicatesFailure = /solv|already|before|error|fail|cannot|unable|invalid/i.test(responseBody);
    return { message, indicatesFailure };
  }

  return { message, indicatesFailure };
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Record<number, boolean>>({});
  const [openStatuses, setOpenStatuses] = useState<Record<number, { message: string; isError: boolean }>>({});
  const [assignmentSummary, setAssignmentSummary] = useState<string | null>(null);
  const [isOpeningExercise, setIsOpeningExercise] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadTeacher = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "teacher") {
        router.replace("/login/teacher");
        return;
      }

      let teacherLoaded = false;
      try {
        const response = await fetch(apiUrl("/teacher/0"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("expiration");
          localStorage.removeItem("userType");
          window.dispatchEvent(new Event("auth-change"));
          router.replace("/login/teacher");
          return;
        }
        if (!response.ok) {
          throw new Error(`Unable to load teacher details (${response.status}).`);
        }

        const result: Teacher = await response.json();
        if (isActive) {
          setTeacher(result);
        }
        teacherLoaded = true;

        const exercisesResponse = await fetch(apiUrl("/exercise"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (exercisesResponse.status === 401 || exercisesResponse.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("expiration");
          localStorage.removeItem("userType");
          window.dispatchEvent(new Event("auth-change"));
          router.replace("/login/teacher");
          return;
        }
        if (!exercisesResponse.ok) {
          if (isActive) {
            setExerciseError(`Unable to load exercises (${exercisesResponse.status}).`);
          }
          return;
        }

        const exerciseList: Exercise[] = await exercisesResponse.json();
        if (isActive) {
          setExercises(exerciseList);
        }
      } catch (loadError) {
        if (isActive) {
          const message = loadError instanceof Error ? loadError.message : "Unable to load teacher details.";
          if (teacherLoaded) {
            setExerciseError(message);
          } else {
            setError(message);
          }
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTeacher();
    return () => {
      isActive = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userType");
    window.dispatchEvent(new Event("auth-change"));
    router.replace("/login/teacher");
  };

  const classGroups = teacher?.teatcherstudents ?? [];
  const students = classGroups.flatMap((classGroup) => classGroup.studentclasses?.students ?? []);
  const subjectName = teacher?.subjectname
    ?? teacher?.subjects?.subjectName
    ?? (teacher ? `Subject #${teacher.subjectid}` : "Not assigned");

  const selectedExercise = exercises.find((exercise) => exercise.id === Number(selectedExerciseId)) ?? null;
  const isStudentEligible = (student: ClassStudent) => Boolean(
    selectedExercise
    && selectedExercise.classname === student.studentclass
    && selectedExercise.subjectid === teacher?.subjectid
    && (
      !selectedExercise.type.startsWith("Evaluation ")
      || selectedExercise.type === `Evaluation ${student.group}`
    ),
  );
  const eligibleStudents = students.filter(isStudentEligible);
  const selectedStudentCount = students.filter((student) => selectedStudents[student.id]).length;
  const allEligibleStudentsSelected = eligibleStudents.length > 0
    && eligibleStudents.every((student) => selectedStudents[student.id]);
  const teacherExercises = exercises
    .filter((exercise) =>
      exercise.subjectid === teacher?.subjectid
      && classGroups.some((classGroup) =>
        classGroup.classname === exercise.classname
        || classGroup.studentclasses?.students?.some((student) => student.studentclass === exercise.classname),
      ),
    )
    .sort((left, right) =>
      left.classname.localeCompare(right.classname)
      || left.type.localeCompare(right.type)
      || String(left.evaluationNum).localeCompare(String(right.evaluationNum), undefined, { numeric: true })
      || left.id - right.id,
    );

  const handleOpenSelectedExercise = async () => {
    const exerciseId = Number(selectedExerciseId);
    const targetStudents = students.filter(
      (student) => selectedStudents[student.id] && isStudentEligible(student),
    );
    if (!Number.isInteger(exerciseId) || exerciseId < 1 || targetStudents.length === 0) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login/teacher");
      return;
    }

    setIsOpeningExercise(true);
    setAssignmentSummary(null);
    try {
      const response = await fetch(apiUrl("/teacher/open/many"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          ids: targetStudents.map((student) => student.id),
          number: exerciseId,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("expiration");
        localStorage.removeItem("userType");
        window.dispatchEvent(new Event("auth-change"));
        router.replace("/login/teacher");
        return;
      }

      const responseBody = await response.text();
      let bulkResult: BulkOpenResponse | null = null;
      try {
        const parsedResponse: unknown = JSON.parse(responseBody);
        if (parsedResponse && typeof parsedResponse === "object") {
          bulkResult = parsedResponse as BulkOpenResponse;
        }
      } catch {
        bulkResult = null;
      }
      const { message: apiMessage, indicatesFailure: apiIndicatesFailure } =
        getOpenExerciseApiResult(responseBody);
      const normalizedMessage = apiMessage?.toLowerCase() ?? "";
      const messageDescribesDuplicate = normalizedMessage.includes("solv")
        || normalizedMessage.includes("already")
        || normalizedMessage.includes("before");

      if (!response.ok || apiIndicatesFailure || messageDescribesDuplicate) {
        const failureMessage = messageDescribesDuplicate
          ? apiMessage ?? "One or more selected students have already solved this exercise."
          : apiMessage ?? `Unable to open this exercise for the selected students (${response.status}).`;
        setOpenStatuses((current) => ({
          ...current,
          ...Object.fromEntries(targetStudents.map((student) => [
            student.id,
            { message: failureMessage, isError: true },
          ])),
        }));
        return;
      }

      const updatedIds = new Set(bulkResult?.updatedIds ?? []);
      const skippedById = new Map((bulkResult?.skipped ?? []).map((item) => [item.id, item.reason]));
      const notFoundIds = new Set(bulkResult?.notFoundIds ?? []);
      const hasPerStudentResult = bulkResult !== null
        && (Array.isArray(bulkResult.updatedIds)
          || Array.isArray(bulkResult.skipped)
          || Array.isArray(bulkResult.notFoundIds));

      if (hasPerStudentResult) {
        setOpenStatuses((current) => ({
          ...current,
          ...Object.fromEntries(targetStudents.map((student) => {
            if (updatedIds.has(student.id)) {
              return [
                student.id,
                { message: "Exercise is now available to this student.", isError: false },
              ];
            }

            const skipReason = skippedById.get(student.id);
            if (skipReason) {
              const alreadySolved = skipReason.toLowerCase().includes("solv");
              return [
                student.id,
                {
                  message: alreadySolved
                    ? "This student has already solved this exercise."
                    : `Exercise skipped: ${skipReason}.`,
                  isError: true,
                },
              ];
            }

            if (notFoundIds.has(student.id)) {
              return [
                student.id,
                { message: "Student was not found by the API.", isError: true },
              ];
            }

            return [
              student.id,
              { message: "The API did not return an assignment result for this student.", isError: true },
            ];
          })),
        }));

        const updatedCount = bulkResult?.updatedCount ?? updatedIds.size;
        const skippedCount = bulkResult?.skipped?.length ?? 0;
        const notFoundCount = bulkResult?.notFoundIds?.length ?? 0;
        setAssignmentSummary(
          `Available to ${updatedCount} student${updatedCount === 1 ? "" : "s"}; `
          + `${skippedCount} skipped; ${notFoundCount} not found.`,
        );
        return;
      }

      setOpenStatuses((current) => ({
        ...current,
        ...Object.fromEntries(targetStudents.map((student) => [
          student.id,
          { message: "Exercise is now available to this student.", isError: false },
        ])),
      }));
    } catch (openError) {
      const failureMessage = openError instanceof Error
        ? openError.message
        : "Unable to open this exercise for the selected students.";
      setOpenStatuses((current) => ({
        ...current,
        ...Object.fromEntries(targetStudents.map((student) => [
          student.id,
          { message: failureMessage, isError: true },
        ])),
      }));
    } finally {
      setIsOpeningExercise(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Teacher portal</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {teacher ? `Welcome, ${teacher.firstname} ${teacher.lastname}` : "Teacher details"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your profile, assigned classes, and students.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Sign out
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Review student work</h2>
            <p className="mt-1 text-sm text-gray-600">Grade submissions that have not been corrected yet.</p>
          </div>
          <Link
            href="/teacher/corrections"
            className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Correct exercises
          </Link>
        </section>

        <section className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Student statistics</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review scores and exercise progress for students in your subject.
            </p>
          </div>
          <Link
            href="/teacher/statistics"
            className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View statistics
          </Link>
        </section>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading teacher detailsâ€¦
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : teacher ? (
          <>
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Teacher profile</h2>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Full name</dt>
                  <dd className="mt-1 font-semibold text-gray-800">
                    {teacher.firstname} {teacher.lastname}
                  </dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Teacher code</dt>
                  <dd className="mt-1 font-semibold text-gray-800">{teacher.teatchercode}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Teacher ID</dt>
                  <dd className="mt-1 font-semibold text-gray-800">{teacher.id}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Subject</dt>
                  <dd className="mt-1 font-semibold text-gray-800">{subjectName}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Subject ID</dt>
                  <dd className="mt-1 font-semibold text-gray-800">{teacher.subjectid}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">School</dt>
                  <dd className="mt-1 font-semibold text-gray-800">{teacher.schoolname || "Not provided"}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Government</dt>
                  <dd className="mt-1 font-semibold text-gray-800">{teacher.goverment || "Not provided"}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-sm text-gray-500">Assigned classes / students</dt>
                  <dd className="mt-1 font-semibold text-gray-800">
                    {classGroups.length} / {students.length}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assign an exercise</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Choose an exercise, select one or more eligible students, then make it available to them.
                </p>
              </div>
              {exerciseError ? (
                <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">
                  {exerciseError}
                </p>
              ) : teacherExercises.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  No exercises are available for your subject and assigned classes.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="exercise-to-assign" className="mb-1 block text-sm font-medium text-gray-700">
                      Exercise
                    </label>
                    <select
                      id="exercise-to-assign"
                      value={selectedExerciseId}
                      onChange={(event) => {
                        setSelectedExerciseId(event.target.value);
                        setSelectedStudents({});
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Choose an exercise</option>
                      {teacherExercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.subjects?.subjectName ?? subjectName} · {exercise.classname} · {exercise.type} {exercise.evaluationNum} · #{exercise.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!selectedExercise || eligibleStudents.length === 0}
                    onClick={() => setSelectedStudents(Object.fromEntries(
                      eligibleStudents.map((student) => [student.id, !allEligibleStudentsSelected]),
                    ))}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {allEligibleStudentsSelected ? "Clear eligible selection" : "Select all eligible"}
                  </button>
                  <button
                    type="button"
                    disabled={isOpeningExercise || !selectedExercise || selectedStudentCount === 0}
                    onClick={() => void handleOpenSelectedExercise()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isOpeningExercise
                      ? "Making available…"
                      : `Make available to ${selectedStudentCount} student${selectedStudentCount === 1 ? "" : "s"}`}
                  </button>
                </div>
              )}
              {selectedExercise && (
                <p className="text-sm text-gray-600" role="status">
                  {eligibleStudents.length} eligible student{eligibleStudents.length === 1 ? "" : "s"} for this exercise.
                </p>
              )}
              {assignmentSummary && (
                <p className="text-sm font-medium text-gray-700" role="status">
                  {assignmentSummary}
                </p>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assigned classes & students</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Students are grouped by the classes assigned to your account.
                </p>
              </div>
              {classGroups.length === 0 ? (
                <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
                  No classes are assigned to your account yet.
                </p>
              ) : classGroups.map((classGroup) => {
                const studentClass = classGroup.studentclasses;
                const classStudents = studentClass?.students ?? [];

                return (
                  <article key={classGroup.id} className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {studentClass?.name ?? classGroup.classname}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {studentClass?.stage ?? "Stage not provided"}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        {classStudents.length} {classStudents.length === 1 ? "student" : "students"}
                      </span>
                    </div>

                    {classStudents.length === 0 ? (
                      <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                        No students are listed in this class.
                      </p>
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[52rem] text-left text-sm">
                          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                            <tr>
                              <th scope="col" className="px-3 py-3 font-medium">
                                <input
                                  type="checkbox"
                                  aria-label={`Select eligible students in ${studentClass?.name ?? classGroup.classname}`}
                                  checked={classStudents.filter(isStudentEligible).length > 0
                                    && classStudents.filter(isStudentEligible).every((student) => selectedStudents[student.id])}
                                  disabled={!selectedExercise || !classStudents.some(isStudentEligible)}
                                  onChange={(event) => {
                                    const eligibleInClass = classStudents.filter(isStudentEligible);
                                    setSelectedStudents((current) => ({
                                      ...current,
                                      ...Object.fromEntries(eligibleInClass.map((student) => [
                                        student.id,
                                        event.target.checked,
                                      ])),
                                    }));
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                                />
                              </th>
                              <th scope="col" className="px-3 py-3 font-medium">Student</th>
                              <th scope="col" className="px-3 py-3 font-medium">Student code</th>
                              <th scope="col" className="px-3 py-3 font-medium">Class</th>
                              <th scope="col" className="px-3 py-3 font-medium">Group</th>
                              <th scope="col" className="px-3 py-3 font-medium">Assignment status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {classStudents.map((student) => {
                              const canAssign = isStudentEligible(student);
                              const status = openStatuses[student.id];

                              return (
                                <tr key={student.id} className="text-gray-700">
                                  <td className="px-3 py-3">
                                    <input
                                      type="checkbox"
                                      aria-label={`Select ${student.name}`}
                                      checked={Boolean(selectedStudents[student.id])}
                                      disabled={!canAssign || isOpeningExercise}
                                      onChange={(event) => setSelectedStudents((current) => ({
                                        ...current,
                                        [student.id]: event.target.checked,
                                      }))}
                                      className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                                    />
                                  </td>
                                  <td className="px-3 py-3 font-medium text-gray-900">{student.name}</td>
                                  <td className="px-3 py-3">{student.studentcode}</td>
                                  <td className="px-3 py-3">{student.studentclass}</td>
                                  <td className="px-3 py-3">{student.group}</td>
                                  <td className="px-3 py-3">
                                    <div className="min-w-64">
                                      {!canAssign ? (
                                        <span className="text-xs text-gray-500">
                                          {selectedExercise ? "Not eligible for this exercise" : "Choose an exercise first"}
                                        </span>
                                      ) : !status ? (
                                        <span className="text-xs text-gray-500">Not assigned yet</span>
                                      ) : (
                                        <p
                                          className={`text-xs ${status.isError ? "text-red-700" : "text-green-700"}`}
                                          role={status.isError ? "alert" : "status"}
                                        >
                                          {status.message}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
