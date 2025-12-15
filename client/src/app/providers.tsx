"use client";

import { ApolloProvider } from "@apollo/client/react";
import { useMemo } from "react";
import { makeApolloClient } from "src/lib/apollo";
import { useAuthStore } from "src/store/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);
    const client = useMemo(() => makeApolloClient(token), [token]);
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
