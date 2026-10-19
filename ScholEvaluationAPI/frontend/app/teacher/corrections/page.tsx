'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

interface SubmissionSummary {
  id: number;
  exerciseid: number;
  studentid: number;
  type: string;
  iscorrected: boolean | null;
  correctanswer: number;
  totalanswer: number;
  senddate: string;
}

interface SolvedQuestion {
  id: number;
  ask: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  answer: string | null;
  choiced: string | null;
  isCorrect: boolean;
  solvedExerciseId: number | null;
  solvedExercise: null;
  chooseId: number | null;
  choose: null;
}

interface SolvedWrittenAnswer {
  id: number;
  answer: string | null;
  ask: string | null;
  type: string | null;
  title: string | null;
  answerexample: string | null;
  totaldegree: number;
  correctdegree: number | null;
  qweiteid: number | null;
  qwrite: null;
  solvedexerciseid: number | null;
  solvedexercisee: null;
  sparagraphid: number | null;
  sparagraphh: null;
}

interface SolvedParagraph {
  id: number;
  title: string | null;
  paragraphbody: string | null;
  sqwrites: SolvedWrittenAnswer[] | null;
  paragraphid: number | null;
  paragraph: null;
  solvedquestion: SolvedQuestion[] | null;
  solvedexerciseid: number | null;
  solvedExercise: null;
  totaldegree: number;
  correctdegree: number;
}

interface SolvedExercise extends SubmissionSummary {
  exercise: null;
  question: SolvedQuestion[] | null;
  sqwrites: SolvedWrittenAnswer[] | null;
  paragraphs: SolvedParagraph[] | null;
  student: {
    id: number;
    name: string;
    studentcode: string;
  } | null;
}

interface WrittenGrade {
  correctdegree: number;
}

function getWrittenAnswers(submission: SolvedExercise) {
  return [
    ...(submission.sqwrites ?? []),
    ...(submission.paragraphs ?? []).flatMap((paragraph) => paragraph.sqwrites ?? []),
  ];
}

