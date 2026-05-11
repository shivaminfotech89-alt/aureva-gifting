import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showIframeError, setShowIframeError] = useState(false);

  const handleGoogleLogin = async () => {
    setShowIframeError(false);
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast.success("Successfully logged in!");
        // Navigation will be handled by a useEffect watching the profile
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info("Login cancelled");
      } else if (error.code === 'auth/web-storage-unsupported' || error.message?.includes('cross-origin')) {
        setShowIframeError(true);
        toast.error("Login popup blocked by your browser.");
      } else {
        toast.error(error.message || "Failed to login");
        console.error(error);
      }
      setIsLoading(false);
    }
  };

  const { profile, user } = useAuthStore();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
      setIsLoading(false);
    }
  }, [user, profile, navigate]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 px-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Sign in securely using your Google account to access your orders and saved items.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-3 font-medium h-14 text-lg border-2 hover:bg-muted/50 transition-colors bg-background"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          
          {showIframeError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 text-sm text-destructive mt-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Popups are blocked or restricted in your current preview environment. Please open this application in a <strong>new full-screen browser window/tab</strong> to sign in securely.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 pb-6 flex justify-center">
          <div className="text-sm text-center text-muted-foreground mt-2 max-w-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
