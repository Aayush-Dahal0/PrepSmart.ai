import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Briefcase, Users, ChevronRight } from 'lucide-react';

const AuthPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', confirmPassword: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { login, register, forgotPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password confirmation
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      await register(registerData.email, registerData.password, registerData.name);
      toast({
        title: "Check your email!",
        description: "We've sent you a verification link. Please verify your email before signing in.",
        variant: "default"
      });
      // Don't navigate to dashboard - wait for email verification
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(resetEmail);
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
        variant: "default"
      });
      setForgotPasswordMode(false);
      setResetEmail('');
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <img src="/logo.png" alt="PrepSmart Logo" className="h-8 w-8 object-contain invert brightness-0" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PrepSmart
              </h1>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Master Your Next
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Interview</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-md">
              Practice with AI-powered mock interviews designed to boost your confidence and land your dream job.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Briefcase className="h-5 w-5 text-primary" />
              <span>Industry-specific interview scenarios</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>Real-time feedback and improvement tips</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <ChevronRight className="h-5 w-5 text-primary" />
              <span>Track your progress over time</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="w-full max-w-md mx-auto shadow-glass backdrop-blur-sm border-white/20 animate-slide-in">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Join thousands of professionals who've aced their interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {!forgotPasswordMode ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="gradient"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => setForgotPasswordMode(true)}
                    >
                      Forgot your password?
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="gradient"
                      disabled={loading}
                    >
                      {loading ? 'Sending reset link...' : 'Send Reset Link'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setForgotPasswordMode(false);
                        setResetEmail('');
                      }}
                    >
                      Back to sign in
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      placeholder="Enter your name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="gradient"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;