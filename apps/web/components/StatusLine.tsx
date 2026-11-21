import type { SpaceStatus } from "@/spaces/catalog";

// O Status de um space em ponto e palavra (docs/design/system/components/StatusLine), sem
// caixa, numa linha. O ponto tem 5px e diz qual é qual: cheio em "Disponível", cheio e
// pulsando em "Em desenvolvimento", vazado em "Em planejamento". "Em desenvolvimento" leva a
// única cor da página, no ponto e na palavra; o pulso para com movimento reduzido. É
// informativo: não recebe foco nem clique.

const dotByStatus: Record<SpaceStatus, string> = {
  available: "bg-current",
  "in-development": "bg-current motion-safe:animate-status-pulse",
  planned: "[box-shadow:inset_0_0_0_1px_currentColor]",
};

type StatusLineProps = {
  status: SpaceStatus;
  word: string;
  // Classes da palavra, para quem a esconde da vista e a deixa para o leitor de tela.
  wordClassName?: string;
};

export function StatusLine({ status, word, wordClassName }: StatusLineProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap font-mono font-normal text-[11px] leading-none tracking-[.05em] ${status === "in-development" ? "text-status-in-development" : "text-body"}`}
    >
      <span className={`block size-[5px] flex-none rounded-circle ${dotByStatus[status]}`} />
      <span className={wordClassName}>{word}</span>
    </span>
  );
}
