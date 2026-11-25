import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { Database } from "../src/storage/database";
import {
  initialState,
  applyCommand,
  mockEnvironment,
} from "../src/engine/engine";
import { seeded } from "../src/engine/cards";
import { validateState, parseBackup } from "../src/storage/validation";
import { csv } from "../src/storage/backup";
import { RewardLifecycle } from "../src/advertising/provider";
import { MockAdProvider } from "../src/advertising/mock";
it("atomic restore, revision checks and single-writer leases prevent double spending", async () => {
  const a = new Database(),
    b = new Database();
  expect(await a.acquire()).toBe(true);
  expect(await b.acquire()).toBe(false);
  const env = mockEnvironment(seeded(8), Date.now());
  const state = await a.load(env);
  const next = applyCommand(
    state,
    { type: "chip", position: 0, kind: "main", chip: 25 },
    env,
  );
  await a.save(next, state.revision);
  expect((await a.load(env)).bets[0]!.main).toEqual([25]);
  await expect(a.save(next, state.revision)).rejects.toThrow(
    "saved table changed",
  );
  await expect(b.save(next, next.revision)).rejects.toThrow("Another tab");
  await a.release();
  expect(await b.acquire()).toBe(true);
  expect((await b.load(env)).balance).toBe(2000);
  await b.release();
  a.close();
  b.close();
});
it("validates backups without replacing data and rejects negative/reconciled/corrupt state", () => {
  const state = initialState(mockEnvironment(seeded(1)));
  expect(validateState(state).balance).toBe(2000);
  expect(() => validateState({ ...state, balance: -1 })).toThrow();
  expect(() => validateState({ ...state, balance: 5000 })).toThrow();
  expect(() => parseBackup('{"schema":999}')).toThrow();
  expect(csv([{ name: '=HYPERLINK("x")', data: 'a,b"c' }])).toContain(
    "'=HYPERLINK",
  );
});
it("disabled, canceled and failed ad lifecycles never reward; legitimate completion is idempotent", async () => {
  const seen = new Set<string>();
  let balance = 0;
  const grant = async (event: string, request: string) => {
    if (seen.has(event) || seen.has(request)) return false;
    seen.add(event);
    seen.add(request);
    balance += 1000;
    return true;
  };
  for (const result of [
    { status: "closed" },
    { status: "unavailable" },
    { status: "error", message: "test" },
  ] as const) {
    await new RewardLifecycle(new MockAdProvider(result), grant).request(
      "x",
      true,
      true,
    );
  }
  expect(balance).toBe(0);
  const lifecycle = new RewardLifecycle(
    new MockAdProvider({ status: "rewarded", rewardEventId: "event" }),
    grant,
  );
  await lifecycle.request("request", true, true);
  await lifecycle.request("request", true, true);
  expect(balance).toBe(1000);
  await lifecycle.request("denied", false, true);
  await lifecycle.request("active", true, false);
  expect(balance).toBe(1000);
  const e = mockEnvironment(seeded(33));
  let state = initialState(e);
  const persisted = new RewardLifecycle(
    new MockAdProvider({
      status: "rewarded",
      rewardEventId: "real-mock-receipt",
    }),
    async (eventId, requestId) => {
      state = applyCommand(state, { type: "adReward", eventId, requestId }, e);
      return true;
    },
  );
  await persisted.request("request-two", true, true);
  expect(state.balance).toBe(3000);
  state = validateState(JSON.parse(JSON.stringify(state)));
  await persisted.request("request-two", true, true);
  expect(state.balance).toBe(3000);
});
it("advertisement initialization failures and provider timeouts never grant rewards", async () => {
  let rewards = 0;
  const broken = {
    initialize: async () => {
      throw Error("offline");
    },
    isAvailable: async () => true,
    showRewardedAd: async () => ({ status: "closed" }) as const,
    dispose: () => {},
  };
  expect(
    (
      await new RewardLifecycle(
        broken,
        async () => {
          rewards++;
          return true;
        },
        5,
      ).request("x", true, true)
    ).status,
  ).toBe("error");
  const hung = {
    ...broken,
    initialize: async () => {},
    showRewardedAd: () =>
      new Promise<import("../src/advertising/provider").RewardResult>(() => {}),
  };
  expect(
    (
      await new RewardLifecycle(
        hung,
        async () => {
          rewards++;
          return true;
        },
        5,
      ).request("y", true, true)
    ).status,
  ).toBe("error");
  expect(rewards).toBe(0);
});
