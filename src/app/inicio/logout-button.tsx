"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function logout() {
    setPending(true);
    setError(false);
    try {
      await trpc.auth.logout.mutate();
      window.location.replace("/");
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-control border border-accent-500 px-4 py-2 text-accent-300 disabled:opacity-60"
        disabled={pending}
        onClick={logout}
        type="button"
      >
        {pending ? "Saindo…" : "Sair"}
      </button>
      {error && <p className="mt-2 text-[13px] text-muted" role="alert">Não foi possível sair. Tente novamente.</p>}
    </div>
  );
}
