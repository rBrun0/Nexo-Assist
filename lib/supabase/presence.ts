"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isRecord } from "@/lib/utils/is-record";

export type PresenceRole = "EMPLOYEE" | "ANALYST";

export type ConversationPresenceUser = {
  id: string;
  name: string;
  role: PresenceRole;
};

const ANALYST_LOBBY_CHANNEL = "presence:analysts";

function presenceChannelName(sessionId: string) {
  return `presence:session:${sessionId}`;
}

function parsePresenceUser(value: unknown): ConversationPresenceUser | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" ? value.id : null;
  const name = typeof value.name === "string" ? value.name : null;
  const role =
    value.role === "EMPLOYEE" || value.role === "ANALYST" ? value.role : null;
  if (!id || !name || !role) return null;
  return { id, name, role };
}

function usersFromPresenceState(
  state: Record<string, unknown[]>,
): ConversationPresenceUser[] {
  const byId = new Map<string, ConversationPresenceUser>();

  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      const user = parsePresenceUser(entry);
      if (user) byId.set(user.id, user);
    }
  }

  return [...byId.values()];
}

function bindPresenceChannel({
  channelName,
  presenceKey,
  trackUser,
  onSync,
  logLabel,
}: {
  channelName: string;
  presenceKey?: string;
  trackUser?: ConversationPresenceUser;
  onSync: (users: ConversationPresenceUser[]) => void;
  logLabel: string;
}): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    onSync([]);
    return () => undefined;
  }

  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  const syncFromChannel = (active: RealtimeChannel) => {
    if (cancelled) return;
    onSync(usersFromPresenceState(active.presenceState()));
  };

  channel = supabase.channel(
    channelName,
    presenceKey ? { config: { presence: { key: presenceKey } } } : undefined,
  );

  channel
    .on("presence", { event: "sync" }, () => {
      if (channel) syncFromChannel(channel);
    })
    .on("presence", { event: "join" }, () => {
      if (channel) syncFromChannel(channel);
    })
    .on("presence", { event: "leave" }, () => {
      if (channel) syncFromChannel(channel);
    })
    .subscribe(async (status) => {
      if (cancelled || !channel) return;
      if (status !== "SUBSCRIBED") return;

      if (!trackUser) {
        syncFromChannel(channel);
        return;
      }

      try {
        await channel.track({
          id: trackUser.id,
          name: trackUser.name,
          role: trackUser.role,
        });
        syncFromChannel(channel);
      } catch (error) {
        console.error(`Falha ao publicar presença (${logLabel}):`, {
          channelName,
          error,
        });
      }
    });

  return () => {
    cancelled = true;
    onSync([]);
    if (!channel) return;
    const active = channel;
    channel = null;
    void active.unsubscribe().catch((error: unknown) => {
      console.error(`Falha ao encerrar canal de presença (${logLabel}):`, {
        channelName,
        error,
      });
    });
  };
}

export function subscribeConversationPresence({
  sessionId,
  user,
  onSync,
}: {
  sessionId: string;
  user: ConversationPresenceUser;
  onSync: (users: ConversationPresenceUser[]) => void;
}): () => void {
  return bindPresenceChannel({
    channelName: presenceChannelName(sessionId),
    presenceKey: user.id,
    trackUser: user,
    onSync,
    logLabel: `session:${sessionId}`,
  });
}

/** Analista no console: publica presença no lobby público. */
export function subscribeAnalystPresence({
  user,
  onSync,
}: {
  user: ConversationPresenceUser;
  onSync: (users: ConversationPresenceUser[]) => void;
}): () => void {
  return bindPresenceChannel({
    channelName: ANALYST_LOBBY_CHANNEL,
    presenceKey: user.id,
    trackUser: { ...user, role: "ANALYST" },
    onSync,
    logLabel: "analyst-lobby",
  });
}

/** Login (e observadores): lê o lobby sem publicar presença. */
export function observeAnalystPresence({
  onSync,
}: {
  onSync: (users: ConversationPresenceUser[]) => void;
}): () => void {
  return bindPresenceChannel({
    channelName: ANALYST_LOBBY_CHANNEL,
    onSync,
    logLabel: "analyst-lobby-observe",
  });
}
