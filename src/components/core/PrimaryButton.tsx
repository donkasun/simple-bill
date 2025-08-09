import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm.js';

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, className, style, ...props }) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const btn = buttonRef.current;
    const canvas = canvasRef.current;
    if (!btn || !canvas) return;

    const draw = () => {
      const rect = btn.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      const rc = rough.canvas(canvas);
      const padding = 2;
      rc.rectangle(padding, padding, w - padding * 2, h - padding * 2, {
        roughness: hovered ? 2.5 : 1.5,
        fill: getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') || '#0d6efd',
        fillStyle: 'solid',
        stroke: 'rgba(0,0,0,0.25)',
        strokeWidth: 1,
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(btn);
    window.addEventListener('resize', draw);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, [hovered]);

  return (
    <button
      {...props}
      ref={buttonRef}
      className={`btn-primary ${className ?? ''}`.trim()}
      style={{ position: 'relative', border: 'none', background: 'transparent', padding: '8px 12px', borderRadius: 8, ...style }}
      onMouseEnter={(e) => { setHovered(true); props.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); props.onMouseLeave?.(e); }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none' }} />
      <span style={{ position: 'relative', zIndex: 1, fontWeight: 600 }}>{children}</span>
    </button>
  );
};

export default PrimaryButton;