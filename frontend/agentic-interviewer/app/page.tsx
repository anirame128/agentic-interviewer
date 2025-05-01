'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PageLayout from './components/PageLayout';

export default function Home() {
  const router = useRouter();
  // default 30 minutes
  const [minutes, setMinutes] = useState(30);

  const handleStart = () => {
    // navigate with ?timer=seconds so Interview page can read it
    router.push(`/interview?timer=${minutes * 60}`);
  };

  return (
    <PageLayout
      title="AI Mock Interview"
      subtitle="Practice your technical interview skills with an AI interviewer. Get instant feedback and improve your performance."
    >
      {/* Timer Selection */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center space-x-4 bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm">
          <label className="text-gray-200">Interview Duration:</label>
          <select
            value={minutes}
            onChange={e => setMinutes(Number(e.target.value))}
            className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>
        <button
          onClick={handleStart}
          className="mt-8 px-8 py-4 bg-blue-600 text-white font-medium rounded-xl shadow-lg hover:bg-blue-500 transition-all duration-300 transform hover:scale-105"
        >
          Start Practice Interview
        </button>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
          <div className="text-blue-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Real-time Feedback</h3>
          <p className="text-gray-400">Get instant feedback on your technical interview performance and areas for improvement.</p>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
          <div className="text-blue-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Analysis</h3>
          <p className="text-gray-400">Receive detailed analysis of your problem-solving approach and coding skills.</p>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
          <div className="text-blue-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Practice Anytime</h3>
          <p className="text-gray-400">Practice at your own pace, anytime, anywhere. No scheduling required.</p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: 1, title: 'Start Interview', desc: 'Click the button to begin your practice interview' },
            { step: 2, title: 'Answer Questions', desc: 'Speak your answers naturally' },
            { step: 3, title: 'Get Feedback', desc: 'Receive instant feedback on your performance' },
            { step: 4, title: 'Improve', desc: 'Use the feedback to enhance your skills' }
          ].map((item, index) => (
            <div key={item.step} className="relative">
              <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl font-bold text-blue-400 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
              {index < 3 && (
                <div className="hidden md:block absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
