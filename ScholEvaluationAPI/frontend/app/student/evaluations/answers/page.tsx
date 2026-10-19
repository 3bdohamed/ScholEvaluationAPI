'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface EvaluationQuestion {
  id: number;
  ask: string | null;
  answer: string | null;
  choiced: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  isCorrect: boolean | null;
}

interface WrittenAnswer {
  id: number;
  ask: string | null;
  answer: string | null;
  answerexample: string | null;
  correctdegree: number | null;
  totaldegree: number | null;
  title: string | null;
  qwrite: {
    ask: string | null;
    title: string | null;
  } | null;
}

interface EvaluationParagraph {
  id: number;
  title: string | null;
  paragraphbody: string | null;
  correctdegree: number | null;
  totaldegree: number | null;
  solvedquestion: EvaluationQuestion[] | null;
  sqwrites: WrittenAnswer[] | null;
}

interface Evaluation {
  id: number;
  type: string;
  senddate: string;
  iscorrected: boolean;
  correctanswer: number;
  totalanswer: number;
  paragraphs: EvaluationParagraph[] | null;
  question: EvaluationQuestion[] | null;
  sqwrites: WrittenAnswer[] | null;
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

type AnswerCategory = "evaluation" | "assignment" | "homework";

export default function EvaluationAnswersPage() {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [category, setCategory] = useState<AnswerCategory>("evaluation");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAnswers = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const evaluationId = searchParams.get("id");
      const requestedCategory = searchParams.get("type") ?? "evaluation";
      if (
        requestedCategory !== "evaluation"
        && requestedCategory !== "assignment"
        && requestedCategory !== "homework"
      ) {
        setError("This answer link has an invalid submission type.");
        setIsLoading(false);
        return;
      }
      setCategory(requestedCategory);

      if (evaluationId === null || !/^\d+$/.test(evaluationId)) {
        setError("This answer link is missing a valid submission ID.");
        setIsLoading(false);
        return;
      }

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
          throw new Error(`Unable to load answers (${response.status}).`);
        }

        const student: StudentEvaluations = await response.json();
        const expectedType = requestedCategory === "evaluation"
          ? `Evaluation ${student.group}`
          : requestedCategory === "assignment"
            ? "Class Assiment"
            : "Home Assiment";
        const selectedEvaluation = student.solvedexercises.find(
          (item) => item.id === Number(evaluationId)
            && item.type === expectedType,
        );

        if (!selectedEvaluation) {
          throw new Error("This submission could not be found.");
        }

