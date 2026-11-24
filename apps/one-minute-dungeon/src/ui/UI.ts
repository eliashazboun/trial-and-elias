import { CosmeticPreviews, PREVIEW_SIZE } from "./CosmeticPreviews";
import {
  COSMETIC_GROUPS,
  availableCosmetic,
  findCosmetic,
} from "./CosmeticsCatalog";
import { C, VERSION, WEAPONS } from "../game/config";
import {
  rankedTicks,
  remainingTicks,
  enemiesRemaining,
} from "../game/systems/TimerSystem";
import { currentRecord, comparableSplits } from "../game/systems/RunManager";
import { compatibility } from "../game/systems/ReplaySystem";
import { SWITCHES } from "../game/maps/dungeon01";
import { distance } from "../game/systems/CollisionSystem";
import {
  ACHIEVEMENTS,
  ACTIONS,
  DEFAULT_SETTINGS,
  emptyTotals,
  recordKey,
  type Action,
} from "../storage/schemas";
import type { RunRecord } from "../game/types";
import type { DungeonGame } from "../game/Game";
export const time = (ticks: number): string => (ticks / C.hz).toFixed(2);
const esc = (value: unknown): string =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const keyName = (code: string): string =>
  code
    .replace("Key", "")
    .replace("Digit", "")
    .replace("Mouse0", "LMB")
    .replace("Mouse2", "RMB")
    .replace("Mouse1", "MMB")
    .replace("Arrow", "");
const actionNames: Record<Action, string> = {
  up: "Move up",
  down: "Move down",
  left: "Move left",
  right: "Move right",
  attack: "Sword attack",
  dash: "Dash",
  interact: "Interact",
  restart: "Instant restart",
  pause: "Pause",
  ghost: "Toggle ghost",
  splits: "Toggle splits",
};
const button = (label: string, action: string, extra = ""): string =>
  `<button data-action="${action}" ${extra}>${label}</button>`;
