import { useAnimationFrame } from "motion/react";
import { useRef } from "react";

export default function AnimatedCube() {
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((t) => {
    if (!ref.current) return;
    const rotate = Math.sin(t / 10000) * 200;
    const y = (1 + Math.sin(t / 1000)) * -50;
    ref.current.style.transform = `translateY(${y}px) rotateX(${rotate}deg) rotateY(${rotate}deg)`;
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
      <div className="cube-container">
        <div className="cube" ref={ref}>
          <div className="side front" />
          <div className="side left" />
          <div className="side right" />
          <div className="side top" />
          <div className="side bottom" />
          <div className="side back" />
        </div>
      </div>
      <style>{`
        .cube-container {
          perspective: 800px;
          width: 200px;
          height: 200px;
        }
        .cube {
          width: 200px;
          height: 200px;
          position: relative;
          transform-style: preserve-3d;
        }
        .side {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0.4;
          border: 1px solid hsl(var(--primary) / 0.3);
        }
        .front {
          transform: rotateY(0deg) translateZ(100px);
          background: linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1));
        }
        .right {
          transform: rotateY(90deg) translateZ(100px);
          background: linear-gradient(135deg, hsl(var(--accent) / 0.3), hsl(var(--accent) / 0.1));
        }
        .back {
          transform: rotateY(180deg) translateZ(100px);
          background: linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.1));
        }
        .left {
          transform: rotateY(-90deg) translateZ(100px);
          background: linear-gradient(135deg, hsl(var(--muted) / 0.5), hsl(var(--muted) / 0.2));
        }
        .top {
          transform: rotateX(90deg) translateZ(100px);
          background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2));
        }
        .bottom {
          transform: rotateX(-90deg) translateZ(100px);
          background: linear-gradient(135deg, hsl(var(--secondary) / 0.2), hsl(var(--primary) / 0.2));
        }
      `}</style>
    </div>
  );
}
