import Image from "next/image";
import Link from "next/link";


type Game = {
  id: string;
  title: string;
  description: string;
  href: string;
  status?: "live" | "beta" | "coming-soon";
  imageSrc?: string;
  imageAlt?: string;
};

const GAMES: Game[] = [
  {
    id: "wurple",
    title: "Wurple",
    description: "Guess the 6-digit hex color. Daily puzzles in easy and challenge modes.",
    href: "/wurple",
    status: "live",
    imageSrc: "/games/wurple3.png",
    imageAlt: "Wurple game",
  }
  // {
  //   id: "coming-1",
  //   title: "Next Game",
  //   description: "Reserved slot for your next build.",
  //   href: "#",
  //   status: "coming-soon",
  // },
];

function StatusPill({ status }: { status?: Game["status"] }) {
  if (!status) return null;

  const label =
    status === "live" ? "Live" : status === "beta" ? "Beta" : "Coming soon";

  const cls =
    status === "live"
      ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25"
      : status === "beta"
      ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/25"
      : "bg-white/10 text-white/70 ring-1 ring-white/10";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function GameCard({ game }: { game: Game }) {
  const disabled = game.status === "coming-soon" || game.href === "#";

  const cardInner = (
    <div
      className={[
        "group relative w-full overflow-hidden rounded-2xl border border-gray-600 bg-bg-panel text-left shadow-sm",
        "ring-1 ring-black/10 dark:ring-white/10",
        "transition hover:-translate-y-0.5 hover:shadow-lg",
        disabled ? "opacity-60 hover:translate-y-0 hover:shadow-sm" : "",
      ].join(" ")}
    >
      {/* Image (optional) */}
      <div className="relative w-full">
        {game.imageSrc ? (
          <div className="relative aspect-[16/9] w-full bg-bg-soft rounded-2xl">
            <Image
              src={game.imageSrc}
              alt={game.imageAlt ?? `${game.title} image`}
              fill
              
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={game.id === "wurple"} // only prioritize your main game
            />
            {/* subtle overlay to keep text readable if you ever place text over the image */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/20" />
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-bg-soft" />
        )}
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-extrabold text-text">
              {game.title}
            </h2>
            {game.status && <StatusPill status={game.status} />}
          </div>
          <p className="mt-1 text-sm leading-5 text-text-muted">
            {game.description}
          </p>
        </div>

        <div className="grid h-9 w-9 place-items-center rounded-lg bg-bg-soft text-text-muted transition group-hover:text-text">
          →
        </div>
      </div>
    </div>
  );

  if (disabled) return <div aria-disabled="true">{cardInner}</div>;

  return (
    <Link
      href={game.href}
      className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-link"
    >
      {cardInner}
    </Link>
  );
}


export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-text">Games</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Quick-play experiments. Built for mobile and desktop.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </section>

      <footer className="mt-10 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} Decide ~ Learn ~ Do
      </footer>
    </main>
  );
}

