"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

/** Canvas signature pad that writes a PNG data URL into a hidden input. */
export function SignaturePad({ name = "signature", height = 180 }: { name?: string; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState("");
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvas.current!;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr;
      c.height = height * dpr;
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1d2433";
      setValue("");
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [height]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setValue(canvas.current!.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setValue("");
  };
  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-line bg-white">
        <canvas ref={canvas} style={{ height, width: "100%", touchAction: "none" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="block cursor-crosshair rounded-xl" />
        {!value && <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">Firme aquí con el dedo o el ratón</span>}
        <button type="button" onClick={clear} className="absolute top-2 right-2 rounded-lg bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-ink" aria-label="Borrar firma">
          <Eraser className="h-4 w-4" />
        </button>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
