import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "../../../../server/api/router";
import { authCacheControl } from "../../../../server/auth/supabase";

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
    responseMeta: () => ({ headers: { "Cache-Control": authCacheControl } }),
  });
}

export { handler as GET, handler as POST };
