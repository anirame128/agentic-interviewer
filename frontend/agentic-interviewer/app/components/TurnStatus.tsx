'use client';

interface TurnStatusProps {
  isActive: boolean;
  botSpeaking: boolean;
  turnStatus: string;
}

export default function TurnStatus({ isActive, botSpeaking, turnStatus }: TurnStatusProps) {
  if (!isActive || !turnStatus) return null;

  return (
    <div
      className={`
        mb-8 p-6 rounded-xl text-white font-medium shadow-lg
        transition-all duration-300 transform
        ${botSpeaking 
          ? 'bg-gray-700/50 backdrop-blur-sm' 
          : 'bg-green-600/80 backdrop-blur-sm'}
      `}
    >
      <div className="flex items-center justify-center gap-3 text-lg">
        {botSpeaking ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : null}
        {turnStatus}
      </div>
    </div>
  );
} 