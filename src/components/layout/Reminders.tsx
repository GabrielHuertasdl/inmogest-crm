"use client";

import { useEffect } from "react";
import { alertToast } from "@/components/forms";

/** Polls every minute and shows due event reminders (browser notification when permitted, toast otherwise). */
export function Reminders() {
  useEffect(() => {
    const seen = new Set<number>();
    const tick = async () => {
      try {
        const r = await fetch("/api/recordatorios").then((r) => r.json());
        for (const n of r.reminders ?? []) {
          if (seen.has(n.id)) continue;
          seen.add(n.id);
          if ("Notification" in window && Notification.permission === "granted") new Notification(n.title, { body: n.body, icon: "/brand/icon.svg" });
          else alertToast(`🔔 ${n.title} · ${n.body}`, "ok");
        }
      } catch {}
    };
    if ("Notification" in window && Notification.permission === "default") {
      const ask = () => {
        Notification.requestPermission();
        window.removeEventListener("click", ask);
      };
      window.addEventListener("click", ask);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