export default function TeacherCorrectionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SolvedExercise | null>(null);
  const [writtenGrades, setWrittenGrades] = useState<Record<number, WrittenGrade>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadSubmissions = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "teacher") {
        router.replace("/login/teacher");
        return;
      }

      try {
        const response = await fetch(apiUrl("/solvedexercise"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
          throw new Error(`Unable to load solved exercises (${response.status}).`);
        }

        const result: SubmissionSummary[] = await response.json();
        if (isActive) {
          setSubmissions(result.filter((submission) => submission.iscorrected !== true));
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load solved exercises.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadSubmissions();
    return () => {
      isActive = false;
    };
  }, [router]);

  const loadSubmissionDetails = async (submissionId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login/teacher");
      return;
    }

    setSelectedId(submissionId);
    setSelectedSubmission(null);
    setWrittenGrades({});
    setError(null);
    setSuccess(null);
    setIsLoadingDetails(true);

    try {
      const response = await fetch(apiUrl(`/solvedexercise/${submissionId}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        throw new Error(`Unable to load submission details (${response.status}).`);
      }

      const detail: SolvedExercise = await response.json();
      setSelectedSubmission(detail);
      setWrittenGrades(Object.fromEntries(
        getWrittenAnswers(detail).map((answer) => [
          answer.id,
          { correctdegree: answer.correctdegree ?? 0 },
        ]),
      ));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load submission details.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const allWrittenAnswers = selectedSubmission ? getWrittenAnswers(selectedSubmission) : [];
  const questionCount = (selectedSubmission?.question ?? []).length
    + (selectedSubmission?.paragraphs ?? []).reduce(
      (total, paragraph) => total + (paragraph.solvedquestion ?? []).length,
      0,
    );
  const writtenTotal = allWrittenAnswers.reduce((total, answer) => total + answer.totaldegree, 0);
  const writtenCorrect = allWrittenAnswers.reduce(
    (total, answer) => total + (writtenGrades[answer.id]?.correctdegree ?? 0),
    0,
  );
  const automaticCorrect = (selectedSubmission?.question ?? []).filter((question) => question.isCorrect).length
    + (selectedSubmission?.paragraphs ?? []).reduce(
      (total, paragraph) => total + (paragraph.solvedquestion ?? []).filter((question) => question.isCorrect).length,
      0,
    );
  const calculatedCorrect = automaticCorrect + writtenCorrect;
  const calculatedTotal = questionCount + writtenTotal;
  const questions = useMemo(() => selectedSubmission?.question ?? [], [selectedSubmission]);

  const saveCorrection = async () => {
    if (!selectedSubmission) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login/teacher");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const updateWrittenAnswers = (answers: SolvedWrittenAnswer[] | null) =>
      (answers ?? []).map((answer) => ({
        ...answer,
        correctdegree: writtenGrades[answer.id]?.correctdegree ?? 0,
        qwrite: null,
        solvedexercisee: null,
        sparagraphh: null,
      }));

    const correctedSubmission = {
      ...selectedSubmission,
      exercise: null,
      correctanswer: calculatedCorrect,
      totalanswer: calculatedTotal,
      iscorrected: true,
      student: null,
      question: (selectedSubmission.question ?? []).map((question) => ({
        ...question,
        solvedExercise: null,
        choose: null,
      })),
      sqwrites: updateWrittenAnswers(selectedSubmission.sqwrites),
      paragraphs: (selectedSubmission.paragraphs ?? []).map((paragraph) => ({
        ...paragraph,
        paragraph: null,
        solvedExercise: null,
        solvedquestion: (paragraph.solvedquestion ?? []).map((question) => ({
          ...question,
          solvedExercise: null,
          choose: null,
        })),
        sqwrites: updateWrittenAnswers(paragraph.sqwrites),
      })),
    };

    try {
      const response = await fetch(apiUrl("/solvedexercise"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(correctedSubmission),
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
        const body = await response.text();
        throw new Error(body || `Unable to save correction (${response.status}).`);
      }

      setSubmissions((current) => current.filter((submission) => submission.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setSelectedId(null);
      setSuccess("Correction saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save correction.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestion = (question: SolvedQuestion, index: number) => {
    const options = [question.option1, question.option2, question.option3, question.option4];

    return (
      <article key={question.id} className="rounded-lg bg-gray-50 p-4">
        <h4 className="font-semibold text-gray-800">
          Question {index + 1}{question.ask ? `: ${question.ask}` : ""}
        </h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map((option, optionIndex) => option !== null && (
            <li
              key={`${question.id}-${optionIndex}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                String(optionIndex + 1) === question.answer
                  ? "bg-green-100 font-medium text-green-800"
                  : String(optionIndex + 1) === question.choiced
                    ? "bg-red-100 text-red-800"
                    : "bg-white text-gray-700"
              }`}
            >
              {option}
              {String(optionIndex + 1) === question.answer ? " · Correct answer" : ""}
              {String(optionIndex + 1) === question.choiced ? " · Student answer" : ""}
            </li>
          ))}
        </ul>
        <p className={`mt-3 text-sm font-medium ${question.isCorrect ? "text-green-700" : "text-red-700"}`}>
          {question.isCorrect ? "Correct · 1 point" : "Incorrect · 0 points"}
        </p>
      </article>
    );
  };

  const renderWrittenAnswer = (answer: SolvedWrittenAnswer) => (
    <article key={answer.id} className="rounded-lg bg-gray-50 p-4">
      {answer.title && <h4 className="font-semibold text-gray-800">{answer.title}</h4>}
      {answer.ask && <p className="font-medium text-gray-800">{answer.ask}</p>}
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
        {answer.answer || "No written answer provided."}
      </p>
      {answer.answerexample && (
        <p className="mt-2 text-sm text-gray-500">Example answer: {answer.answerexample}</p>
      )}
      <label htmlFor={`grade-${answer.id}`} className="mt-3 flex items-center gap-2 text-sm text-gray-700">
        Points
        <input
          id={`grade-${answer.id}`}
          type="number"
          min={0}
          max={answer.totaldegree}
          step="0.5"
          required
          value={writtenGrades[answer.id]?.correctdegree ?? 0}
          onChange={(event) => {
            const value = Number(event.target.value);
            setWrittenGrades((current) => ({
              ...current,
              [answer.id]: {
                correctdegree: Number.isFinite(value)
                  ? Math.min(answer.totaldegree, Math.max(0, value))
                  : 0,
              },
            }));
          }}
          className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <span>/ {answer.totaldegree}</span>
      </label>
    </article>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <Link href="/teacher" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to teacher portal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Correct solved exercises</h1>
          <p className="mt-1 text-sm text-gray-600">
            Only submissions that have not been corrected are listed.
          </p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-700" role="status">
            {success}
          </p>
        )}

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading uncorrected submissions…
          </p>
        ) : submissions.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            There are no uncorrected submissions.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(18rem,1fr)_minmax(0,2fr)]">
            <section className="space-y-3" aria-label="Uncorrected submissions">
              <h2 className="font-semibold text-gray-900">Uncorrected submissions ({submissions.length})</h2>
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => void loadSubmissionDetails(submission.id)}
                  className={`w-full rounded-xl border p-4 text-left shadow-sm transition-colors ${
                    selectedId === submission.id
                      ? "border-blue-300 bg-blue-50"
                      : "border-transparent bg-white hover:border-gray-200"
                  }`}
                >
                  <span className="block font-semibold text-gray-900">
                    {submission.type} · Exercise #{submission.exerciseid}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    Student #{submission.studentid} · Submission #{submission.id}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Submitted: {submission.senddate}
                  </span>
                  <span className="mt-2 block text-xs font-medium text-amber-700">
                    Current score: {submission.correctanswer}/{submission.totalanswer}
                  </span>
                </button>
              ))}
            </section>

            <section className="space-y-4" aria-label="Submission correction">
              {isLoadingDetails ? (
                <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
                  Loading answers…
                </p>
              ) : !selectedSubmission ? (
                <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
                  Choose a submission to review its answers.
                </p>
              ) : (
                <>
                  <div className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Submission #{selectedSubmission.id}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Student #{selectedSubmission.studentid} · Exercise #{selectedSubmission.exerciseid}
                    </p>
                    <p className="mt-3 font-semibold text-blue-700">
                      Score: {calculatedCorrect}/{calculatedTotal}
                    </p>
                  </div>

                  {questions.length > 0 && (
                    <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
                      <h3 className="font-semibold text-gray-900">Multiple-choice answers</h3>
                      {questions.map(renderQuestion)}
                    </section>
                  )}

                  {(selectedSubmission.paragraphs ?? []).map((paragraph, index) => (
                    <section key={paragraph.id} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {paragraph.title ?? `Paragraph ${index + 1}`}
                        </h3>
                        {paragraph.paragraphbody && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                            {paragraph.paragraphbody}
                          </p>
                        )}
                      </div>
                      {(paragraph.solvedquestion ?? []).map((question, questionIndex) =>
                        renderQuestion(question, questionIndex))}
                      {(paragraph.sqwrites ?? []).map(renderWrittenAnswer)}
                    </section>
                  ))}

                  {(selectedSubmission.sqwrites ?? []).length > 0 && (
                    <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
                      <h3 className="font-semibold text-gray-900">Written answers</h3>
                      {(selectedSubmission.sqwrites ?? []).map(renderWrittenAnswer)}
                    </section>
                  )}

                  <button
                    type="button"
                    onClick={() => void saveCorrection()}
                    disabled={isSaving || isLoadingDetails}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving correction…" : "Save correction"}
                  </button>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
