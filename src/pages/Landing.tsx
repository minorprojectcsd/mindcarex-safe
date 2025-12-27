import { useRef } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import Login from './Login';
import JumpingDots from '@/components/background/JumpingDots';

export default function Landing() {
  const loginRef = useRef<HTMLDivElement>(null);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="scroll-smooth">
      {/* Welcome Section - Full Screen */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-glow">
          <Heart className="h-10 w-10 text-primary-foreground" />
        </div>
        
        {/* Company Name */}
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          MindCare
        </h1>
        
        {/* Tagline */}
        <p className="mt-4 text-xl text-muted-foreground md:text-2xl">
          Your Mental Wellness, Our Priority
        </p>

        {/* Jumping Dots Animation */}
        <div className="mt-8">
          <JumpingDots />
        </div>
        <button
          onClick={scrollToLogin}
          className="absolute bottom-12 flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="text-sm font-medium animate-pulse">Scroll to continue</span>
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>

      {/* Login Section */}
      <div ref={loginRef}>
        <Login />
      </div>
    </div>
  );
}
