import { PubSub, withFilter } from "graphql-subscriptions";

export const pubsub = new PubSub();
export { withFilter };

export const TOPICS = {
    LEAD_UPDATED: "LEAD_UPDATED",
    MESSAGE_ADDED: "MESSAGE_ADDED",
    NOTIFICATION: "NOTIFICATION",
    PROMO_PUBLISHED: "PROMO_PUBLISHED"
} as const;
