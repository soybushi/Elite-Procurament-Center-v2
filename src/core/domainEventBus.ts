/* ------------------------------------------------------------------ */
/*  Domain Event Bus — Minimal in-memory pub/sub                      */
/*  Infrastructure only; no external deps, no persistence.            */
/* ------------------------------------------------------------------ */

import type { DomainEvent, DomainEventHandler } from './domainEvents';

const handlers: DomainEventHandler[] = [];

/** Dispatch an event to all registered handlers. */
export function publish(event: DomainEvent): void {
  for (const handler of handlers) {
    handler(event);
  }
}

/**
 * Register a handler that will be called on every published event.
 * Returns an unsubscribe function.
 */
export function subscribe(handler: DomainEventHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}
