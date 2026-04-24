/**
 * eventbus.ts
 *
 * A simple in-process event bus for decoupling internal components.
 * Allows modules (alerting, notifier, incident, audit, etc.) to publish
 * and subscribe to named events without direct coupling.
 */

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventBusEntry<T = unknown> {
  event: string;
  handler: EventHandler<T>;
  once: boolean;
}

export interface EventBus {
  on<T>(event: string, handler: EventHandler<T>): void;
  once<T>(event: string, handler: EventHandler<T>): void;
  off(event: string, handler: EventHandler): void;
  emit<T>(event: string, payload: T): Promise<void>;
  listenerCount(event: string): number;
  eventNames(): string[];
  clear(event?: string): void;
}

/** Creates a new isolated event bus instance. */
export function createEventBus(): EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners = new Map<string, EventBusEntry<any>[]>();

  function getList(event: string) {
    if (!listeners.has(event)) listeners.set(event, []);
    return listeners.get(event)!;
  }

  function on<T>(event: string, handler: EventHandler<T>, once = false): void {
    getList(event).push({ event, handler, once });
  }

  async function emit<T>(event: string, payload: T): Promise<void> {
    const list = listeners.get(event);
    if (!list || list.length === 0) return;

    // Collect once-handlers to remove after iteration
    const toRemove: EventHandler[] = [];

    for (const entry of list) {
      try {
        await entry.handler(payload);
      } catch (err) {
        // Handlers should not crash the bus; log and continue
        console.error(`[eventbus] Error in handler for "${event}":`, err);
      }
      if (entry.once) toRemove.push(entry.handler);
    }

    for (const handler of toRemove) {
      off(event, handler);
    }
  }

  function off(event: string, handler: EventHandler): void {
    const list = listeners.get(event);
    if (!list) return;
    const updated = list.filter((e) => e.handler !== handler);
    if (updated.length === 0) {
      listeners.delete(event);
    } else {
      listeners.set(event, updated);
    }
  }

  function listenerCount(event: string): number {
    return listeners.get(event)?.length ?? 0;
  }

  function eventNames(): string[] {
    return Array.from(listeners.keys());
  }

  function clear(event?: string): void {
    if (event !== undefined) {
      listeners.delete(event);
    } else {
      listeners.clear();
    }
  }

  return {
    on: <T>(event: string, handler: EventHandler<T>) => on(event, handler, false),
    once: <T>(event: string, handler: EventHandler<T>) => on(event, handler, true),
    off,
    emit,
    listenerCount,
    eventNames,
    clear,
  };
}

/** Well-known event names used across endpointwatch modules. */
export const EventNames = {
  ALERT_TRIGGERED: "alert:triggered",
  ALERT_RESOLVED: "alert:resolved",
  INCIDENT_OPENED: "incident:opened",
  INCIDENT_RESOLVED: "incident:resolved",
  PROBE_COMPLETE: "probe:complete",
  CIRCUIT_OPENED: "circuit:opened",
  CIRCUIT_CLOSED: "circuit:closed",
  BUDGET_BREACHED: "budget:breached",
  SLA_BREACHED: "sla:breached",
  HEARTBEAT_MISSED: "heartbeat:missed",
  MAINTENANCE_STARTED: "maintenance:started",
  MAINTENANCE_ENDED: "maintenance:ended",
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];

/** Singleton bus for the default application lifecycle. */
export const globalBus: EventBus = createEventBus();
