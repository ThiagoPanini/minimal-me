"use client";

import { createContext, type ReactNode, use, useReducer, useSyncExternalStore } from "react";
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
  type: "pointer-enter" | "pointer-leave" | "keyboard-focus" | "keyboard-blur";
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
  }
  next.last = focusedId(next) ?? state.last;
  return next;
}

function slitFocusOf(state: FocusState, id: SpaceId): SlitFocus | undefined {
  const focused = focusedId(state);
  if (focused) return focused === id ? "active" : undefined;
  return state.last === id ? "kept" : undefined;
}

// Até 900px a fileira empilha (a variante `stacked` de `app/globals.css`).
const stackedQuery = "(max-width: 900px)";

function subscribeToStacked(onChange: () => void): () => void {
  const query = window.matchMedia(stackedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useStacked(): boolean {
  return useSyncExternalStore(
    subscribeToStacked,
    () => window.matchMedia(stackedQuery).matches,
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
  if (!value) throw new Error("useSlitFocus fora do SpaceFocusProvider");
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
  const stacked = useStacked();
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
  className: string;
  children: ReactNode;
};

// O item da fileira que recebe o foco: o cursor (mouse ou caneta) ao entrar e sair, o foco
// de teclado visível no "Acessar" e o toque, que escolhe.
export function FocusableSlit({ id, anchor, className, children }: FocusableSlitProps) {
  const { dispatch } = useSpaceFocus();
  const { focus } = useSlitFocus(id);
  return (
    <li
      id={anchor}
      data-space={id}
      data-focus={focus}
      className={className}
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
    >
      {children}
    </li>
  );
}
