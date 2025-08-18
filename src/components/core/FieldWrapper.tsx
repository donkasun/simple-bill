import React, { useEffect, useMemo, useRef, cloneElement } from "react";
import rough from "roughjs/bundled/rough.esm.js";
import { roughInput } from "@utils/roughjs";

type FieldWrapperProps = {
  label?: string;
  required?: boolean;
  error?: string;
  style?: React.CSSProperties;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
};

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required,
  error,
  style,
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorId = useMemo(
    () => `field-error-${Math.random().toString(36).slice(2)}`,
    [],
  );

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
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      const rc = rough.canvas(canvas);
      const options = error
        ? { ...roughInput, stroke: "rgba(220, 20, 60, 0.85)" }
        : roughInput;
      rc.rectangle(0.5, 0.5, w - 1, h - 1, options);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapper);
    window.addEventListener("resize", draw);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [error]);

  const enhancedChild = cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    {
      "aria-invalid": !!error,
      "aria-describedby": error ? errorId : undefined,
      required,
      style: {
        position: "relative",
        zIndex: 1,
        width: "calc(100% - 28px)",
        padding: "10px 12px",
        border: "none",
        outline: "none",
        background: "transparent",
        ...((children as React.ReactElement<React.HTMLAttributes<HTMLElement>>)
          .props?.style || {}),
      },
    } as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
  );

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <span style={{ fontSize: 14 }}>
          {label}
          {required ? (
            <span aria-hidden="true" style={{ color: "crimson" }}>
              &nbsp;*
            </span>
          ) : null}
        </span>
      )}
      <div ref={wrapperRef} style={{ position: "relative", ...style }}>
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
        {enhancedChild}
      </div>
      {error && (
        <div
          id={errorId}
          role="alert"
          style={{ color: "crimson", fontSize: 13, marginTop: 6 }}
        >
          {error}
        </div>
      )}
    </label>
  );
};

export default FieldWrapper;
