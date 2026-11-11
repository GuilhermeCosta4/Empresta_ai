import { redirect } from "next/navigation";
import { getSession } from "../../server/auth/session";
import { LogoutButton } from "./logout-button";
import { Catalog } from "./catalog";

export default async function StartPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <main className="mx-auto min-h-svh max-w-[1440px] px-7 py-8 text-foreground">
      <header className="mb-6 flex items-start justify-between gap-6 border-b border-soft pb-5">
        <div>
          <span className="text-[17px] font-semibold">EmpresTI</span>
          <p className="mt-2 text-[13px] text-muted">{session.user.email}</p>
        </div>
        <LogoutButton />
      </header>
      <Catalog />
    </main>
  );
}
