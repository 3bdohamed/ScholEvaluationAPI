'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface Subject {
  subjectName: string;
}

interface Teacher {
  firstname: string;
  lastname: string;
  subjects: Subject;
}

interface TeacherStudent {
  teacher: Teacher;
}

interface StudentClasses {
  name: string;
  teatcherstudents: TeacherStudent[];
}

interface Exercise {
  subjects: Subject;
  evaluationNum: number;
}

interface SolvedExercise {
  id: number;
  type: string;
  senddate: string;
  iscorrected: boolean;
  correctanswer: number;
  totalanswer: number;
  exercise: Exercise;
}

interface Student {
  id: number;
  authority: number | string;
  name: string;
  studentcode: string;
  studentclass: string;
  studentclasses: StudentClasses;
  group: string;
  solvedexercises: SolvedExercise[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Student | null>(null);
  useEffect(() => {
    const checkToken = async () => {
      console.log("Checking token in localStorage...");
      if (localStorage.getItem("token") == null) {
        router.push("/login");
      } else {
        const response = await fetch(apiUrl("/students/0"), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
        const result = await response.json();
        setData(result);
        console.log(result)
        if (!response.ok) {

          localStorage.removeItem("token");
          localStorage.removeItem("expiration");
          router.push("/login");
          throw new Error(result.message || 'Failed to fetch student data.');
        }
      }
    }
    checkToken();

  }
    , [])
  const collectdegree = function (a: SolvedExercise[]) {
    let totaldegree = 0;
    let correctdegree = 0;
    a.forEach(b => { correctdegree += b.correctanswer; totaldegree += b.totalanswer })
    if (a.length === 0)
      return "0/100"
    return  Math.round( correctdegree / (totaldegree == 0 ? 0 : totaldegree) * 100) + "/100"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {data?.name}</h1>
            <p className="text-sm text-gray-500">Student Code: {data?.studentcode}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm">
              Overall GPA: {data?.studentclass} -- {data?.studentclasses?.name} -- group {data?.group}
            </div>
            {data && Number(data.authority) > 0 && (
              <Link
                href="/student/takeexercise"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Take exercise
              </Link>
            )}
          </div>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Subjects & Degrees */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              <Link
                href="/student/degrees"
                className="rounded-sm transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                Subjects & Degrees
                <span className="ml-2 text-sm font-medium text-blue-600">View all →</span>
              </Link>
            </h2>
            <div className="space-y-3">
              {data?.studentclasses?.teatcherstudents?.map((sub, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">

                  <span className="font-medium text-gray-700 w-1/3">{sub.teacher.firstname + " " + sub.teacher.lastname}</span>
                  <span className="text-blue-600 font-bold w-1/3 text-center">{sub.teacher.subjects.subjectName}</span>
                  <div className="w-1/3  text-right">
                    <span className="text-xs bg-blue-100 text-blue-700  px-2 py-0.5 rounded font-semibold">Averag:{collectdegree(data.solvedexercises.filter(e => e.exercise.subjects.subjectName == sub.teacher.subjects.subjectName))} </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Week Evaluations */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <Link
                href="/student/evaluations"
                className="rounded-sm transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                Week Evaluations
                <span className="ml-2 text-sm font-medium text-blue-600">View all →</span>
              </Link>
            </h2>
            <div className="space-y-3">
              {data?.solvedexercises?.filter(e=>e.type=="Evaluation "+data.group).reverse().slice(0,5).map((evalItem, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm font-semibold text-gray-800">
                    <span>{evalItem.exercise?.subjects?.subjectName} <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-semibold">Ev-{ evalItem.exercise.evaluationNum } </span> </span>
                    <span className="text-blue-600 font-bold">DGR - {evalItem.correctanswer / evalItem.totalanswer < 0.5 ? <span className="text-red-600">{evalItem.correctanswer}/{evalItem.totalanswer}</span> : <span className="text-green-600">{evalItem.correctanswer}/{evalItem.totalanswer}</span>}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-gray-800">
                  <p className="text-xs text-gray-600">"{evalItem.senddate}"</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${evalItem.iscorrected == true ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {evalItem.iscorrected == true?"corrected":"not corrected"}
                  </span>
                </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Assignments */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <Link
                href="/student/exercises?type=assignment"
                className="rounded-sm transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                Class Assignments
                <span className="ml-2 text-sm font-medium text-blue-600">View all →</span>
              </Link>
            </h2>
            <div className="space-y-3">
              {data?.solvedexercises?.filter(e=>e.type=="Class Assiment").reverse().slice(0,5).map((asm, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className=" text-gray-800 font-semibold ">{asm.exercise?.subjects?.subjectName}</p>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-semibold">ASM-{asm.exercise.evaluationNum}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{asm.senddate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 font-bold block">DGR - {asm.correctanswer / asm.totalanswer < 0.5 ? <span className="text-red-600">{asm.correctanswer}/{asm.totalanswer}</span> : <span className="text-green-600">{asm.correctanswer}/{asm.totalanswer}</span>}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${asm.iscorrected == true ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {asm.iscorrected == true?"corrected":"not corrected"}
                  </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Homework & Subjects */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <Link
                href="/student/exercises?type=homework"
                className="rounded-sm transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                Homework & Subjects
                <span className="ml-2 text-sm font-medium text-blue-600">View all →</span>
              </Link>
            </h2>
            <div className="space-y-3">
              {data?.solvedexercises?.filter(e=>e.type=="Home Assiment").reverse().slice(0,5).map((hw) => (
                <div key={hw.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className=" text-gray-800 font-semibold ">{hw.exercise?.subjects?.subjectName}</p>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-semibold">HW-{hw.exercise.evaluationNum}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{hw.senddate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 font-bold block">DGR - {hw.correctanswer / hw.totalanswer < 0.5 ? <span className="text-red-600">{hw.correctanswer}/{hw.totalanswer}</span> : <span className="text-green-600">{hw.correctanswer}/{hw.totalanswer}</span>}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hw.iscorrected == true ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {hw.iscorrected == true?"corrected":"not corrected"}
                  </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}