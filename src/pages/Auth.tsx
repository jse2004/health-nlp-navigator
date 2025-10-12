
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Activity, Heart, Users, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Account created successfully!",
          description: "You can now sign in with your credentials.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Left side - Enhanced Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-medical-primary via-blue-600 to-cyan-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white animate-pulse-gentle"></div>
          <div className="absolute bottom-40 right-16 w-24 h-24 rounded-full bg-white animate-pulse-gentle" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-8 w-16 h-16 rounded-full bg-white animate-pulse-gentle" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <img src="/udm_clinic.png" alt="UDM Clinic Logo" className="w-16 h-16 object-contain" />
          </div>
          
          <h1 className="text-5xl font-bold mb-6 tracking-tight">UDM CARE</h1>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Advanced Healthcare Analytics & Natural Language Processing Platform
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-time Analytics</h3>
                <p className="text-blue-100 text-sm">Monitor patient data in real-time</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Patient Care</h3>
                <p className="text-blue-100 text-sm">Comprehensive medical record management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Insights</h3>
                <p className="text-blue-100 text-sm">Advanced NLP for medical text analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700 transition-colors animate-fade-in">
            {/* Logo for mobile */}
            <div className="lg:hidden text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-medical-primary to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">UDM CARE</h2>
            </div>

            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {isSignUp ? 'Create Admin Account' : 'Welcome Back'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {isSignUp 
                  ? 'Set up your administrator access' 
                  : 'Sign in to access your healthcare dashboard'
                }
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 border-2 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-medical-primary focus:border-medical-primary rounded-xl text-lg transition-all duration-200"
                    placeholder="admin@healthcare.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 border-2 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-medical-primary focus:border-medical-primary rounded-xl text-lg transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-medical-primary to-blue-600 hover:from-medical-primary/90 hover:to-blue-600/90 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-medical-primary hover:text-medical-primary/80 text-sm font-semibold transition-colors underline-offset-4 hover:underline"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Create one"}
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Secure admin access to UDM CARE analytics platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
