import React, { useRef, useEffect } from 'react';
import rough from 'roughjs';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const rc = rough.canvas(canvasRef.current);
      rc.line(0, canvasRef.current.height, canvasRef.current.width, canvasRef.current.height);
    }
  }, [title]);

  return (
    <header style={{ position: 'relative', paddingBottom: '10px' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <canvas ref={canvasRef} style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px' }}></canvas>
    </header>
  );
};

export default Header;