import React from 'react';
import { supabase } from './supabaseClient';
import './SignInModal.css';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSignInSuccess }) => {
  // 1) GOOGLE SIGN IN
  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      onClose();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="signin-modal-overlay">
      <div className="signin-modal">
        <div className="modal-header">
          <h2>Sign In</h2>
          <button className="home-secondary-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <h2>Sign In</h2>
          <p>Sign in to save and access your decisions across devices.</p>
          
          <div className="signin-options">
            <button className="home-secondary-button" onClick={handleSignIn}>
              Sign in with Google
            </button>
            
            <button className="home-secondary-button" onClick={onClose}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal; 