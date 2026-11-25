import { parseConfigFileTextToJson } from "typescript";
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import crypto from "node:crypto";
import { projects, renderProjects } from "../../src/home/projects";
const read = (file: string) =>
    fs.readFileSync(new URL("../../" + file, import.meta.url), "utf8"),
  hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
describe("original homepage preservation and integration", () => {
  it("preserves the exact original header, hero and base stylesheet", () => {
    const page = read("index.html"),
      css = read("src/home/styles.css"),
      baseline = JSON.parse(read("docs/preservation.json"));
    expect(hash(page.match(/<header>[\s\S]*?<\/header>/)![0])).toBe(
      baseline.headerSha256,
    );
    expect(
      hash(page.match(/<section class="hero wrap">[\s\S]*?<\/section>/)![0]),
    ).toBe(baseline.heroSha256);
    expect(hash(css.slice(0, css.indexOf("\n/* Extend only")))).toBe(
      baseline.cssSha256,
    );
  });
  it("extends The Playground to the two applications plus an inactive original placeholder", () => {
    expect(projects).toHaveLength(4);
    expect(projects.map((p) => p.url)).toEqual([
      "/nato-phonetic-alphabet-trainer/",
      "/one-minute-dungeon/",
      "/blackjack-trainer/",
      undefined,
    ]);
    const html = renderProjects();
    expect((html.match(/<article /g) ?? []).length).toBe(4);
    expect((html.match(/<a href=/g) ?? []).length).toBe(3);
    expect(html).toContain('<span class="disabled">Under Construction</span>');
    expect(read("index.html")).toContain("Things I've Built");
  });
  it("targets the existing Worker with real 404 and folder-index handling", () => {
    const config = parseConfigFileTextToJson(
      "wrangler.jsonc",
      read("wrangler.jsonc"),
    ).config;
    expect(config.name).toBe("trial-and-elias1");
    expect(config.assets).toEqual({
      directory: "./dist",
      not_found_handling: "404-page",
      html_handling: "auto-trailing-slash",
    });
    expect(config).not.toHaveProperty("routes");
    expect(config).not.toHaveProperty("account_id");
    expect(read("public/404.html")).toContain("Back to Projects");
  });
  it("keeps the applications in independent HTML/CSS documents", () => {
    const home = read("index.html"),
      trainer = read("apps/nato-trainer/index.html"),
      game = read("apps/one-minute-dungeon/index.html");
    expect(home).not.toContain("tailwind");
    expect(game).not.toContain("tailwind");
    expect(trainer).toContain(
      "NATO Phonetic Alphabet Trainer | Trial &amp; Elias",
    );
    expect(game).toContain("One Minute Dungeon | Trial &amp; Elias");
  });
});
