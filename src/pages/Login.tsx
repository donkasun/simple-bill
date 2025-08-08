import React from 'react';
import { useAuth } from '../hooks/useAuth';
import PrimaryButton from '../components/core/PrimaryButton';

const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1>SimpleBill</h1>
        <PrimaryButton onClick={signInWithGoogle}>
          Sign in with Google
        </PrimaryButton>
      </div>
    </div>
  );
};

export default Login;
