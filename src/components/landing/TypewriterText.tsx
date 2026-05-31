import { useEffect, useState, type CSSProperties } from "react";

type TypewriterTextProps = {
  text: string;
  /** Re-run the animation when this key changes (e.g. step index). */
  animationKey: string | number;
  as?: "h3" | "p" | "span";
  style?: CSSProperties;
  charDelayMs?: number;
};

export default function TypewriterText({
  text,
  animationKey,
  as: Tag = "h3",
  style,
  charDelayMs = 32,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setDisplayed(text);
      setTyping(false);
      return;
    }

    setDisplayed("");
    setTyping(true);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setTyping(false);
      }
    }, charDelayMs);

    return () => window.clearInterval(id);
  }, [text, animationKey, charDelayMs]);

  return (
    <Tag style={style}>
      {displayed}
      {typing ? (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "2px",
            height: "0.85em",
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            backgroundColor: "currentColor",
            opacity: 0.7,
            animation: "typewriter-cursor 0.8s step-end infinite",
          }}
        />
      ) : null}
    </Tag>
  );
}
