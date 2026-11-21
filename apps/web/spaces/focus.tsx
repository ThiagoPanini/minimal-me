"use client";

import {
  createContext,
  type ReactNode,
  use,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import { useMedia } from "@/app/use-media";
import { useToast } from "@/components/Toast";
import type { SpaceId } from "@/spaces/catalog";

// O foco da fileira de spaces (módulo 4 da spec #57): decide qual space tem o foco, a partir
// do cursor, do teclado e do toque, e expõe o estado de cada fresta, que a própria fresta
// (pelo atributo `data-focus`, com as variantes `slit-*` de `app/globals.css`) e a foto viva
// leem (por `useSlitFocus`).
//
// Vale o space sob o teclado, senão o sob o cursor, senão o último tocado. Até 900px uma
// fresta fica sempre aberta: enquanto nenhuma tem foco, a última que teve (no começo, a
// primeira) fica guardada (`kept`). O estado inicial é o do HTML exportado, então a
// hidratação não muda nada; sem script, a fileira fica como nele.

// `active`: a fresta com foco. `kept`: a guardada, aberta só até 900px.
export type SlitFocus = "active" | "kept";

type FocusState = {
  keyboard: SpaceId | null;
  pointer: SpaceId | null;
  touch: SpaceId | null;
  // A última fresta com foco, que fica guardada.
  last: SpaceId;
};

type FocusAction = {
  type: "pointer-enter" | "pointer-leave" | "keyboard-focus" | "keyboard-blur" | "touch-choose";
  id: SpaceId;
};

function focusedId({ keyboard, pointer, touch }: FocusState): SpaceId | null {
  return keyboard ?? pointer ?? touch;
}

function nextState(state: FocusState, action: FocusAction): FocusState {
  const { id } = action;
  const next = { ...state };
  switch (action.type) {
    case "pointer-enter":
      next.pointer = id;
      break;
    case "pointer-leave":
      if (state.pointer === id) next.pointer = null;
      break;
    case "keyboard-focus":
      next.keyboard = id;
      break;
    case "keyboard-blur":
      if (state.keyboard === id) next.keyboard = null;
      break;
    // O toque escolhe a fresta, e ela fica escolhida até outro toque (a rolagem não muda nada).
    case "touch-choose":
      next.touch = id;
      next.pointer = null;
      next.keyboard = null;
      break;
  }
  next.last = focusedId(next) ?? state.last;
  return next;
}

function slitFocusOf(state: FocusState, id: SpaceId): SlitFocus | undefined {
  const focused = focusedId(state);
  if (focused) return focused === id ? "active" : undefined;
  return state.last === id ? "kept" : undefined;
}

const subscribeToNothing = () => () => {};

// Verdadeiro depois da hidratação: só com script a fresta inteira responde ao clique.
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

type SpaceFocusValue = {
  state: FocusState;
  dispatch: (action: FocusAction) => void;
  stacked: boolean;
};

const SpaceFocusContext = createContext<SpaceFocusValue | null>(null);

function useSpaceFocus(): SpaceFocusValue {
  const value = use(SpaceFocusContext);
  if (!value) throw new Error("useSpaceFocus fora do SpaceFocusProvider");
  return value;
}

type SpaceFocusProviderProps = {
  // A fresta guardada no começo, aberta até 900px.
  kept: SpaceId;
  children: ReactNode;
};

export function SpaceFocusProvider({ kept, children }: SpaceFocusProviderProps) {
  const [state, dispatch] = useReducer(nextState, {
    keyboard: null,
    pointer: null,
    touch: null,
    last: kept,
  });
  // Até 900px a fileira empilha, e a fresta guardada fica aberta.
  const stacked = useMedia("stacked");
  return <SpaceFocusContext value={{ state, dispatch, stacked }}>{children}</SpaceFocusContext>;
}

// O estado de foco de uma fresta: `focus` é o que ela leva em `data-focus`; `open` diz se ela
// está aberta agora (com foco, ou guardada até 900px), que é quando a foto viva acorda.
export function useSlitFocus(id: SpaceId): { focus: SlitFocus | undefined; open: boolean } {
  const { state, stacked } = useSpaceFocus();
  const focus = slitFocusOf(state, id);
  return { focus, open: focus === "active" || (focus === "kept" && stacked) };
}

type FocusableSlitProps = {
  id: SpaceId;
  anchor: string;
  // O aviso do "Acessar", enquanto o space não tem página.
  notice: string;
  className: string;
  children: ReactNode;
};

// O item da fileira que recebe o foco: o cursor (mouse ou caneta) ao entrar e sair, o foco
// de teclado visível no "Acessar" e o toque. A fresta inteira responde como o link (no Marco
// 1, com o aviso, sem sair do lugar), menos ao toque numa fresta fechada, que só a escolhe:
// o segundo toque é que responde.
export function FocusableSlit({ id, anchor, notice, className, children }: FocusableSlitProps) {
  const { dispatch } = useSpaceFocus();
  const { focus, open } = useSlitFocus(id);
  const showToast = useToast();
  const hydrated = useHydrated();
  // O tipo do último ponteiro que apertou a fresta, para saber se o clique veio de um toque.
  const pressedWith = useRef<string | null>(null);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: o teclado aciona o "Acessar", e o clique dele sobe até a fresta.
    <li
      id={anchor}
      data-space={id}
      data-focus={focus}
      className={hydrated ? `${className} cursor-pointer` : className}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") dispatch({ type: "pointer-enter", id });
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") dispatch({ type: "pointer-leave", id });
      }}
      // O foco que o clique põe no link não conta: só o visível, que vem do teclado.
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) dispatch({ type: "keyboard-focus", id });
      }}
      onBlur={() => dispatch({ type: "keyboard-blur", id })}
      onPointerDown={(event) => {
        pressedWith.current = event.pointerType;
      }}
      onClick={(event) => {
        // O clique do teclado no "Acessar" não tem ponteiro (`detail` 0).
        const touched = pressedWith.current === "touch" && event.detail > 0;
        pressedWith.current = null;
        event.preventDefault();
        if (touched && !open) dispatch({ type: "touch-choose", id });
        else showToast(notice);
      }}
    >
      {children}
    </li>
  );
}
