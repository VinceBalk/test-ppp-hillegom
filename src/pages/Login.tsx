
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginHeader } from '@/components/LoginHeader';
import { LoginForm } from '@/components/LoginForm';
import { SignUpForm } from '@/components/SignUpForm';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';

export default function Login() {
  const { user } = useAuth();
  const [showResetForm, setShowResetForm] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleForgotPassword = () => {
    setShowResetForm(true);
  };

  const handleBackToLogin = () => {
    setShowResetForm(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
        <LoginHeader />
        <CardContent>
          {showResetForm ? (
            <ForgotPasswordForm onBack={handleBackToLogin} />
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Inloggen</TabsTrigger>
                <TabsTrigger value="signup">Registreren</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <LoginForm onForgotPassword={handleForgotPassword} />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
