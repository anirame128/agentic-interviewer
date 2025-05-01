'use client';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  className?: string;
}

export default function PageLayout({
  children,
  title,
  subtitle,
  maxWidth = '6xl',
  className = '',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 animate-gradient-y">
      <div className={`max-w-${maxWidth} mx-auto px-4 py-8 md:py-16 ${className}`}>
        {(title || subtitle) && (
          <div className="text-center mb-8 animate-fade-in">
            {title && <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{title}</h1>}
            {subtitle && <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        <div className="animate-fade-in">{children}</div>
      </div>
    </div>
  );
} 