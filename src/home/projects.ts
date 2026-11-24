export interface Project {
  title: string;
  description: string;
  icon: string;
  status: "Play Now" | "Coming Soon";
  url?: string;
  cta: string;
}
export const projects: Project[] = [
  {
    icon: "🔤",
    status: "Play Now",
    title: "NATO Phonetic Trainer",
    description:
      "26 letters. Three choices. One mission: get them all right. Practice your recall and beat your best time.",
    url: "/nato-phonetic-alphabet-trainer/",
    cta: "Give It a Try →",
  },
  {
    icon: "⚔️",
    status: "Play Now",
    title: "One Minute Dungeon",
    description:
      "One dungeon. One life. 60 seconds to escape. Master the route, dodge deadly traps, and beat your personal best.",
    url: "/one-minute-dungeon/",
    cta: "Enter the Dungeon →",
  },
  {
    icon: "🧪",
    status: "Coming Soon",
    title: "More Experiments",
    description:
      "New challenges, tools, and questionable ideas are always in development.",
    cta: "Under Construction",
  },
];
export function renderProjects(): string {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  return projects
    .map(
      (p) =>
        '<article class="card"><div class="card-top"><span class="emoji">' +
        p.icon +
        '</span><span class="pill' +
        (p.status === "Coming Soon" ? " soon" : "") +
        '">' +
        p.status +
        "</span></div><h3>" +
        escape(p.title) +
        "</h3><p>" +
        escape(p.description) +
        "</p>" +
        (p.url
          ? '<a href="' + escape(p.url) + '">' + escape(p.cta) + "</a>"
          : '<span class="disabled">' + escape(p.cta) + "</span>") +
        "</article>",
    )
    .join("");
}
