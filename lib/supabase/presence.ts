"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isRecord } from "@/lib/utils/is-record";

export type PresenceRole = "EMPLOYEE" | "ANALYST";

export type ConversationPresenceUser = {
  id: string;
  name: string;
  role: PresenceRole;
  typing?: boolean;
};

export type ConversationPresenceSubscription = {
  unsubscribe: () => void;
  setTyping: (typing: boolean) => void;
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
  return {
    id,
    name,
    role,
    typing: value.typing === true,
  };
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

type HubConsumer = {
  onSync: (users: ConversationPresenceUser[]) => void;
  trackUser?: ConversationPresenceUser;
  typing: boolean;
};

type PresenceHub = {
  channel: RealtimeChannel;
  subscribed: boolean;
  consumers: Set<HubConsumer>;
  logLabel: string;
};

const hubs = new Map<string, PresenceHub>();

function emitHub(hub: PresenceHub) {
  const users = usersFromPresenceState(hub.channel.presenceState());
  for (const consumer of hub.consumers) {
    consumer.onSync(users);
  }
}

function trackPayloadFromHub(hub: PresenceHub) {
  for (const consumer of hub.consumers) {
    if (!consumer.trackUser) continue;
    return {
      id: consumer.trackUser.id,
      name: consumer.trackUser.name,
      role: consumer.trackUser.role,
      typing: consumer.typing,
    };
  }
  return null;
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
}): ConversationPresenceSubscription {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    onSync([]);
    return {
      unsubscribe: () => undefined,
      setTyping: () => undefined,
    };
  }

  const consumer: HubConsumer = {
    onSync,
    trackUser,
    typing: false,
  };

  let hub = hubs.get(channelName);
  if (!hub) {
    hub = createHub({
      supabase,
      channelName,
      presenceKey,
      logLabel,
    });
  }

  hub.consumers.add(consumer);

  if (hub.subscribed) {
    const payload = trackPayloadFromHub(hub);
    if (payload && trackUser) {
      void hub.channel.track(payload).catch((error: unknown) => {
        console.error(`Falha ao publicar presença (${logLabel}):`, {
          channelName,
          error,
        });
      });
    }
    emitHub(hub);
  }

  return {
    unsubscribe: () => {
      consumer.onSync([]);
      const current = hubs.get(channelName);
      if (!current) return;
      current.consumers.delete(consumer);
      if (current.consumers.size > 0) {
        const payload = trackPayloadFromHub(current);
        if (payload) {
          void current.channel.track(payload).catch((error: unknown) => {
            console.error(`Falha ao atualizar typing (${logLabel}):`, {
              channelName,
              error,
            });
          });
        }
        return;
      }

      hubs.delete(channelName);
      current.subscribed = false;
      void supabase.removeChannel(current.channel).catch((error: unknown) => {
        console.error(`Falha ao encerrar canal de presença (${logLabel}):`, {
          channelName,
          error,
        });
      });
    },
    setTyping: (nextTyping: boolean) => {
      if (!trackUser) return;
      if (consumer.typing === nextTyping) return;
      consumer.typing = nextTyping;
      const current = hubs.get(channelName);
      if (!current?.subscribed) return;
      const payload = trackPayloadFromHub(current);
      if (!payload) return;
      void current.channel.track(payload).catch((error: unknown) => {
        console.error(`Falha ao atualizar typing (${logLabel}):`, {
          channelName,
          error,
        });
      });
    },
  };
}

function createHub({
  supabase,
  channelName,
  presenceKey,
  logLabel,
}: {
  supabase: SupabaseClient;
  channelName: string;
  presenceKey?: string;
  logLabel: string;
}): PresenceHub {
  const channel = supabase.channel(
    channelName,
    presenceKey ? { config: { presence: { key: presenceKey } } } : undefined,
  );

  const hub: PresenceHub = {
    channel,
    subscribed: false,
    consumers: new Set(),
    logLabel,
  };
  hubs.set(channelName, hub);

  channel
    .on("presence", { event: "sync" }, () => {
      const current = hubs.get(channelName);
      if (current?.channel === channel) emitHub(current);
    })
    .on("presence", { event: "join" }, () => {
      const current = hubs.get(channelName);
      if (current?.channel === channel) emitHub(current);
    })
    .on("presence", { event: "leave" }, () => {
      const current = hubs.get(channelName);
      if (current?.channel === channel) emitHub(current);
    })
    .subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      const current = hubs.get(channelName);
      if (!current || current.channel !== channel) return;
      current.subscribed = true;
      const payload = trackPayloadFromHub(current);
      if (payload) {
        try {
          await channel.track(payload);
        } catch (error) {
          console.error(`Falha ao publicar presença (${logLabel}):`, {
            channelName,
            error,
          });
        }
      }
      emitHub(current);
    });

  return hub;
}

export function subscribeConversationPresence({
  sessionId,
  user,
  onSync,
}: {
  sessionId: string;
  user: ConversationPresenceUser;
  onSync: (users: ConversationPresenceUser[]) => void;
}): ConversationPresenceSubscription {
  return bindPresenceChannel({
    channelName: presenceChannelName(sessionId),
    presenceKey: user.id,
    trackUser: user,
    onSync,
    logLabel: `session:${sessionId}`,
  });
}

/** Observa presença da sessão sem publicar (fila do analista). */
export function observeConversationPresence({
  sessionId,
  onSync,
}: {
  sessionId: string;
  onSync: (users: ConversationPresenceUser[]) => void;
}): () => void {
  return bindPresenceChannel({
    channelName: presenceChannelName(sessionId),
    onSync,
    logLabel: `session-observe:${sessionId}`,
  }).unsubscribe;
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
  }).unsubscribe;
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
  }).unsubscribe;
}
