import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-glow">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">MindCare</h1>
          <p className="mt-1 text-muted-foreground">Mental Health Platform</p>
        </div>

        <Card variant="elevated">
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>


            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
