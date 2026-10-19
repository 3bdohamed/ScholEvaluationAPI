'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface Evaluation {
  id: number;
  type: string;
  senddate: string;
  iscorrected: boolean;
  correctanswer: number;
  totalanswer: number;
  exercise: {
    subjects: {
      subjectName: string;
    };
    evaluationNum: number;
  };
}

interface StudentEvaluations {
  group: string;
  solvedexercises: Evaluation[];
}

export default function StudentEvaluationsPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentEvaluations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadEvaluations = async () => {
      const token = localStorage.getItem("token");
      if (token === null) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(apiUrl("/students/0"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("expiration");
            router.push("/login");
            return;
          }
          throw new Error(`Unable to load evaluations (${response.status}).`);
        }

        const result: StudentEvaluations = await response.json();
        if (isActive) {
          setStudent(result);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load evaluations.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadEvaluations();
    return () => {
      isActive = false;
    };
  }, [router]);

  const evaluations = student?.solvedexercises
    .filter((evaluation) => evaluation.type === `Evaluation ${student.group}`)
    .slice()
    .reverse() ?? [];
  const totalCorrect = evaluations.reduce((total, evaluation) => total + evaluation.correctanswer, 0);
  const totalPossible = evaluations.reduce((total, evaluation) => total + evaluation.totalanswer, 0);
  const overallPercentage = totalPossible === 0 ? 0 : Math.round((totalCorrect / totalPossible) * 100);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/student" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-800">All Week Evaluations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Detailed results for every evaluation in your group.
            </p>
          </div>
          {!isLoading && !error && (
            <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Overall evaluation score</p>
              <p className="text-xl font-bold text-blue-700">
                {totalCorrect}/{totalPossible} <span className="text-sm font-semibold">({overallPercentage}%)</span>
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading evaluations…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : evaluations.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No evaluations are available yet.
          </p>
        ) : (
          <section aria-label="Evaluation results" className="space-y-4">
            {evaluations.map((evaluation, index) => {
              const percentage = evaluation.totalanswer === 0
                ? 0
                : Math.round((evaluation.correctanswer / evaluation.totalanswer) * 100);

              return (
                <article
                  key={evaluation.id ?? `${evaluation.exercise.evaluationNum}-${evaluation.senddate}-${index}`}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {evaluation.exercise.subjects.subjectName}
                        </h2>
                        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700">
                          Evaluation {evaluation.exercise.evaluationNum}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Submitted: {evaluation.senddate}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        evaluation.iscorrected
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {evaluation.iscorrected ? "Corrected" : "Not corrected"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Score</p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {evaluation.correctanswer} / {evaluation.totalanswer}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Percentage</p>
                      <p className="mt-1 font-semibold text-gray-800">{percentage}%</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 p-3 sm:col-span-1">
                      <p className="text-xs text-gray-500">Group</p>
                      <p className="mt-1 font-semibold text-gray-800">{student?.group}</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 p-3 sm:col-span-1">
                      <p className="text-xs text-gray-500">Show the answers</p>
                      <Link
                        href={`/student/evaluations/answers?id=${evaluation.id}`}
                        className="mt-1 inline-flex rounded font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        View answers
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
