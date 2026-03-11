import { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Login from './Login';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import mindcareBrain from '@/assets/mindcare-brain.png';

export default function Landing() {
  const loginRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const parallaxOffset = scrollY * 0.4;
  const logoScale = Math.max(0.6, 1 - scrollY * 0.001);
  const heroOpacity = Math.max(0, 1 - scrollY * 0.002);

  return (
    <div className="scroll-smooth">
      {/* Welcome Section - Full Screen */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background"
      >
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

        {/* Hero content with parallax */}
        <div
          className="relative z-10 flex flex-col items-center"
          style={{
            transform: `translateY(-${parallaxOffset}px) scale(${logoScale})`,
            opacity: heroOpacity,
            willChange: 'transform, opacity',
          }}
        >
          {/* 3D Logo Container */}
          <div
            className={`logo-3d-container mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <img
              src={mindcareBrain}
              alt="mindcareX Logo"
              className="logo-3d h-40 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Company Name */}
          <h1
            className={`font-orbitron text-5xl font-bold tracking-tight md:text-7xl transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="text-primary">mind</span>
            <span className="text-foreground">care</span>
            <span className="text-primary">X</span>
          </h1>

          {/* Tagline */}
          <p
            className={`mt-4 font-jakarta text-xl text-muted-foreground md:text-2xl transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Your Mental Wellness, Our Priority
          </p>
        </div>

        {/* Blinking Scroll Indicator */}
        <button
          onClick={scrollToLogin}
          className={`absolute bottom-12 z-10 flex flex-col items-center gap-2 text-muted-foreground transition-all hover:text-primary duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
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
