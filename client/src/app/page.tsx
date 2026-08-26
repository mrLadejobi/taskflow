import { redirect } from "next/navigation";

/** Entry point — send visitors to the dashboard (which guards auth client-side). */
export default function HomePage() {
  redirect("/dashboard");
}
