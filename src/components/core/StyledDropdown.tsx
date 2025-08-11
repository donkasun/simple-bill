import React, { useEffect, useMemo, useRef } from 'react';
import rough from 'roughjs/bundled/rough.esm.js';

type StyledDropdownProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

const StyledDropdown: React.FC<StyledDropdownProps> = ({ label, children, required, error, id, style, ...props }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorId = useMemo(() => `select-error-${Math.random().toString(36).slice(2)}`, []);

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
      rc.rectangle(0.5, 0.5, w - 1, h - 1, { roughness: 1, stroke: error ? 'rgba(220, 20, 60, 0.85)' : 'rgba(0,0,0,0.25)', strokeWidth: 1 });
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (wrapper) ro.observe(wrapper);
    window.addEventListener('resize', draw);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, [error]);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span style={{ fontSize: 14 }}>
          {label}
          {required ? <span aria-hidden="true" style={{ color: 'crimson' }}>&nbsp;*</span> : null}
        </span>
      )}
      <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          required={required}
          {...props}
          style={{ position: 'relative', zIndex: 1, width: 'calc(100% - 28px)', padding: '10px 12px', border: 'none', outline: 'none', background: 'transparent' }}
        >
          {children}
        </select>
      </div>
      {error && (
        <div id={errorId} role="alert" style={{ color: 'crimson', fontSize: 13, marginTop: 6 }}>{error}</div>
      )}
    </label>
  );
};

export default StyledDropdown;