import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const App = lazy(() => import("../App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IHMA FinApp — Association Finance System" },
      {
        name: "description",
        content:
          "IHMA finance management demo: chapter treasurer entries, account heads, reports and admin controls.",
      },
      { property: "og:title", content: "IHMA FinApp — Association Finance System" },
      {
        property: "og:description",
        content:
          "Chapter treasurer entries, account heads, reports and admin controls for IHMA finances.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-slate-50" />}>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}
