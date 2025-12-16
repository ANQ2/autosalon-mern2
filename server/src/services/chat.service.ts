import { z } from "zod";
import { ChatModel } from "../models/Chat";
import { MessageModel } from "../models/Message";
import { CarModel } from "../models/Car";
import { UserModel } from "../models/User";
import { gqlError } from "../utils/errors";
import { parseOrThrow } from "../utils/zod";
import { pubsub, TOPICS } from "../graphql/pubsub";

const sendSchema = z.object({
    chatId: z.string().min(10),
    authorId: z.string().min(10),
    text: z.string().min(1).max(2000)
});

export const chatService = {
    async createCarChat(customerId: string, carId: string) {
        const car = await CarModel.findOne({ _id: carId, isDeleted: false });
        if (!car) throw gqlError("NOT_FOUND", "Car not found");

        // чтобы не плодить: один чат на customer+car
        const exists = await ChatModel.findOne({
            customerId,
            carId,
            isDeleted: false
        });
        if (exists) return exists;

        return ChatModel.create({
            status: "OPEN",
            customerId,
            carId,
            lastMessageAt: new Date() // ← ВАЖНО: устанавливаем сразу!
        });
    },

    async createSupportChat(customerId: string) {
        // один support чат на клиента (без carId)
        const exists = await ChatModel.findOne({
            customerId,
            carId: { $exists: false },
            isDeleted: false
        });
        if (exists) return exists;

        return ChatModel.create({
            status: "OPEN",
            customerId,
            lastMessageAt: new Date()
        });
    },

    async assignChat(chatId: string, managerId: string) {
        const chat = await ChatModel.findOne({ _id: chatId, isDeleted: false });
        if (!chat) throw gqlError("NOT_FOUND", "Chat not found");

        const manager = await UserModel.findOne({ _id: managerId, isDeleted: false, role: { $in: ["MANAGER", "ADMIN"] } });
        if (!manager) throw gqlError("NOT_FOUND", "Manager not found");

        (chat as any).managerId = managerId;
        await chat.save();

        pubsub.publish(TOPICS.NOTIFICATION, {
            notificationReceived: {
                userId: managerId,
                title: "Chat assigned",
                message: "You have been assigned a chat",
                createdAt: new Date().toISOString()
            }
        });

        return chat;
    },

    async closeChat(chatId: string) {
        const chat = await ChatModel.findOne({ _id: chatId, isDeleted: false });
        if (!chat) throw gqlError("NOT_FOUND", "Chat not found");
        (chat as any).status = "CLOSED";
        await chat.save();
        return chat;
    },

    async sendMessage(input: unknown) {
        const data = parseOrThrow(sendSchema, input);

        const chat = await ChatModel.findOne({ _id: data.chatId, isDeleted: false });
        if (!chat) throw gqlError("NOT_FOUND", "Chat not found");
        if ((chat as any).status === "CLOSED") throw gqlError("FORBIDDEN", "Chat is closed");

        const msg = await MessageModel.create({
            chatId: data.chatId,
            authorId: data.authorId,
            text: data.text,
            kind: "TEXT"
        });

        (chat as any).lastMessageAt = new Date();
        await chat.save();

        pubsub.publish(TOPICS.MESSAGE_ADDED, { messageAdded: msg });

        // уведомления: клиенту и менеджеру
        const customerId = (chat as any).customerId?.toString();
        const managerId = (chat as any).managerId?.toString();

        const notifyTargets = new Set<string>();
        if (customerId) notifyTargets.add(customerId);
        if (managerId) notifyTargets.add(managerId);

        for (const userId of notifyTargets) {
            pubsub.publish(TOPICS.NOTIFICATION, {
                notificationReceived: {
                    userId,
                    title: "New message",
                    message: "You received a new message",
                    createdAt: new Date().toISOString()
                }
            });
        }

        return msg;
    }
};