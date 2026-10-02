import { SITE_NAME } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">{SITE_NAME}</h1>
    </main>
  );
}
