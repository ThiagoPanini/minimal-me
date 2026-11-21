"use client";

import {
  createContext,
  type ReactNode,
  startTransition,
  use,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { matchesMedia } from "@/app/use-media";

// O aviso (docs/design/system/components/Toast; módulo 7 da spec #57): uma linha de texto que
// responde a uma ação sem destino, centrada no pé da tela. Hoje, o "Acessar" de um space que
// ainda não abre. Fixo a 20px do pé, dentro da área segura, nunca mais largo que a tela menos
// 32px; aparece e some por opacidade em 0,5s (só com movimento) e fica 2,6s à vista. Acionar
// de novo reinicia o tempo. O texto é `small`, com a entrelinha de 1,5 do guia, em vez da do
// estilo.
//
// O aparecer e o sumir são uma transição de vista do React (`<ViewTransition>`): com movimento,
// cada mudança do aviso entra numa transição, e o navegador funde o quadro velho do aviso no
// novo em 0,5s (`toast-fade` em `app/globals.css`), sem capturar o resto da página. Com
// movimento reduzido, a mudança vale na hora, sem transição.
//
// A região `role="status"` já vem vazia no HTML exportado, para o leitor de tela anunciar o
// que entrar nela; sem script, ela continua vazia. Cada aviso entra num nó novo, para ser
// anunciado de novo mesmo quando a mensagem se repete, e sai da página quando some da vista.

const shownMs = 2600;
const fadeMs = 500;

// Só com movimento a mudança entra numa transição, que o `<ViewTransition>` do aviso anima;
// sem ele, ela vale na hora.
function changeNotice(change: () => void): void {
  if (matchesMedia("motion")) startTransition(change);
  else change();
}

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
    changeNotice(() =>
      setNotice((current) => ({ message, key: (current?.key ?? 0) + 1, shown: true })),
    );
    timers.current = [
      window.setTimeout(
        () => changeNotice(() => setNotice((current) => current && { ...current, shown: false })),
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
    <ViewTransition update="toast-fade" default="none">
      <div
        role="status"
        data-shown={notice?.shown || undefined}
        className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-60 mx-auto w-fit max-w-[calc(100vw-32px)] border border-toast-border bg-toast-bg px-[14px] py-[9px] text-center font-mono text-small text-light leading-[1.5] opacity-0 data-shown:opacity-100"
      >
        {notice && <span key={notice.key}>{notice.message}</span>}
      </div>
    </ViewTransition>
  );
}
