import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    const mouse = { x: -9999, y: -9999 };

    const PARTICLE_COUNT = 80;
    const CONNECTION_DISTANCE = 150;
    const SPEED = 0.4;

    let particles: {
      x: number; y: number;
      vx: number; vy: number;
      radius: number; opacity: number;
      pulseSpeed: number; pulseOffset: number;
    }[] = [];

    function resize() {
      const parent = canvas!.parentElement;
      const pw = parent ? parent.clientWidth : window.innerWidth;
      const ph = parent ? parent.clientHeight : window.innerHeight;
      canvas!.width = pw;
      canvas!.height = ph;
      canvas!.style.width = pw + "px";
      canvas!.style.height = ph + "px";
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          radius: Math.random() * 2.5 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    resize();
    initParticles();

    const handleResize = () => {
      resize();
      initParticles();
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    function animate() {
      animId = requestAnimationFrame(animate);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      frame++;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;

        // Mouse repulsion
        if (mouse.x > -9000) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            p.vx += (dx / dist) * force * 0.3;
            p.vy += (dy / dist) * force * 0.3;
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 2.5) {
              p.vx = (p.vx / speed) * 2.5;
              p.vy = (p.vy / speed) * 2.5;
            }
          }
        }

        // Gradually return to normal speed
        p.vx *= 0.99;
        p.vy *= 0.99;
        if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * 0.05;

        // Pulse opacity
        const pulse = Math.sin(frame * p.pulseSpeed + p.pulseOffset);
        const currentOpacity = Math.max(0, Math.min(1, p.opacity + pulse * 0.15));

        // Draw dot
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(190, 207, 207, ${currentOpacity})`;
        ctx!.fill();

        // Draw connections to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.25;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.strokeStyle = `rgba(190, 207, 207, ${lineOpacity})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }

        // Mouse connection line
        if (mouse.x > -9000) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const lineOpacity = (1 - dist / 180) * 0.4;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.strokeStyle = `rgba(20, 119, 110, ${lineOpacity})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }
    }

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}
