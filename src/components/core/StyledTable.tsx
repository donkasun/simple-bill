import React, { useEffect, useRef } from 'react';
import rough from 'roughjs/bundled/rough.esm.js';

type StyledTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  children?: React.ReactNode;
};

const StyledTable: React.FC<StyledTableProps> = ({ children, style, ...props }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      rc.rectangle(0.5, 0.5, w - 1, h - 1, { roughness: 0.8, stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1 });
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
    <div ref={wrapperRef} className="table-wrapper card" style={{ position: 'relative', borderRadius: 12, ...style }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 12 }} />
      <table {...props} className="table" style={{ position: 'relative', zIndex: 1, width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  );
};

export default StyledTable;