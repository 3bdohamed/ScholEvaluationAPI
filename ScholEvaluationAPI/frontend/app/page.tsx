import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 px-6 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 text-center border-b border-gray-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
            Streamline Academic Quality
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Modern School Evaluation & Performance Tracking
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Empower educators, administrators, and stakeholders with comprehensive tools to evaluate, analyze, and elevate institutional performance.
          </p>
          <div className="flex justify-center space-x-4 pt-4">
            <Link
              href="/login"
              className="px-28 text-2xl py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          Why Choose Our Platform?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Comprehensive Metrics</h3>
            <p className="text-gray-600 text-sm">
              Evaluate multiple facets of your institution with structured, standard-compliant criteria.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Insights</h3>
            <p className="text-gray-600 text-sm">
              Generate instant summary reports to track progress and spot areas for development quickly.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Collaborative Workflow</h3>
            <p className="text-gray-600 text-sm">
              Enable team collaboration across departments to ensure transparent and accurate reviews.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
