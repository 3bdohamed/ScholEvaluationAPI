export default function AboutPage() {
  return (
    <div className="flex flex-col items-center py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header / Intro */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
            About Us
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Empowering Educational Excellence
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            School Evaluation is designed to help educational institutions measure performance, foster continuous growth, and elevate academic standards with clarity and precision.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid md:grid-cols-2 gap-8 pt-6">
          <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To provide a seamless, data-driven evaluation platform that empowers administrators and educators to identify strengths, target areas for improvement, and deliver exceptional learning experiences.
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
              🚀
            </div>
            <h2 className="text-xl font-bold text-gray-900">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To become the leading digital standard for institutional assessment, cultivating environments where transparency, collaboration, and high academic performance thrive.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Integrity</h3>
              <p className="text-sm text-gray-600">Uncompromising commitment to honest, objective, and unbiased evaluation metrics.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Collaboration</h3>
              <p className="text-sm text-gray-600">Bridging departments and stakeholders together to work towards shared goals.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Innovation</h3>
              <p className="text-sm text-gray-600">Continuously modernizing how academic data is analyzed and utilized.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
