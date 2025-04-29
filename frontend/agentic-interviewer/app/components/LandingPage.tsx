'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>AI Mock Interview</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px' }}>
        Practice your technical interview skills with our AI interviewer. 
        You'll be asked coding questions and can respond verbally.
      </p>
      <button
        onClick={() => router.push('/interview')}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0051a3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
      >
        Start Interview
      </button>
    </div>
  );
} 