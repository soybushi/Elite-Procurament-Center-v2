/* ------------------------------------------------------------------ */
/*  Policy Engine — Role-based access control                         */
/*  Pure functions. No store mutations. No service calls.             */
/* ------------------------------------------------------------------ */

import type { Action } from './actions';
import type { CompanyId } from '../tenancy/company';
import { POLICY_PRESETS } from '../../config/policyPresets';

/* ------------------------------------------------------------------ */
/*  Actor                                                             */
/* ------------------------------------------------------------------ */

export interface Actor {
  userId: string;
  role: string;
  companyId: CompanyId;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Returns true if the actor's role permits the given action. */
export function can(actor: Actor, action: Action): boolean {
  const preset = POLICY_PRESETS[actor.role];
  if (!preset) return false;
  return preset[action] === true;
}

/**
 * Throws if the actor's role does not permit the given action.
 * Error message format: "POLICY_DENY:<action>"
 */
export function assertCan(actor: Actor, action: Action): void {
  if (!can(actor, action)) {
    throw new Error(`POLICY_DENY:${action}`);
  }
}
