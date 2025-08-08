import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import PrimaryButton from '../components/core/PrimaryButton';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        overflow: 'hidden',
        padding: '1rem',
        backgroundColor: '#FDFBF6',
        color: '#343a40',
      }}
    >
      <div style={{ width: '100%', maxWidth: 384 }}>
        <div
          style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(52,58,64,0.2)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <svg
              style={{ width: 48, height: 48, margin: '0 auto 1rem', color: '#0d6efd', display: 'block' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <h1 className="brand" style={{ fontSize: '2rem', lineHeight: '2.25rem', fontWeight: 700 }}>SimpleBill</h1>
            <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'rgba(52,58,64,0.7)' }}>
              Sign in to manage your invoices and quotations.
            </p>
          </div>
          <PrimaryButton
            onClick={signInWithGoogle}
            className="btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            <svg style={{ width: 20, height: 20 }} fill="currentColor" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"></path>
            </svg>
            <span>Sign in with Google</span>
          </PrimaryButton>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(52,58,64,0.7)' }}>
          By signing in, you agree to our{' '}
          <a style={{ fontWeight: 500, color: '#0d6efd', textDecoration: 'underline' }} href="#">
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Login;
