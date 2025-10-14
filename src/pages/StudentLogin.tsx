import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { GraduationCap, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  studentId: z.string().trim().min(5, { message: 'Invalid Student ID' }).max(50),
  verificationName: z.string().trim().min(2, { message: 'Name is required' }).max(100),
});

const StudentLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [verificationName, setVerificationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, student } = useStudentAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (student) {
      navigate('/student/dashboard');
    }
  }, [student, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const parsed = loginSchema.safeParse({ studentId, verificationName });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Please check your inputs';
      toast.error(firstError);
      setIsLoading(false);
      return;
    }
    const sid = parsed.data.studentId.trim();
    const name = parsed.data.verificationName.trim();
    const result = await login(sid, name);
    if (result.success) {
      toast.success('Login successful!');
      navigate('/student/dashboard');
    } else {
      toast.error(result.error || 'Login failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Student Portal</CardTitle>
          <CardDescription>
            Access your medical records using your Student ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="e.g., 22-17-099"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={verificationName}
                onChange={(e) => setVerificationName(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your name exactly as registered
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Access My Records
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact the clinic office
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLogin;
