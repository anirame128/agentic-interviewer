'use client';

import { useRouter } from 'next/navigation';

export default function Feedback() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Interview Feedback</h1>
          <p className="text-gray-400">Your performance analysis and areas for improvement</p>
        </div>

        <div className="space-y-8">
          {/* Overall Performance */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Overall Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Strengths</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Clear problem understanding</li>
                  <li>• Good communication skills</li>
                  <li>• Efficient solution approach</li>
                </ul>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Areas for Improvement</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Consider edge cases more thoroughly</li>
                  <li>• Optimize time complexity</li>
                  <li>• Practice more coding problems</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Technical Skills</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Problem Solving</h3>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Algorithm Knowledge</h3>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Code Quality</h3>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Practice Problems</h3>
                  <p className="text-gray-400">Focus on dynamic programming and graph algorithms</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Study Materials</h3>
                  <p className="text-gray-400">Review system design concepts and database optimization</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-500 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Start New Interview
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 rounded-xl text-white font-medium bg-gray-600 hover:bg-gray-500 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Print Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 