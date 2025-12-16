import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const HTTP_URL = (process.env.NEXT_PUBLIC_HTTP_URL ?? "http://localhost:4000/graphql") as string;
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/graphql") as string;

export function makeApolloClient(token?: string | null) {
  const httpLink = new HttpLink({
    uri: HTTP_URL,
    headers: token ? { authorization: `Bearer ${token}` } : undefined, 
  });

  const wsLink =
    typeof window !== "undefined"
      ? new GraphQLWsLink(
          createClient({
            url: WS_URL,
            connectionParams: () => (token ? { authorization: `Bearer ${token}` } : {}), 
          })
        )
      : null;

  const link = wsLink
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return def.kind === "OperationDefinition" && def.operation === "subscription";
        },
        wsLink,
        httpLink
      )
    : httpLink;

  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            cars: { merge: false },
            inquiries: { merge: false },
            myInquiries: { merge: false },
            myChats: { merge: false },
          },
        },
      },
    }),
  });
}
