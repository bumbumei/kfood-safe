import Link from "next/link";

const FEATURES = [
  {
    href: "/dishes",
    emoji: "🍲",
    title: "Korean Dish Guide",
    desc: "Traffic-light safety ratings for 80+ common dishes — hidden allergens like jeotgal in kimchi or wheat in gochujang, explained.",
    cta: "Check a dish",
  },
  {
    href: "/restaurants",
    emoji: "📍",
    title: "Find Restaurants",
    desc: "Browse Busan restaurants from Korea Tourism Organization data plus 3,000+ city-certified safe restaurants.",
    cta: "Explore Busan",
  },
  {
    href: "/cards",
    emoji: "🗣️",
    title: "Allergy Cards",
    desc: "Show restaurant staff a card in Korean explaining exactly what you can't eat. Works offline — just show your phone.",
    cta: "Make my card",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="pt-8 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Halal · Vegan · Vegetarian · Gluten-free · Allergies
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Eat Korea <span className="text-emerald-600">without worry</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-stone-500">
          Korean food is full of hidden ingredients — fish sauce in kimchi, wheat in
          gochujang, pork in &ldquo;vegetable&rdquo; dumplings. K-Food Safe tells you
          what&apos;s really in your bowl, starting with Busan.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/dishes"
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
          >
            Check what&apos;s safe →
          </Link>
          <Link
            href="/cards"
            className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Get an allergy card
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-3xl">{f.emoji}</div>
            <h2 className="mt-3 font-bold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.desc}</p>
            <p className="mt-4 text-sm font-semibold text-emerald-600 group-hover:underline">
              {f.cta} →
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl bg-stone-900 p-8 text-stone-100">
        <h2 className="text-lg font-bold">Why Busan first?</h2>
        <div className="mt-4 grid gap-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-3xl font-extrabold text-emerald-400">3,101</p>
            <p className="mt-1 text-stone-400">
              City-certified safe restaurants published as open data — the richest
              dataset in Korea.
            </p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-emerald-400">525</p>
            <p className="mt-1 text-stone-400">
              Restaurant records already available in English through Busan open APIs.
            </p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-emerald-400">11</p>
            <p className="mt-1 text-stone-400">
              Dietary-restriction search results in the entire national tourism API —
              the gap this service exists to close.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
