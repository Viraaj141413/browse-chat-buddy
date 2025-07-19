import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { SignUpForm } from "@/components/SignUpForm";
import { AIInterface } from "@/components/AIInterface";

type AppState = 'landing' | 'signup' | 'interface';

interface UserData {
  name: string;
  email: string;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleGetStarted = () => {
    setAppState('signup');
  };

  const handleSignUp = (data: { name: string; email: string; password: string }) => {
    setUserData({ name: data.name, email: data.email });
    setAppState('interface');
  };

  const handleBackToLanding = () => {
    setAppState('landing');
  };

  const handleLogout = () => {
    setUserData(null);
    setAppState('landing');
  };

  return (
    <>
      {appState === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      
      {appState === 'signup' && (
        <SignUpForm onBack={handleBackToLanding} onSignUp={handleSignUp} />
      )}
      
      {appState === 'interface' && userData && (
        <AIInterface userName={userData.name} onLogout={handleLogout} />
      )}
    </>
  );
};

export default Index;
