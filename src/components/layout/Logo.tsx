import { APP_NAME } from "@/lib/constants";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#3463e6" />
      <path d="M14 30 32 15l18 15v19a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3Z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      <path d="M38 36a6 6 0 1 0 0 1v7a6 6 0 0 1-9 5" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={34} />
      {!collapsed && (
        <span className="text-[22px] font-bold tracking-tight text-ink">
          inmo<span className="text-brand-600">gest</span>
        </span>
      )}
    </span>
  );
}
export const LOGO_TEXT = APP_NAME;
