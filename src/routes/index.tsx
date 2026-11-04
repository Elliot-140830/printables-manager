import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printebles Manager" },
      { name: "description", content: "Hantera din 3D-printverksamhet: ordrar, produktion, filament och ekonomi." },
      { property: "og:title", content: "Printebles Manager" },
      { property: "og:description", content: "Hantera din 3D-printverksamhet: ordrar, produktion, filament och ekonomi." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/oversikt" });
  },
});
