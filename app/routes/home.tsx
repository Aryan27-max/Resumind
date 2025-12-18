import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Rsumind" },
    { name: "description", content: "Smart frrback for your dream job " },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg)] bg-cover">
      <section className="main-section">
          <div className="page-heading">
              <h1>Track your application & resume rating</h1>
              <h2>Review your submission and check AI-powered feedback</h2>
          </div>
      </section>

      </main>
}
