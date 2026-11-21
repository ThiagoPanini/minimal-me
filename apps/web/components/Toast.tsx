"use client";

import { createContext, type ReactNode, use, useEffect, useRef, useState } from "react";

// O aviso (docs/design/system/components/Toast; módulo 7 da spec #57): uma linha de texto que
// responde a uma ação sem destino, centrada no pé da tela. Hoje, o "Acessar" de um space que
// ainda não abre. Fixo a 20px do pé, dentro da área segura, nunca mais largo que a tela menos
// 32px; aparece e some por opacidade em 0,5s (só com movimento) e fica 2,6s à vista. Acionar
// de novo reinicia o tempo.
//
// A região `role="status"` já vem vazia no HTML exportado, para o leitor de tela anunciar o
// que entrar nela; sem script, ela continua vazia. Cada aviso entra num nó novo, para ser
// anunciado de novo mesmo quando a mensagem se repete, e sai da página quando some da vista.

const shownMs = 2600;
const fadeMs = 500;

type Notice = { message: string; key: number; shown: boolean };

type ToastValue = {
  notice: Notice | null;
  show: (message: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

function useToastContext(): ToastValue {
  const value = use(ToastContext);
  if (!value) throw new Error("Toast fora do ToastProvider");
  return value;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers;
    return () => {
      for (const timer of pending.current) window.clearTimeout(timer);
    };
  }, []);

  const show = (message: string) => {
    for (const timer of timers.current) window.clearTimeout(timer);
    setNotice((current) => ({ message, key: (current?.key ?? 0) + 1, shown: true }));
    timers.current = [
      window.setTimeout(
        () => setNotice((current) => current && { ...current, shown: false }),
        shownMs,
      ),
      window.setTimeout(() => setNotice(null), shownMs + fadeMs),
    ];
  };

  return <ToastContext value={{ notice, show }}>{children}</ToastContext>;
}

// Mostra um aviso: `useToast()(mensagem)`.
export function useToast(): (message: string) => void {
  return useToastContext().show;
}

export function Toast() {
  const { notice } = useToastContext();
  return (
    <div
      role="status"
      data-shown={notice?.shown || undefined}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-60 mx-auto w-fit max-w-[calc(100vw-32px)] border border-toast-border bg-toast-bg px-[14px] py-[9px] text-center font-light font-mono text-[12px] text-light leading-[1.5] opacity-0 motion-safe:[transition:opacity_.5s_var(--ease)] data-shown:opacity-100"
    >
      {notice && <span key={notice.key}>{notice.message}</span>}
    </div>
  );
}
