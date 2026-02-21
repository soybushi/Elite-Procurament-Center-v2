import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock idbStorage before any store modules are imported.
// localforage has no IndexedDB/localStorage in the Node test environment;
// this prevents unhandled promise rejections from the persist middleware.
vi.mock('../../infra/idbStorage', () => ({
  idbStorage: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  },
}));

import { setActor, clearActor } from '../../stores/authStore';
import { transitionPurchaseRequestStatus } from '../purchaseRequestService';
import { purchaseRequestStore } from '../purchaseRequestStore';
import type { PurchaseRequest } from '../../types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const COMPANY_ID = 'company-test' as unknown as import('../../core/tenancy/company').CompanyId;

function makeActor(role: string) {
  return { userId: 'user-test', role, companyId: COMPANY_ID };
}

function makePR(
  id = 'REQ-TEST-G1',
  status: PurchaseRequest['status'] = 'submitted',
): PurchaseRequest {
  return {
    id,
    companyId: COMPANY_ID as unknown as string,
    warehouseId: 'WH-001',
    status,
    createdAt: new Date().toISOString(),
    createdBy: 'user-test',
    version: 1,
    items: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Test suite — G1 closure: under_review policy enforcement          */
/* ------------------------------------------------------------------ */

describe('transitionPurchaseRequestStatus — under_review assertCan (G1)', () => {
  beforeEach(() => {
    purchaseRequestStore.reset();
  });

  afterEach(() => {
    clearActor();
    purchaseRequestStore.reset();
  });

  it('viewer (no PR_UPDATE) → under_review → throws POLICY_DENY:PR_UPDATE', () => {
    setActor(makeActor('viewer'));
    const pr = makePR();

    expect(() =>
      transitionPurchaseRequestStatus(pr, 'submitted', 'under_review', 'user-test'),
    ).toThrow('POLICY_DENY:PR_UPDATE');
  });

  it('admin (PR_UPDATE=true) → under_review → passes policy, returns updated request', () => {
    setActor(makeActor('admin'));
    const pr = makePR();
    purchaseRequestStore.addRequest(pr);

    const result = transitionPurchaseRequestStatus(pr, 'submitted', 'under_review', 'user-test');

    expect(result.status).toBe('under_review');
    expect(result.version).toBeGreaterThan(pr.version);
  });

  it('procurement (PR_UPDATE=true) → under_review → passes policy enforcement', () => {
    setActor(makeActor('procurement'));
    const pr = makePR('REQ-TEST-G1-PROC');
    purchaseRequestStore.addRequest(pr);

    const result = transitionPurchaseRequestStatus(pr, 'submitted', 'under_review', 'user-test');

    expect(result.status).toBe('under_review');
  });

  it('viewer → submitted → throws POLICY_DENY:PR_SUBMIT (existing checks unaffected)', () => {
    setActor(makeActor('viewer'));
    const pr = makePR('REQ-TEST-G1-V2', 'draft');

    expect(() =>
      transitionPurchaseRequestStatus(pr, 'draft', 'submitted', 'user-test'),
    ).toThrow('POLICY_DENY:PR_SUBMIT');
  });
});
