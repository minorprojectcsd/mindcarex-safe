import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import Login from './Login';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
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
        {/* Dotted Glow Background */}
        <DottedGlowBackground 
          gap={16}
          radius={1.5}
          color="rgba(45, 137, 124, 0.4)"
          glowColor="rgba(45, 137, 124, 0.9)"
          darkColor="rgba(45, 137, 124, 0.6)"
          darkGlowColor="rgba(45, 137, 124, 1)"
          opacity={0.8}
          speedScale={0.6}
        />
        
        {/* 3D Logo Container */}
        <div className="logo-3d-container relative z-10 mb-6">
          <img 
            src={mindcareLogo} 
            alt="mindcarex Logo" 
            className="logo-3d h-40 w-auto drop-shadow-2xl" 
          />
        </div>
        
        {/* Company Name */}
        <h1 className="relative z-10 font-orbitron text-5xl font-bold tracking-tight md:text-7xl">
          mindcareX
        </h1>
        
        {/* Tagline */}
        <p className="relative z-10 mt-4 text-xl text-muted-foreground md:text-2xl">
          Your Mental Wellness, Our Priority
        </p>

        {/* Blinking Scroll Indicator */}
        <button
          onClick={scrollToLogin}
          className="absolute bottom-12 z-10 flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="text-sm font-medium animate-pulse">Scroll to continue</span>
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>

      {/* Login Section */}
      <div ref={loginRef}>
        <Login />
      </div>

      <style>{`
        .logo-3d-container {
          perspective: 1000px;
        }
        
        .logo-3d {
          transform-style: preserve-3d;
          animation: float3d 6s ease-in-out infinite;
          filter: drop-shadow(0 20px 40px rgba(45, 137, 124, 0.3))
                  drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
        }
        
        @keyframes float3d {
          0%, 100% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg);
          }
          25% {
            transform: translateY(-10px) rotateX(5deg) rotateY(-5deg);
          }
          50% {
            transform: translateY(-15px) rotateX(0deg) rotateY(5deg);
          }
          75% {
            transform: translateY(-8px) rotateX(-5deg) rotateY(0deg);
          }
        }
        
        .logo-3d:hover {
          animation-play-state: paused;
          transform: translateY(-20px) rotateX(10deg) rotateY(10deg) scale(1.1);
          transition: transform 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
