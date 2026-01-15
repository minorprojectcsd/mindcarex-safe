import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import Login from './Login';
import AnimatedCube from '@/components/background/AnimatedCube';
import mindcareLogo from '@/assets/mindcare-logo.png';

export default function Landing() {
  const loginRef = useRef<HTMLDivElement>(null);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="scroll-smooth">
      {/* Welcome Section - Full Screen */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
        {/* Animated Cube Background */}
        <AnimatedCube />
        {/* Logo */}
        <img src={mindcareLogo} alt="mindcarex Logo" className="mx-auto mb-6 h-32 w-auto" />
        
        {/* Company Name */}
        <h1 className="font-orbitron text-5xl font-bold tracking-tight md:text-7xl">
          mindcareX
        </h1>
        
        {/* Tagline */}
        <p className="mt-4 text-xl text-muted-foreground md:text-2xl">
          Your Mental Wellness, Our Priority
        </p>

        {/* Blinking Scroll Indicator */}
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
