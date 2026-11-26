import { expect } from "@playwright/test";
import {
  initialState,
  mockEnvironment,
  applyCommand,
} from "../../apps/blackjack-trainer/src/engine/engine";
import { seeded } from "../../apps/blackjack-trainer/src/engine/cards";
import { defaults } from "../../apps/blackjack-trainer/src/config/preferences";
import type {
  GameState,
  Rank,
  Card,
} from "../../apps/blackjack-trainer/src/engine/types";
const URL = "/blackjack-trainer/",
  DB = "trial-and-elias:blackjack:v1",
  PREF = "trial-and-elias:blackjack:preferences:v1";
export function fixture(
  order: Rank[] = ["8", "6", "8", "10", "3", "2", "4", "5", "9"],
) {
  const env = mockEnvironment(seeded(37), Date.now());
  let state = initialState(env);
  const chosen: Card[] = [];
  for (const rank of order)
    chosen.push(
      state.shoe.cards.find(
        (c) => c.rank === rank && !chosen.some((x) => x.id === c.id),
      )!,
    );
  state.shoe.cards = [
    ...chosen,
    ...state.shoe.cards.filter((c) => !chosen.some((x) => x.id === c.id)),
  ];
  return {
    env,
    state,
    apply: (s: GameState, c: Parameters<typeof applyCommand>[1]) =>
      applyCommand(s, c, env),
  };
}
export async function install(
  page: import("@playwright/test").Page,
  state: GameState,
  options = {},
) {
  await page.goto("/");
  await page.evaluate(
    async ({ state, options, db, pref, defaults }) => {
      localStorage.setItem(
        pref,
        JSON.stringify({
          ...defaults,
          onboarded: true,
          speed: "instant",
          ...options,
        }),
      );
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(db, 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("state");
          req.result.createObjectStore("ownership");
        };
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const database = req.result,
            tx = database.transaction("state", "readwrite");
          tx.objectStore("state").put(state, "current");
          tx.oncomplete = () => {
            database.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { state, options, db: DB, pref: PREF, defaults },
  );
  await page.goto(URL);
  await expect(
    page.getByRole("heading", { name: "Blackjack Trainer", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".table-canvas canvas")).toHaveCount(1);
}
export async function snapshot(page: import("@playwright/test").Page) {
  return page.evaluate(
    async (db) =>
      new Promise<GameState>((resolve, reject) => {
        const r = indexedDB.open(db, 1);
        r.onsuccess = () => {
          const database = r.result,
            req = database
              .transaction("state")
              .objectStore("state")
              .get("current");
          req.onsuccess = () => {
            database.close();
            resolve(req.result);
          };
          req.onerror = () => reject(req.error);
        };
      }),
    DB,
  );
}
export const errors = (page: import("@playwright/test").Page) => {
  const all: string[] = [];
  page.on("pageerror", (e) => all.push(e.message));
  return all;
};
