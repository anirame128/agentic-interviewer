'use client';

interface PermissionStatusProps {
  permissionGranted: boolean;
}

export default function PermissionStatus({ permissionGranted }: PermissionStatusProps) {
  if (permissionGranted) return null;

  return (
    <div className="mb-8 p-4 bg-yellow-900/30 rounded-xl text-yellow-200 border border-yellow-800/50 backdrop-blur-sm animate-pulse">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Please grant microphone permissions to start the interview
      </div>
    </div>
  );
} 