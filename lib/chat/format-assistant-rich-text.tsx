import type { ReactNode } from "react";

import {
  CATEGORY_LABELS,
  PRIORITY_SHORT_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
} from "@/lib/constants";

const ENUM_DISPLAY_LABELS: Record<string, string> = {
  ...PRIORITY_SHORT_LABELS,
  ...TICKET_STATUS_LABELS,
  ...CATEGORY_LABELS,
  ...TICKET_TYPE_LABELS,
  OVERDUE: "Vencido",
  ABERTO: "Aberto",
};

function sanitizeAssistantEnums(text: string): string {
  return text.replace(
    /\b(CRITICAL|HIGH|MEDIUM|LOW|OPEN|IN_PROGRESS|WAITING_ANALYST|APPROVED|RESOLVED|CLOSED|ACCESS|NETWORK_VPN|HARDWARE|SOFTWARE|EMAIL|OTHER|INCIDENT|REQUEST|OVERDUE)\b/gi,
    (match) => ENUM_DISPLAY_LABELS[match.toUpperCase()] ?? match,
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // **negrito** ou *ênfase* (asterisco simples, sem virar lista).
  const pattern = /\*\*(.+?)\*\*|\*(?!\*)([^*]+?)\*(?!\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const emphasized = match[1] ?? match[2] ?? "";
    parts.push(
      <strong
        key={`${keyPrefix}-b-${index}`}
        className="font-semibold text-slate-800"
      >
        {emphasized}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  let rest = text.slice(lastIndex);

  // Stream incompleto: `**texto` sem fechar — destaca e esconde o marcador aberto.
  const incompleteDouble = /^(.*?)\*\*([^*]*)$/.exec(rest);
  if (incompleteDouble) {
    if (incompleteDouble[1]) parts.push(incompleteDouble[1]);
    if (incompleteDouble[2]) {
      parts.push(
        <strong
          key={`${keyPrefix}-b-open`}
          className="font-semibold text-slate-800"
        >
          {incompleteDouble[2]}
        </strong>,
      );
    }
    return parts;
  }

  if (rest) parts.push(rest);
  return parts;
}

function isListItem(line: string) {
  return /^\s*(?:[-*]|\d+\.)\s+/.test(line);
}

function listItemText(line: string) {
  return line.replace(/^\s*(?:[-*]|\d+\.)\s+/, "");
}

export function formatAssistantRichText(content: string): ReactNode {
  const normalized = sanitizeAssistantEnums(content.replace(/\r\n/g, "\n"));
  const lines = normalized.split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let blockIndex = 0;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = paragraph.join("\n");
    blocks.push(
      <p key={`p-${blockIndex}`} className="whitespace-pre-wrap">
        {renderInline(text, `p-${blockIndex}`)}
      </p>,
    );
    blockIndex += 1;
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${blockIndex}`} className="list-disc space-y-1 pl-5">
        {list.map((item, itemIndex) => (
          <li key={`li-${blockIndex}-${itemIndex}`}>
            {renderInline(item, `li-${blockIndex}-${itemIndex}`)}
          </li>
        ))}
      </ul>,
    );
    blockIndex += 1;
    list = [];
  }

  for (const line of lines) {
    if (isListItem(line)) {
      flushParagraph();
      list.push(listItemText(line));
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return <div className="space-y-2 text-[14.5px] leading-6">{blocks}</div>;
}
