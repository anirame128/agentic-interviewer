'use client';

interface ControlButtonsProps {
  interviewActive: boolean;
  permissionGranted: boolean;
  onStartInterview: () => void;
  onEndInterview: () => void;
}

export default function ControlButtons({
  interviewActive,
  permissionGranted,
  onStartInterview,
  onEndInterview,
}: ControlButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      {!interviewActive ? (
        <button
          type="button"
          onClick={onStartInterview}
          disabled={!permissionGranted}
          className={`
            px-8 py-4 rounded-xl text-white font-medium shadow-lg
            transition-all duration-300 transform hover:scale-105
            ${!permissionGranted
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'}
          `}
        >
          Start Interview
        </button>
      ) : (
        <button 
          type="button"
          onClick={onEndInterview}
          className="px-8 py-4 rounded-xl text-white font-medium bg-red-600 hover:bg-red-500 shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          End Interview
        </button>
      )}
    </div>
  );
} 