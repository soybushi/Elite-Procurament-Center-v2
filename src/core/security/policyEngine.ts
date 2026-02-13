/* ------------------------------------------------------------------ */
/*  Policy Engine — Role-based access control                         */
/*  Pure functions. No store mutations. No service calls.             */
/* ------------------------------------------------------------------ */

import type { Action } from './actions';
import type { Role } from './roles';
import type { CompanyId } from '../tenancy/company';

/* ------------------------------------------------------------------ */
/*  Actor                                                             */
/* ------------------------------------------------------------------ */

export interface Actor {
  userId: string;
  role: Role;
  companyId: CompanyId;
}

/* ------------------------------------------------------------------ */
/*  Policy matrix                                                     */
/* ------------------------------------------------------------------ */

const POLICY: Record<Role, Partial<Record<Action, boolean>>> = {
  admin: {
    PR_CREATE: true,
    PR_UPDATE: true,
    PR_SUBMIT: true,
    PR_APPROVE: true,
    PR_REJECT: true,
    PR_CONVERT_TO_PO: true,
    LEDGER_MOVE_IN: true,
    LEDGER_MOVE_OUT: true,
    LEDGER_ADJUST: true,
    PO_CREATE: true,
    PO_EDIT: true,
    AI_READ: true,
    AI_PROPOSE: true,
    AI_EXECUTE: true,
  },

  procurement: {
    PR_CREATE: true,
    PR_UPDATE: true,
    PR_SUBMIT: true,
    PR_APPROVE: true,
    PR_REJECT: true,
    PR_CONVERT_TO_PO: true,
    LEDGER_MOVE_IN: true,
    LEDGER_MOVE_OUT: true,
    LEDGER_ADJUST: false,
    PO_CREATE: true,
    PO_EDIT: true,
    AI_READ: true,
    AI_PROPOSE: true,
    AI_EXECUTE: false,
  },

  manager: {
    PR_CREATE: true,
    PR_UPDATE: true,
    PR_SUBMIT: true,
    PR_APPROVE: false,
    PR_REJECT: false,
    PR_CONVERT_TO_PO: false,
    LEDGER_MOVE_IN: false,
    LEDGER_MOVE_OUT: false,
    LEDGER_ADJUST: false,
    PO_CREATE: false,
    PO_EDIT: false,
    AI_READ: true,
    AI_PROPOSE: true,
    AI_EXECUTE: false,
  },

  supervisor_hardgoods: {
    PR_CREATE: true,
    PR_UPDATE: true,
    PR_SUBMIT: true,
    PR_APPROVE: false,
    PR_REJECT: false,
    PR_CONVERT_TO_PO: false,
    LEDGER_MOVE_IN: false,
    LEDGER_MOVE_OUT: false,
    LEDGER_ADJUST: false,
    PO_CREATE: false,
    PO_EDIT: false,
    AI_READ: true,
    AI_PROPOSE: true,
    AI_EXECUTE: false,
  },

  viewer: {
    PR_CREATE: false,
    PR_UPDATE: false,
    PR_SUBMIT: false,
    PR_APPROVE: false,
    PR_REJECT: false,
    PR_CONVERT_TO_PO: false,
    LEDGER_MOVE_IN: false,
    LEDGER_MOVE_OUT: false,
    LEDGER_ADJUST: false,
    PO_CREATE: false,
    PO_EDIT: false,
    AI_READ: true,
    AI_PROPOSE: false,
    AI_EXECUTE: false,
  },
};

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Returns true if the actor's role permits the given action. */
export function can(actor: Actor, action: Action): boolean {
  return POLICY[actor.role]?.[action] === true;
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
