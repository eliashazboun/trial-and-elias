import { it, expect } from "vitest";
import {
  initialState,
  applyCommand,
  legalActions,
  mockEnvironment,
  assertState,
} from "../src/engine/engine";
import { seeded } from "../src/engine/cards";
it("plays 500 reproducible rounds over every deck count with legal randomized actions", () => {
  for (const decks of [1, 2, 4, 6, 8] as const) {
    const rng = seeded(1290 + decks),
      env = mockEnvironment(rng);
    let s = initialState(env);
    s = applyCommand(
      s,
      { type: "rules", rules: { ...s.rules, decks, penetration: 0.9 } },
      env,
    );
    for (let n = 0; n < 100; n++) {
      if (s.round) s = applyCommand(s, { type: "next" }, env);
      if (n % 34 === 0)
        s = applyCommand(
          s,
          {
            type: "rules",
            rules: {
              ...s.rules,
              penetration: [0.5, 0.75, 0.9][Math.floor(n / 34)]!,
            },
          },
          env,
        );
      if (s.balance < 100) {
        env.now += 3600000;
        s = applyCommand(s, { type: "claim" }, env);
      }
      for (let p = 0; p < 1 + (n % 3); p++) {
        if (s.balance - (p + 1) * 20 < 0) break;
        s = applyCommand(
          s,
          { type: "chip", kind: "main", position: p, chip: 5 },
          env,
        );
        s = applyCommand(
          s,
          { type: "chip", kind: "main", position: p, chip: 5 },
          env,
        );
      }
      for (let position = 0; position < 3; position++) {
        if (s.bets[position]!.main.length && n % 2 === 0) {
          s = applyCommand(
            s,
            { type: "chip", position, kind: "pairs", chip: 1 },
            env,
          );
          if (n % 3 === 0)
            s = applyCommand(
              s,
              { type: "chip", position, kind: "three", chip: 1 },
              env,
            );
        }
      }
      s = applyCommand(s, { type: "deal" }, env);
      let guard = 0;
      while (s.round!.phase === "insurance" || s.round!.phase === "player") {
        if (++guard > 200)
          throw Error(`Unresolved seed ${1290 + decks}, round ${n}`);
        if (s.round!.phase === "insurance") {
          const p = s.round!.positions.find((p) => !p.insuranceChoice)!;
          s = applyCommand(
            s,
            {
              type: "insurance",
              position: p.index,
              choice: s.balance >= 10 && rng(3) === 0 ? "insurance" : "decline",
            },
            env,
          );
        } else {
          const options = legalActions(s);
          s = applyCommand(
            s,
            {
              type: "action",
              action: options[rng(options.length)]!,
              handId: s.round!.active!,
            },
            env,
          );
        }
        assertState(s);
      }
      expect(s.balance).toBeGreaterThanOrEqual(0);
      env.now += 1000;
    }
  }
}, 120000);
