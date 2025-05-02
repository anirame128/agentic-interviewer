'use client';

import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  /** total seconds to count down from */
  initialSeconds: number;
  /** called when timer reaches 0 */
  onComplete?: () => void;
  /** size variant for the timer */
  variant?: 'small' | 'large';
}

export default function Timer({ initialSeconds, onComplete, variant = 'small' }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<number | undefined>(undefined);
  const prevInitialSecondsRef = useRef(initialSeconds);
  const onCompleteRef = useRef(onComplete);

  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Only reset the timer if initialSeconds changes significantly
  useEffect(() => {
    // If the difference is more than 1 second, consider it a reset
    if (Math.abs(initialSeconds - prevInitialSecondsRef.current) > 1) {
      setSecondsLeft(initialSeconds);
      prevInitialSecondsRef.current = initialSeconds;
    }
  }, [initialSeconds]);

  // Start the countdown
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
          }
          // Use the ref to call onComplete
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // cleanup on unmount
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []); // Remove onComplete from dependencies

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');

  const isSmall = variant === 'small';
  const textSize = isSmall ? 'text-xl' : 'text-4xl';
  const bgColor = isSmall ? 'bg-gray-800/50' : 'bg-gray-800/80';
  const padding = isSmall ? 'px-3 py-1' : 'px-6 py-3';

  return (
    <div className={`inline-flex items-center space-x-1 ${textSize} font-mono`}>
      <div className={`${bgColor} ${padding} rounded-lg flex items-center space-x-1`}>
        <span className="text-white">{minutes}</span>
        <span className="text-gray-400">:</span>
        <span className="text-white">{secs}</span>
      </div>
      {!isSmall && (
        <span className="text-gray-400 text-sm ml-2">remaining</span>
      )}
    </div>
  );
} 