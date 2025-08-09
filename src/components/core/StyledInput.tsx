import React, { useEffect, useRef } from 'react';
import rough from 'roughjs/bundled/rough.esm.js';

type StyledInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const StyledInput: React.FC<StyledInputProps> = ({ label, style, ...props }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const draw = () => {
      const rect = wrapper.getBoundingClientRect();
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
      rc.rectangle(0.5, 0.5, w - 1, h - 1, { roughness: 1, stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1 });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapper);
    window.addEventListener('resize', draw);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
      <div ref={wrapperRef} style={{ position: 'relative', borderRadius: 8, ...style }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 8 }} />
        <input ref={inputRef} {...props} style={{ position: 'relative', zIndex: 1, width: '100%', padding: '10px 12px', border: 'none', outline: 'none', background: 'transparent' }} />
      </div>
    </label>
  );
};

export default StyledInput;