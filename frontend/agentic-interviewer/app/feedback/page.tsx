'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Feedback() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    // In a real implementation, you would fetch the feedback from your backend
    // For now, we'll just show a placeholder
    setFeedback('Thank you for completing the interview! Your feedback will be available shortly.');
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="bg-black/80 backdrop-blur-md border-b border-white/10 px-4 fixed w-full z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Candid
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8"
          >
            <h1 className="text-3xl font-bold text-white mb-6">Interview Feedback</h1>
            
            <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
              <p className="text-white/80">{feedback}</p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                Return to Home
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 