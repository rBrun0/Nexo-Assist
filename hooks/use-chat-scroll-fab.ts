"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const NEAR_BOTTOM_PX = 120;

function distanceFromBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

function hasOverflow(el: HTMLElement) {
  return el.scrollHeight - el.clientHeight > NEAR_BOTTOM_PX;
}

export function useChatScrollFab({
  scrollRef,
  endRef,
  messageCount,
  stickSignal = 0,
}: {
  scrollRef: RefObject<HTMLElement | null>;
  endRef: RefObject<HTMLElement | null>;
  messageCount: number;
  /** Mudanças que devem grudar no fim se o usuário já estiver perto (ex.: stream). */
  stickSignal?: number | string;
}) {
  const [showFab, setShowFab] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const stickToBottomRef = useRef(true);
  const prevCountRef = useRef(messageCount);
  const measuringRef = useRef(false);

  const scrollElementToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [endRef, scrollRef]);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      stickToBottomRef.current = true;
      setShowFab(false);
      setNewCount(0);
      return;
    }

    if (!hasOverflow(el)) {
      stickToBottomRef.current = true;
      setShowFab(false);
      setNewCount(0);
      return;
    }

    const distance = distanceFromBottom(el);
    const near = distance <= NEAR_BOTTOM_PX;
    stickToBottomRef.current = near;
    setShowFab(!near);
    if (near) setNewCount(0);
  }, [scrollRef]);

  const measureAfterLayout = useCallback(() => {
    if (measuringRef.current) return;
    measuringRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measuringRef.current = false;
        if (stickToBottomRef.current) {
          scrollElementToBottom();
        }
        measure();
      });
    });
  }, [measure, scrollElementToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    measure();
    el.addEventListener("scroll", measure, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        scrollElementToBottom();
      }
      measure();
    });
    resizeObserver.observe(el);
    if (el.firstElementChild) {
      resizeObserver.observe(el.firstElementChild);
    }

    return () => {
      el.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
    };
  }, [measure, scrollElementToBottom, scrollRef]);

  useEffect(() => {
    const prev = prevCountRef.current;
    const next = messageCount;
    prevCountRef.current = next;

    if (next <= prev) {
      measureAfterLayout();
      return;
    }

    if (stickToBottomRef.current) {
      scrollElementToBottom();
      setNewCount(0);
      setShowFab(false);
      measureAfterLayout();
      return;
    }

    setNewCount((count) => count + (next - prev));
    setShowFab(true);
  }, [messageCount, measureAfterLayout, scrollElementToBottom]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    scrollElementToBottom();
    setShowFab(false);
    setNewCount(0);
    measureAfterLayout();
  }, [stickSignal, measureAfterLayout, scrollElementToBottom]);

  const scrollToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    setNewCount(0);
    setShowFab(false);
    scrollElementToBottom();
    measureAfterLayout();
  }, [measureAfterLayout, scrollElementToBottom]);

  return {
    showFab,
    newCount,
    scrollToBottom,
  };
}
