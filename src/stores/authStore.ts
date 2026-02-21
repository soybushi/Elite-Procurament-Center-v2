/* ------------------------------------------------------------------ */
/*  Auth Store — Minimal actor holder for policy enforcement          */
/*  No Zustand. No UI integration. Pure module state.                 */
/* ------------------------------------------------------------------ */

import type { Actor } from '../core/security/policyEngine';

/* ------------------------------------------------------------------ */
/*  Internal state                                                    */
/* ------------------------------------------------------------------ */

let currentActor: Actor | null = null;

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Set the current actor for policy enforcement. */
export function setActor(actor: Actor): void {
  currentActor = actor;
}

/** Clear the current actor (logout). */
export function clearActor(): void {
  currentActor = null;
}

/**
 * Returns the current actor.
 * Throws if no actor is set — callers must NOT catch this error.
 */
export function getActor(): Actor {
  if (currentActor === null) {
    throw new Error('ACTOR_REQUIRED');
  }
  return currentActor;
}