export class UI {
  performanceVisible = false;
  private appearancePreviews?: CosmeticPreviews;
  private closePreviews(): void {
    this.appearancePreviews?.dispose();
    this.appearancePreviews = undefined;
  }
  private sidebarLeft = false;
  private binding?: Action;
  private toastUntil = 0;
  private toastText = "";
  private confirmedReset = false;
  constructor(
    private readonly game: DungeonGame,
    private readonly root: HTMLElement,
  ) {
    root.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action]",
      );
      if (target) this.click(target.dataset.action!, target);
    });
    root.addEventListener("input", (e) =>
      this.change(e.target as HTMLInputElement),
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.binding) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        this.bind(e.code);
      },
      true,
    );
    root.addEventListener("pointerdown", (e) => {
      if (!this.binding) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-action="binding"]')) return;
      e.preventDefault();
      this.bind(`Mouse${e.button}`);
    });
  }
  private get store() {
    return this.game.storage;
  }
  private get settings() {
    return this.store.data.settings;
  }
  menu(): void {
    this.closePreviews();
    const best = this.store.best();
    this.root.innerHTML = `<main class="menu-shell"><header class="brand"><span class="brand-mark">◈</span> OMD <span class="edition">THE FORGOTTEN CRYPT</span><a class="site-return" href="/#projects">← Trial &amp; Elias</a><span class="local-tag"><i></i> LOCAL / OFFLINE</span></header><div class="hero"><section class="hero-copy"><div class="eyebrow"><span></span> ONE LIFE. MAKE EVERY SECOND COUNT.</div><h1>ONE MINUTE<br><em>DUNGEON</em><span class="title-dot">.</span></h1><p class="intro">The crypt remembers every mistake.<br>Chain diamonds. Clear the crypt. Beat your best time.</p><div class="hero-actions">${button("Enter the crypt <span>↗</span>", "play", 'class="primary large"')}</div><div class="best-card"><span>PERSONAL BEST / RANKED TIME</span><strong>${best ? time(best.rankedTicks) + "<small>s</small>" : "— <small>your legend starts here</small>"}</strong><span>ONE KEY <b>·</b> THREE SEALS <b>·</b> ONE WAY OUT</span></div></section><section class="crypt-card" aria-label="Dungeon briefing"><div class="card-top"><span>01 / THE FORGOTTEN CRYPT</span><span>120 HZ</span></div><div class="crypt-emblem"><span class="outer-ring"></span><span class="inner-ring"></span><span class="sword-emblem">✧</span><span class="emblem-time">60</span><span class="emblem-caption">SECONDS ON THE CLOCK</span></div><div class="briefing"><div><b>01</b><span>Key + three seals. Diamonds refund time.</span><i>◇</i></div><div><b>02</b><span>Slay every mob to release the guardian.</span><i>⊕</i></div><div><b>03</b><span>Striking its shield is fatal. Then escape.</span><i>↗</i></div></div><div class="card-bottom">SIX DIAMONDS <span>·</span> CHAIN WITHIN 5s FOR +1, +2…</div></section></div><nav class="menu-nav">${button("Statistics", "stats")}${button("Achievements", "achievements")}${button("Cosmetics", "cosmetics")}${button("Replays", "replays")}${button("Settings", "settings")}</nav><footer><span><kbd>WASD</kbd> Move <kbd>LMB</kbd> Attack <kbd>SPACE</kbd> Dash <kbd>E</kbd> Interact</span><span><span class="profile-title">${esc(this.settings.title)}</span> <b>·</b> v${VERSION.game} <b>·</b> INSTANT RETRIES.</span></footer>${this.warning()}</main><div id="toast" role="status"></div>`;
  }
  private warning(): string {
    return this.store.warning
      ? `<p class="storage-warning" role="status">${esc(this.store.warning)}</p>`
      : "";
  }
  private shell(title: string, sub: string, body: string): void {
    this.closePreviews();
    this.root.innerHTML = `<main class="panel-shell"><header><div><span class="eyebrow">ONE MINUTE DUNGEON</span><h2>${title}</h2><p>${sub}</p></div>${button("← Back", "back", 'class="secondary"')}</header>${body}${this.warning()}</main><div id="toast" role="status"></div>`;
  }
  gameplay(): void {
    this.closePreviews();
    this.root.innerHTML = `<div class="hud"><div class="hud-top"><div class="run-label"><span>THE FORGOTTEN CRYPT</span><b id="room"></b><small id="seed"></small><div id="diamond-hud"></div></div><div class="clock"><span>TIME REMAINING</span><strong id="countdown">60.00</strong><div class="time-details"><small id="elapsed">0.00 ACTUAL</small><small id="ranked">0.00 RANKED</small></div><small id="refund-total">0.00s REFUNDED</small></div><div class="objective-list" id="objectives"></div></div><aside class="run-sidebar"><canvas id="minimap" width="177" height="135" aria-label="Dungeon map"></canvas><div class="map-legend">◆ KEY <span>＋ SEALS</span> ▪ YOU</div><div id="splits"></div><div id="ghost-status"></div></aside><div id="boss-warning" class="boss-warning"></div><div id="interaction" class="interaction"></div><div class="hud-bottom"><div><span id="weapon"></span><div class="dash"><span id="dash-label"></span><div><i id="dash-fill"></i></div></div></div><span class="hud-controls">${esc(keyName(this.settings.bindings.restart))} RESTART <b>·</b> ${esc(keyName(this.settings.bindings.pause))} PAUSE</span><span id="validity"></span></div><div id="performance" hidden></div></div><div id="overlay"></div><div id="toast" role="status"></div>`;
    this.updateHUD();
  }
  updateHUD(): void {
    const s = this.game.sim.state;
    const set = (id: string, text: string) => {
      const node = this.root.querySelector<HTMLElement>("#" + id);
      if (node) node.textContent = text;
    };
    set("room", this.game.scene?.dungeonView.room ?? "The Forgotten Crypt");
    set(
      "seed",
      "SEED " +
        this.game.sim.options.seed.toString(16).toUpperCase().padStart(8, "0"),
    );
    set("countdown", time(remainingTicks(s)));
    set("elapsed", time(s.tick) + " ACTUAL");
    set("ranked", time(rankedTicks(s)) + " RANKED");
    set("refund-total", time(s.refundTicks) + "s REFUNDED");
    this.root
      .querySelector("#countdown")
      ?.classList.toggle("urgent", remainingTicks(s) <= 10 * C.hz);
    const comboLeft =
      s.combo > 0
        ? Math.max(0, C.comboTicks - (s.tick - s.lastDiamondTick))
        : 0;
    set(
      "diamond-hud",
      "◆ DIAMONDS " +
        s.lootCount +
        " / " +
        C.diamondCount +
        " · " +
        (s.combo > 0
          ? "COMBO ×" + s.combo + " / " + (comboLeft / C.hz).toFixed(1) + "s"
          : "NEXT +1s · CHAIN WITHIN 5s"),
    );
    const remaining = enemiesRemaining(s),
      objectives = this.root.querySelector("#objectives");
    if (objectives)
      objectives.innerHTML = `<span class="${s.hasKey ? "done" : ""}">${s.hasKey ? "✓" : "◇"} Golden key</span><span class="${s.switches.every(Boolean) ? "done" : ""}">${s.switches.every(Boolean) ? "✓" : "⊕"} Seals ${s.switches.filter(Boolean).length} / 3</span><span class="${!s.bossShielded ? "done" : ""}">${s.bossShielded ? "⬡ SHIELDED · Enemies remaining: " + remaining : "✓ Guardian shield released"}</span><span class="${s.gateOpen ? "done" : ""}">${s.gateOpen ? "↗ EXIT OPEN" : "▣ Exit locked"}</span>`;
    const guardian = s.enemies.find((e) => e.kind === "guardian" && e.hp > 0);
    set(
      "boss-warning",
      guardian && s.bossShielded && distance(s.player, guardian) < 220
        ? "SLAY ALL OTHER ENEMIES FIRST · " +
            remaining +
            " REMAIN · STRIKING THE SHIELD IS FATAL"
        : "",
    );
    set("weapon", WEAPONS[s.player.weapon].name.toUpperCase());
    const ready = Math.max(0, s.player.dashReady - s.tick);
    set(
      "dash-label",
      ready
        ? "DASH " + (ready / C.hz).toFixed(1) + "s"
        : keyName(this.settings.bindings.dash) + " / DASH READY",
    );
    const fill = this.root.querySelector<HTMLElement>("#dash-fill");
    if (fill)
      fill.style.width = Math.max(0, 1 - ready / C.dashCooldown) * 100 + "%";
    set("validity", s.valid ? "COMPETITIVE" : "PRACTICE / RECORD INELIGIBLE");
    const sidebar = this.root.querySelector<HTMLElement>(".run-sidebar"),
      camera = this.game.scene?.cameras.main;
    if (sidebar && camera) {
      const x = (s.player.x - camera.worldView.x) * camera.zoom;
      if (x > this.game.phaser.scale.width - 260) this.sidebarLeft = true;
      else if (x < this.game.phaser.scale.width - 340) this.sidebarLeft = false;
      sidebar.style.left = this.sidebarLeft ? "22px" : "auto";
      sidebar.style.right = this.sidebarLeft ? "auto" : "22px";
    }
    const canvas = this.root.querySelector<HTMLCanvasElement>("#minimap");
    if (canvas) this.game.scene?.dungeonView.minimap(canvas, this.game.sim);
    const splits = this.root.querySelector<HTMLElement>("#splits");
    if (splits) {
      splits.hidden = !this.settings.splits;
      const pb = this.store.best();
      splits.innerHTML =
        "<h3>RANKED OBJECTIVE SPLITS</h3>" +
        s.splits
          .map((split, i) => {
            const reference = pb?.splits.find((x) => x.id === split.id),
              comparable = pb && comparableSplits(s.splits, pb.splits, i);
            const diff = reference
              ? split.rankedTicks - reference.rankedTicks
              : 0;
            return `<div class="split-row" title="Actual ${time(split.tick)}s · Refund ${time(split.refundTicks)}s"><span>${esc(split.id.replace("switch-", "Seal "))}</span><b>${time(split.rankedTicks)}</b><small class="${diff <= 0 ? "ahead" : "behind"}">${reference ? (comparable ? (diff === 0 ? "=" : (diff < 0 ? "−" : "+") + time(Math.abs(diff))) : "route differs") : "—"}</small></div>`;
          })
          .join("") +
        '<p class="muted">Ranked PB ' +
        (pb ? time(pb.rankedTicks) + "s" : "—") +
        "</p>";
    }
    set(
      "ghost-status",
      this.game.mode === "replay"
        ? "PB REPLAY · ACTUAL-TIME PLAYBACK"
        : (this.settings.ghost ? "GHOST ON" : "GHOST OFF") +
            " · " +
            this.game.ghostMessage,
    );
    let prompt = "";
    SWITCHES.forEach((point, i) => {
      if (!s.switches[i] && distance(s.player, point) < C.interactionRange)
        prompt =
          i === 2 && guardian
            ? "Defeat the guardian to release this seal"
            : keyName(this.settings.bindings.interact) +
              " — Activate seal " +
              (i + 1);
    });
    set("interaction", prompt);
    if (this.game.mode === "replay") this.updateReplay();
    set("toast", performance.now() < this.toastUntil ? this.toastText : "");
  }
  pause(): void {
    this.gameplay();
    this.root.querySelector("#overlay")!.innerHTML =
      `<section class="modal"><span class="eyebrow">TAKE A BREATH</span><h2>Run paused.</h2><p>The clock and dungeon are frozen. This run is now practice and cannot set a competitive personal best.</p>${button("Resume run", "resume", 'class="primary"')}${button("Restart / R", "restart")}${button("Settings", "settings")}${button("Return to menu", "menu")}</section>`;
  }
  results(
    record: RunRecord,
    result: { pb: boolean; previous?: RunRecord; unlocked: string[] },
  ): void {
    this.gameplay();
    const overlay = this.root.querySelector("#overlay")!;
    const breakdown = `<div class="time-breakdown"><span>Actual elapsed <b id="result-actual">${time(record.ticks)}s</b></span><span>Diamond refunds <b id="result-refunds">−${time(record.refundTicks)}s</b></span><span>Ranked time <b id="result-ranked">${time(record.rankedTicks)}s</b></span></div>`;
    if (!record.won) {
      overlay.innerHTML = `<section class="failure"><span class="eyebrow">THE CRYPT CLAIMED ANOTHER</span><h2>${esc(record.cause)}</h2>${breakdown}<p>${record.kills} enemies · ${record.loot}/6 diamonds · best combo ×${record.maxCombo}</p>${button("Retry / " + esc(keyName(this.settings.bindings.restart)), "restart", 'class="primary"')}${button("Return to menu", "menu")}</section>`;
      return;
    }
    const diff = result.previous
      ? record.rankedTicks - result.previous.rankedTicks
      : null;
    overlay.innerHTML = `<section class="modal results"><span class="eyebrow">${result.pb ? "NEW PERSONAL BEST" : record.valid ? "SUCCESSFUL ESCAPE" : "PRACTICE COMPLETE"}</span><h2>The crypt releases you.</h2><div class="result-time">${time(record.rankedTicks)}<small>s ranked</small></div>${breakdown}<p>${diff === null ? "Your first escape under these rules." : (diff === 0 ? "Same ranked time" : (diff < 0 ? "−" : "+") + time(Math.abs(diff)) + "s") + " vs previous ranked PB (" + time(result.previous!.rankedTicks) + "s, " + time(result.previous!.ticks) + "s actual)"}</p><div class="result-stats"><span><b>${record.kills}</b> KILLS</span><span><b>${record.loot}/6</b> DIAMONDS</span><span><b>×${record.maxCombo}</b> BEST COMBO</span></div><div class="result-splits">${record.splits.map((split) => `<span>${esc(split.id)} <b>${time(split.rankedTicks)} ranked</b></span>`).join("")}</div>${result.unlocked.length ? '<p class="ahead">Unlocked: ' + result.unlocked.map((id) => esc(ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id)).join(", ") + "</p>" : ""}${record.reasons.length ? '<p class="muted">' + esc(record.reasons.join(" · ")) + "</p>" : ""}${button("Run it again / " + esc(keyName(this.settings.bindings.restart)), "restart", 'class="primary"')}${button("Watch personal best", "watch-current")}${button("Return to menu", "menu")}</section>`;
  }
  private stats(): void {
    const d = this.store.data,
      key = recordKey("fixed", "standard"),
      t = d.categories[key] ?? emptyTotals(),
      pb = this.store.best();
    const metrics = [
      ["ATTEMPTS", t.attempts],
      ["ESCAPES", t.wins],
      [
        "COMPLETION",
        t.attempts ? ((t.wins / t.attempts) * 100).toFixed(1) + "%" : "—",
      ],
      ["AVG. RANKED", t.wins ? time(t.rankedTicks / t.wins) + "s" : "—"],
      ["AVG. ACTUAL", t.wins ? time(t.ticks / t.wins) + "s" : "—"],
      ["TIMEOUTS", t.timeouts],
      ["ENEMIES", t.kills],
      ["DIAMONDS", t.loot],
    ];
    const runs = d.history.filter(currentRecord),
      archived = d.history.length - runs.length;
    this.shell(
      "Your time in the crypt.",
      "Current rules: fastest ranked time wins. Actual time breaks ties.",
      `<div class="stat-grid">${metrics.map(([label, value]) => "<div><span>" + label + "</span><strong>" + value + "</strong></div>").join("")}</div><h3>PERSONAL BEST</h3><div class="record-list">${pb ? "<div><span>" + time(pb.rankedTicks) + "s ranked<small>" + time(pb.ticks) + "s actual − " + time(pb.refundTicks) + "s refunds · best combo ×" + pb.maxCombo + "</small></span>" + (d.replays[key] ? button("Replay", "watch", 'data-key="' + esc(key) + '"') : "<span>Replay unavailable</span>") + "</div>" : '<p class="muted">Escape to write your first record under these rules.</p>'}</div><h3>OBJECTIVE TIMESTAMPS</h3>${pb ? pb.splits.map((split) => '<p class="muted">' + esc(split.id) + ": " + time(split.tick) + "s actual − " + time(split.refundTicks) + "s refunds = " + time(split.rankedTicks) + "s ranked</p>").join("") : ""}<h3>BEST COMPARABLE SEGMENTS</h3><div class="segment-list">${
        Object.entries(d.segments)
          .filter(([k]) => k.startsWith(key + "|"))
          .map(
            ([k, ticks]) =>
              "<div><span>" +
              esc(k.split("|")[1]!) +
              "</span><b>" +
              time(ticks) +
              "s actual</b></div>",
          )
          .join("") ||
        '<p class="muted">Finish a run to record comparable segments.</p>'
      }</div><p class="muted">Segments require matching preceding objectives and diamond order, combo rewards and applied refunds.</p><h3>CAUSES OF FAILURE</h3><p class="muted">${
        Object.entries(t.deaths)
          .map(([cause, n]) => esc(cause) + ": " + n)
          .join(" · ") || "No recorded failures."
      }</p><h3>RECENT RUNS</h3><div class="table-wrap"><table><thead><tr><th>Result</th><th>Ranked</th><th>Actual</th><th>Refunds</th><th>Diamonds / combo</th><th>Details</th></tr></thead><tbody>${[
        ...runs,
      ]
        .reverse()
        .map(
          (r) =>
            "<tr><td>" +
            (r.won ? "ESCAPED" : "FAILED") +
            (r.valid ? "" : " / practice") +
            "</td><td>" +
            time(r.rankedTicks) +
            "s</td><td>" +
            time(r.ticks) +
            "s</td><td>" +
            time(r.refundTicks) +
            "s</td><td>" +
            r.loot +
            "/6 · ×" +
            r.maxCombo +
            "</td><td>" +
            esc(r.cause || "All objectives complete") +
            "</td></tr>",
        )
        .join(
          "",
        )}</tbody></table></div><p class="muted">Previous-version records are preserved separately and excluded from current comparisons. ${archived} archived summaries remain in recent history. Export includes archived PBs, replays and unlocks.</p><div class="panel-actions">${button("Export local data", "export")}${button("Reset all data", "reset", 'class="danger"')}</div>${this.confirmedReset ? '<div class="confirm"><p>This permanently clears this browser’s records, settings, replays and unlocks.</p>' + button("Yes, erase local data", "confirm-reset", 'class="danger"') + button("Cancel", "cancel-reset") + "</div>" : ""}`,
    );
  }
  private achievements(): void {
    this.shell(
      "Small victories. Lasting legends.",
      "Every reward is cosmetic. No permanent gameplay advantages.",
      `<div class="card-grid">${ACHIEVEMENTS.map((a) => {
        const done = this.store.data.achievements.includes(a.id);
        return `<article class="achievement ${done ? "unlocked" : ""}"><span class="achievement-icon">${done ? "✦" : "◇"}</span><h3>${a.name}</h3><p>${a.description}</p><small>${done ? "UNLOCKED" : "LOCKED"} / ${a.reward}</small></article>`;
      }).join("")}</div>`,
    );
  }

  private cosmetics(): void {
    const unlocked = this.store.data.achievements;
    const groups = COSMETIC_GROUPS.map(
      (group) =>
        '<section class="appearance-group" aria-labelledby="appearance-' +
        group.setting +
        '"><h3 id="appearance-' +
        group.setting +
        '">' +
        group.name +
        '</h3><div class="cosmetic-row">' +
        group.items
          .map((item) => {
            const available = availableCosmetic(item, unlocked),
              selected = this.settings[group.setting] === item.id;
            const achievement = ACHIEVEMENTS.find((a) => a.id === item.need),
              requirement = achievement
                ? "Unlock: " + achievement.name + ". " + achievement.description
                : "Included from the start.";
            const preview =
              '<span class="cosmetic-preview" aria-hidden="true"><canvas width="' +
              PREVIEW_SIZE.width +
              '" height="' +
              PREVIEW_SIZE.height +
              '" data-preview-setting="' +
              group.setting +
              '" data-preview-value="' +
              esc(item.id) +
              '"></canvas>' +
              (group.setting === "title"
                ? '<span class="profile-title preview-title">' +
                  esc(item.id) +
                  "</span>"
                : "") +
              "</span>";
            return button(
              preview +
                '<span class="cosmetic-copy"><span class="cosmetic-name">' +
                esc(item.name) +
                '</span><span class="cosmetic-status">' +
                (selected ? "✓ EQUIPPED" : available ? "AVAILABLE" : "LOCKED") +
                '</span><span class="cosmetic-requirement">' +
                esc(requirement) +
                "</span></span>",
              "equip",
              'class="cosmetic ' +
                (selected ? "selected" : "") +
                '" data-setting="' +
                group.setting +
                '" data-value="' +
                esc(item.id) +
                '" aria-pressed="' +
                selected +
                '" ' +
                (available ? "" : "disabled"),
            );
          })
          .join("") +
        "</div></section>",
    ).join("");
    this.shell(
      "Style survives the run.",
      "Preview every appearance, including locked rewards. Cosmetics never change gameplay.",
      '<div class="appearance-catalog">' +
        groups +
        '<p class="muted appearance-note">Previews are silent. Reduced visual effects or your device’s reduced-motion setting show still previews.</p></div>',
    );
    const host = this.root.querySelector<HTMLElement>(".appearance-catalog");
    if (host)
      this.appearancePreviews = new CosmeticPreviews(
        host,
        this.settings.reduced,
      );
  }
  private replays(): void {
    const replays = Object.entries(this.store.data.replays).filter(
      ([, r]) => currentRecord(r) && !compatibility(r),
    );
    this.shell(
      "Learn from your fastest self.",
      "Playback uses actual time. Diamond refunds only change ranked time.",
      `<div class="record-list">${replays.map(([key, r]) => "<div><span>Personal best<small>" + time(r.ticks) + "s actual − " + time(r.refundTicks) + "s refunds · " + time(r.rankedTicks) + "s ranked</small></span>" + button("Watch replay ↗", "watch", 'data-key="' + esc(key) + '"') + "</div>").join("") || "<article><h3>No echoes yet.</h3><p>Set a competitive personal best to save your first compatible replay.</p></article>"}</div><p class="muted">Previous-version recordings are retained in your exported local data; incompatible recordings are never played.</p>`,
    );
  }
  private settingsScreen(): void {
    if (this.game.input) {
      this.game.input.active = false;
      this.game.input.clear();
    }
    const toggle = (name: string, key: string, checked: boolean) =>
      `<label class="setting"><span>${name}</span><input type="checkbox" data-setting="${key}" ${checked ? "checked" : ""}></label>`;
    this.shell(
      "Make it feel like home.",
      "Controls, accessibility and audio are stored in this browser.",
      `<div class="settings-grid"><section><h3>CONTROLS</h3><p class="muted">Select a binding, then press a key or click the empty capture area. Duplicate bindings are rejected. Escape can be remapped.</p><div class="bindings">${ACTIONS.map((a) => `<div><span>${actionNames[a]}</span>${button(this.binding === a ? "PRESS A KEY…" : esc(keyName(this.settings.bindings[a])), "binding", `data-binding="${a}"`)}</div>`).join("")}</div><div class="capture-area">${this.binding ? "Press any supported key, or click here for a mouse binding." : "Mouse bindings supported: left, middle and right click."}</div>${button("Restore default bindings", "default-bindings")}</section><section><h3>AUDIO</h3><label class="setting"><span>Music</span><input aria-label="Music volume" type="range" min="0" max="1" step="0.01" data-setting="music" value="${this.settings.music}"></label><label class="setting"><span>Sound effects</span><input aria-label="Sound effects volume" type="range" min="0" max="1" step="0.01" data-setting="sfx" value="${this.settings.sfx}"></label>${toggle("Mute all audio", "mute", this.settings.mute)}<h3>ACCESSIBILITY & DISPLAY</h3>${toggle("Reduced visual effects", "reduced", this.settings.reduced)}${toggle("Screen shake", "shake", this.settings.shake)}${toggle("Show personal-best ghost", "ghost", this.settings.ghost)}${toggle("Show objective splits", "splits", this.settings.splits)}<p class="muted">Objective state includes symbols and text. Combat warnings remain visible with reduced effects enabled.</p><h3>COMPETITIVE INTEGRITY</h3><p class="muted">Pausing, changing settings mid-run, leaving the window or a significant browser stall makes that attempt practice. Practice never replaces a competitive PB.</p></section></div>`,
    );
  }
  replay(): void {
    this.gameplay();
    this.root.querySelector("#overlay")!.innerHTML =
      `<div class="replay-controls"><span>PB REPLAY</span>${button("Pause", "replay-pause")}${button("Restart", "replay-restart")}<label>Speed <select aria-label="Replay speed" id="replay-speed"><option value="0.5">0.5×</option><option selected value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>${button("Close replay", "menu")}<span id="replay-status"></span></div>`;
    this.root
      .querySelector("#replay-speed")!
      .addEventListener("change", (e) => {
        this.game.replaySpeed = Number((e.target as HTMLSelectElement).value);
        this.game.clock.reset(performance.now());
      });
    this.updateReplay();
  }
  updateReplay(): void {
    const b = this.root.querySelector('[data-action="replay-pause"]');
    if (b) b.textContent = this.game.replayPaused ? "Play" : "Pause";
    const status = this.root.querySelector("#replay-status");
    if (status)
      status.textContent =
        this.game.replayError ||
        `${time(this.game.sim.state.tick)} / ${time(this.game.replayData?.ticks ?? 0)}s ACTUAL`;
  }
  updatePerformance(delta: number): void {
    const p = this.root.querySelector<HTMLElement>("#performance");
    if (p) {
      p.hidden = !this.performanceVisible;
      p.textContent = `${Math.round(1000 / Math.max(1, delta))} FPS · ${delta.toFixed(1)}ms\nSIM 120 Hz · TICK ${this.game.sim.state.tick}\n${this.game.sim.state.enemies.filter((e) => e.hp > 0).length} ENEMIES · ${this.game.sim.state.projectiles.filter((b) => b.active).length} BOLTS\nCATCH-UP EVENTS ${this.game.clock.catchups}`;
    }
  }
  toast(text: string): void {
    this.toastText = text;
    this.toastUntil = performance.now() + 3200;
    const toast = this.root.querySelector("#toast");
    if (toast) toast.textContent = text;
  }
  private bind(code: string): void {
    if (!this.binding) return;
    if (
      !/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Escape|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Enter|Backspace|Mouse[0-4])$/.test(
        code,
      )
    ) {
      this.toast(
        "Unsupported key. Choose a letter, arrow, modifier, mouse button or standard action key.",
      );
      return;
    }
    const duplicate = ACTIONS.find(
      (a) => a !== this.binding && this.settings.bindings[a] === code,
    );
    if (duplicate) {
      this.toast(
        `Already assigned to ${actionNames[duplicate]}. Choose another key.`,
      );
      return;
    }
    this.settings.bindings[this.binding] = code;
    this.binding = undefined;
    this.store.save();
    this.settingsScreen();
  }
  private change(target: HTMLInputElement): void {
    const k = target.dataset.setting;
    if (!k) return;
    if (k === "music" || k === "sfx") this.settings[k] = Number(target.value);
    else if (["mute", "reduced", "shake", "ghost", "splits"].includes(k))
      this.settings[k as "mute"] = target.checked;
    this.store.save();
    void this.game.audio.unlock();
    this.game.audio.apply();
  }
  private click(action: string, target: HTMLElement): void {
    if (action === "play") this.game.start();
    else if (action === "resume") this.game.pause();
    else if (action === "restart") this.game.restart();
    else if (action === "menu") this.game.menu();
    else if (action === "back") {
      this.binding = undefined;
      if (this.game.mode === "paused") {
        if (this.game.input) this.game.input.active = true;
        this.pause();
      } else this.game.menu();
    } else if (action === "stats") this.stats();
    else if (action === "achievements") this.achievements();
    else if (action === "cosmetics") this.cosmetics();
    else if (action === "replays") this.replays();
    else if (action === "settings") {
      if (this.game.mode === "play") {
        this.game.pause();
        this.game.sim.invalidate("Settings opened during run");
      }
      this.settingsScreen();
    } else if (action === "binding") {
      this.binding = target.dataset.binding as Action;
      this.settingsScreen();
    } else if (action === "default-bindings") {
      this.settings.bindings = { ...DEFAULT_SETTINGS.bindings };
      this.binding = undefined;
      this.store.save();
      this.settingsScreen();
    } else if (action === "equip") {
      const found = findCosmetic(
        target.dataset.setting ?? "",
        target.dataset.value ?? "",
      );
      if (
        !found ||
        !availableCosmetic(found.option, this.store.data.achievements)
      )
        return;
      this.settings[found.group.setting] = found.option.id;
      this.store.save();
      this.cosmetics();
      const equipped = Array.from(
        this.root.querySelectorAll<HTMLButtonElement>('[data-action="equip"]'),
      ).find(
        (button) =>
          button.dataset.setting === found.group.setting &&
          button.dataset.value === found.option.id,
      );
      equipped?.focus();
    } else if (action === "watch") {
      const replay = this.store.data.replays[target.dataset.key!];
      if (replay) this.game.watch(replay);
    } else if (action === "watch-current") {
      const o = this.game.sim.options;
      const replay =
        this.store.data.replays[recordKey(o.category, o.challenge)];
      if (replay) this.game.watch(replay);
      else
        this.toast("No compatible competitive personal-best replay is saved.");
    } else if (action === "replay-pause") this.game.pause();
    else if (action === "replay-restart") {
      if (this.game.replayData) this.game.watch(this.game.replayData);
    } else if (action === "export") {
      const blob = new Blob([JSON.stringify(this.store.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "one-minute-dungeon-backup.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (action === "reset") {
      this.confirmedReset = true;
      this.stats();
    } else if (action === "cancel-reset") {
      this.confirmedReset = false;
      this.stats();
    } else if (action === "confirm-reset") {
      this.store.reset();
      this.confirmedReset = false;
      this.stats();
    }
  }
}
