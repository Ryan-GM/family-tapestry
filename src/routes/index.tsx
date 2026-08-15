import { createFileRoute, Link } from "@tanstack/react-router";
import { GitBranch, Search, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Heirloom — build your family tree from anyone" },
      {
        name: "description",
        content:
          "Heirloom is a private, interactive family tree. Start with any relative you know and expand your genealogy one connection at a time.",
      },
      { property: "og:title", content: "Heirloom — build your family tree from anyone" },
      {
        property: "og:description",
        content: "Start anywhere, add one relative, and let the tree draw itself. Private by default.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Users, title: "Start anywhere", body: "Begin with yourself, a grandparent, or the one name you have. No root required." },
  { icon: GitBranch, title: "Self-drawing tree", body: "People and relationships are stored as a graph; the canvas arranges itself." },
  { icon: Search, title: "Room for the unknown", body: "Approximate years, unknown surnames and unconfirmed links are first-class." },
  { icon: Sparkles, title: "Private by default", body: "Invite relatives with view, edit or owner access whenever you're ready." },
];

function Landing() {
  return (
    <main className="star-field min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg text-gradient-brand">Heirloom</span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-12 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-brass">Living family knowledge graph</p>
        <h1 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
          You don't need to know where your family <span className="text-gradient-brand">begins</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Enter the first person you know. Connect a father, a sibling, a spouse — Heirloom keeps redrawing the map as your
          history comes into focus.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/trees"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Start a family tree
          </Link>
          <Link
            to="/auth"
            className="rounded-full border border-border px-6 py-3 text-sm transition-colors hover:border-primary"
          >
            I have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className="surface-panel p-5">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-3 text-base font-medium">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
