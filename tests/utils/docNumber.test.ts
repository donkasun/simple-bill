import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/firebase/config", () => ({ db: {} }));

const getDocs = vi.fn();
const runTransaction = vi.fn();
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, _c, id) => ({ id })),
  where: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  getDocs: (...args: unknown[]) => getDocs(...args),
  runTransaction: (...args: unknown[]) => runTransaction(...args),
  serverTimestamp: vi.fn(() => "ts"),
}));

import {
  buildDocNumberPrefix,
  isDocNumberTaken,
  reconcileDocCounter,
  DuplicateDocNumberError,
} from "../../src/utils/docNumber";

describe("docNumber", () => {
  beforeEach(() => {
    getDocs.mockReset();
    runTransaction.mockReset();
  });

  it("buildDocNumberPrefix uses type and year", () => {
    expect(buildDocNumberPrefix("invoice", "2024-05-01")).toBe("INV-2024-");
    expect(buildDocNumberPrefix("quotation", "2023-12-31")).toBe("QUO-2023-");
  });

  describe("isDocNumberTaken", () => {
    it("returns true when another document already uses the number", async () => {
      getDocs.mockResolvedValue({ docs: [{ id: "other" }] });
      await expect(isDocNumberTaken("u1", "QUO-2026-001")).resolves.toBe(true);
    });

    it("returns false when the only match is the document being edited", async () => {
      getDocs.mockResolvedValue({ docs: [{ id: "self" }] });
      await expect(
        isDocNumberTaken("u1", "QUO-2026-001", "self"),
      ).resolves.toBe(false);
    });

    it("returns false when no document uses the number", async () => {
      getDocs.mockResolvedValue({ docs: [] });
      await expect(isDocNumberTaken("u1", "QUO-2026-001")).resolves.toBe(false);
    });
  });

  describe("reconcileDocCounter", () => {
    function fakeTx(currentSeq: number | undefined) {
      const set = vi.fn();
      const tx = {
        get: vi.fn().mockResolvedValue({
          exists: () => currentSeq !== undefined,
          data: () => ({ seq: currentSeq }),
        }),
        set,
      };
      return { tx, set };
    }

    it("advances the counter when a manual number exceeds the current seq", async () => {
      const { tx, set } = fakeTx(2);
      runTransaction.mockImplementation(
        async (_db: unknown, cb: (t: typeof tx) => Promise<void>) => cb(tx),
      );

      await reconcileDocCounter("u1", "QUO-2026-005");

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: "quotation", year: "2026", seq: 5 }),
        { merge: true },
      );
    });

    it("does not lower the counter when the manual number is below current seq", async () => {
      const { tx, set } = fakeTx(9);
      runTransaction.mockImplementation(
        async (_db: unknown, cb: (t: typeof tx) => Promise<void>) => cb(tx),
      );

      await reconcileDocCounter("u1", "QUO-2026-005");

      expect(set).not.toHaveBeenCalled();
    });

    it("ignores numbers that are not in the auto-number format", async () => {
      await reconcileDocCounter("u1", "my-custom-ref-42");
      expect(runTransaction).not.toHaveBeenCalled();
    });
  });

  it("DuplicateDocNumberError carries the offending number", () => {
    const err = new DuplicateDocNumberError("QUO-2026-001");
    expect(err).toBeInstanceOf(Error);
    expect(err.docNumber).toBe("QUO-2026-001");
  });
});
