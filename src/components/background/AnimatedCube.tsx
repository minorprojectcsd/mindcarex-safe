import { useAnimationFrame } from "motion/react";
import { useRef } from "react";

export default function AnimatedCube() {
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((t) => {
    if (!ref.current) return;
    // Slower, more dramatic rotation
    const rotateX = Math.sin(t / 8000) * 25;
    const rotateY = Math.cos(t / 6000) * 30;
    const rotateZ = Math.sin(t / 12000) * 15;
    ref.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none overflow-hidden">
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
          perspective: 1500px;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cube {
          width: min(80vw, 80vh);
          height: min(80vw, 80vh);
          position: relative;
          transform-style: preserve-3d;
        }
        .side {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0.15;
          border: 2px solid hsl(var(--primary) / 0.2);
          backdrop-filter: blur(2px);
        }
        .front {
          transform: rotateY(0deg) translateZ(min(40vw, 40vh));
          background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05));
        }
        .right {
          transform: rotateY(90deg) translateZ(min(40vw, 40vh));
          background: linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.05));
        }
        .back {
          transform: rotateY(180deg) translateZ(min(40vw, 40vh));
          background: linear-gradient(135deg, hsl(var(--secondary) / 0.2), hsl(var(--secondary) / 0.05));
        }
        .left {
          transform: rotateY(-90deg) translateZ(min(40vw, 40vh));
          background: linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--muted) / 0.1));
        }
        .top {
          transform: rotateX(90deg) translateZ(min(40vw, 40vh));
          background: linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1));
        }
        .bottom {
          transform: rotateX(-90deg) translateZ(min(40vw, 40vh));
          background: linear-gradient(135deg, hsl(var(--secondary) / 0.15), hsl(var(--primary) / 0.1));
        }
      `}</style>
    </div>
  );
}