        if (isActive) {
          setEvaluation(selectedEvaluation);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load answers.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadAnswers();
    return () => {
      isActive = false;
    };
  }, [router]);

  const paragraphs = evaluation?.paragraphs ?? [];
  const questions = evaluation?.question ?? [];
  const writtenAnswers = evaluation?.sqwrites ?? [];
  const hasAnswers = paragraphs.length > 0 || questions.length > 0 || writtenAnswers.length > 0;
  const submissionTitle = category === "assignment"
    ? "Class assignment"
    : category === "homework"
      ? "Homework"
      : "Evaluation";
  const backHref = category === "evaluation"
    ? "/student/evaluations"
    : `/student/exercises?type=${category}`;

  const renderQuestion = (question: EvaluationQuestion, index: number, keyPrefix: string) => {
    const options = [
      question.option1,
      question.option2,
      question.option3,
      question.option4,
    ].filter((option): option is string => Boolean(option));

    return (
      <article
        key={`${keyPrefix}-question-${question.id}`}
        className="rounded-xl bg-white p-5 shadow-sm"
      >
        <h3 className="font-semibold text-gray-800">
          Question {index + 1}{question.ask ? `: ${question.ask}` : ""}
        </h3>
        {options.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {options.map((option, optionIndex) => (
              <li
                key={`${question.id}-option-${optionIndex}`}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  (optionIndex + 1).toString() === question.answer
                    ? "border-green-200 bg-green-50 text-green-800"
                    : (optionIndex + 1).toString() === question.choiced
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-gray-100 bg-gray-50 text-gray-700"
                }`}
              >
                {option}
                {(optionIndex + 1).toString() === question.answer ? " · Correct answer" : ""}
                {(optionIndex + 1).toString() === question.choiced ? " · Your answer" : ""}
              </li>
            ))}
          </ul>
        )}
        <p className={`mt-3 text-sm font-semibold ${
          question.isCorrect === null
            ? "text-gray-600"
            : question.isCorrect
              ? "text-green-700"
              : "text-red-700"
        }`}>
          {question.isCorrect === null ? "Not graded" : question.isCorrect ? "Correct" : "Incorrect"}
        </p>
      </article>
    );
  };

  const renderWrittenAnswer = (writtenAnswer: WrittenAnswer, index: number, keyPrefix: string) => {
    const title = writtenAnswer.qwrite?.title ?? writtenAnswer.title;
    const ask = writtenAnswer.qwrite?.ask ?? writtenAnswer.ask;

    return (
      <article
        key={`${keyPrefix}-written-answer-${writtenAnswer.id}`}
        className="rounded-xl bg-white p-5 shadow-sm"
      >
        <h3 className="font-semibold text-gray-800">
          Written answer {index + 1}{title ? `: ${title}` : ""}
        </h3>
        {ask && <p className="mt-2 text-sm text-gray-600">{ask}</p>}
        {writtenAnswer.totaldegree !== null && writtenAnswer.correctdegree !== null && (
          <p className="mt-2 text-sm text-gray-600">
            Score: {writtenAnswer.correctdegree}/{writtenAnswer.totaldegree}
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Your answer</p>
            <p className="mt-1 font-medium text-gray-800">{writtenAnswer.answer || "No answer"}</p>
          </div>
          {writtenAnswer.answerexample && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-green-700">Example answer</p>
              <p className="mt-1 font-medium text-green-800">{writtenAnswer.answerexample}</p>
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href={backHref}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to {category === "evaluation" ? "evaluations" : category === "assignment" ? "assignments" : "homework"}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-800">{submissionTitle} answers</h1>
          {evaluation && (
            <p className="mt-1 text-sm text-gray-600">
              {evaluation.exercise.subjects.subjectName} · {submissionTitle} {evaluation.exercise.evaluationNum}
            </p>
          )}
        </div>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading answers…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : !hasAnswers ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No answer details are available for this submission.
          </p>
        ) : (
          <section aria-label="Answers" className="space-y-4">
            {paragraphs.map((paragraph, paragraphIndex) => {
              const paragraphQuestions = paragraph.solvedquestion ?? [];
              const paragraphWrittenAnswers = paragraph.sqwrites ?? [];

              return (
                <div key={`paragraph-${paragraph.id}`} className="space-y-3">
                  {(paragraph.title || paragraph.paragraphbody || paragraph.correctdegree !== null) && (
                    <article className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                      {paragraph.title && (
                        <h2 className="font-semibold text-gray-800 text-center">{paragraph.title}</h2>
                      )}
                      {paragraph.paragraphbody && (
                        <p className="mt-2 whitespace-pre-wrap text-gray-700">{paragraph.paragraphbody}</p>
                      )}
                      {paragraph.correctdegree !== null && paragraph.totaldegree !== null && (
                        <p className="mt-3 text-sm font-medium text-blue-800">
                          Paragraph score: {paragraph.correctdegree}/{paragraph.totaldegree} 
                        </p>
                      )}
                    </article>
                  )}
                  {paragraphQuestions.map((question, questionIndex) =>
                    renderQuestion(question, questionIndex, `paragraph-${paragraphIndex}`),
                  )}
                  {paragraphWrittenAnswers.map((writtenAnswer, answerIndex) =>
                    renderWrittenAnswer(writtenAnswer, answerIndex, `paragraph-${paragraphIndex}`),
                  )}
                </div>
              );
            })}
            {questions.map((question, index) => renderQuestion(question, index, "evaluation"))}
            {writtenAnswers.map((writtenAnswer, index) =>
              renderWrittenAnswer(writtenAnswer, index, "evaluation"),
            )}
          </section>
        )}
      </div>
    </main>
  );
}
