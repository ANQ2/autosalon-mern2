import { UserModel } from "../models/User";
import { CarModel } from "../models/Car";
import { LeadModel } from "../models/Lead";
import { AppointmentModel } from "../models/Appointment";
import { PromotionModel } from "../models/Promotion";
import { ChatModel } from "../models/Chat";
import { MessageModel } from "../models/Message";

import { authService } from "../services/auth.service";
import { carService } from "../services/car.service";
import { leadService } from "../services/lead.service";
import { appointmentService } from "../services/appointment.service";
import { chatService } from "../services/chat.service";

import { assertAuth, assertRole, gqlError } from "../utils/errors";
import type { GqlContext } from "./context";
import { pubsub, TOPICS, withFilter } from "./pubsub";

export const resolvers = {
    DateTime: {
        __parseValue(value: string) { return new Date(value); },
        __serialize(value: Date) { return value.toISOString(); }
    },

    User: {
        id: (u: any) => u._id.toString(),
        favorites: async (u: any) => {
            const ids = (u.favoriteCarIds ?? []).filter(Boolean);
            if (!ids.length) return [];
            return CarModel.find({ _id: { $in: ids }, isDeleted: false });
        }
    },

    Car: { id: (c: any) => c._id.toString() },

    Lead: {
        id: (l: any) => l._id.toString(),
        customer: async (l: any) => UserModel.findOne({ _id: l.customerId, isDeleted: false }),
        car: async (l: any) => CarModel.findOne({ _id: l.carId, isDeleted: false }),
        assignedManager: async (l: any) =>
            l.assignedManagerId ? UserModel.findOne({ _id: l.assignedManagerId, isDeleted: false }) : null
    },

    Appointment: {
        id: (a: any) => a._id.toString(),
        lead: async (a: any) => LeadModel.findOne({ _id: a.leadId, isDeleted: false }),
        manager: async (a: any) => UserModel.findOne({ _id: a.managerId, isDeleted: false })
    },

    Promotion: { id: (p: any) => p._id.toString() },

    Chat: {
        id: (c: any) => c._id.toString(),
        car: async (c: any) => (c.carId ? CarModel.findOne({ _id: c.carId, isDeleted: false }) : null),
        customer: async (c: any) => UserModel.findOne({ _id: c.customerId, isDeleted: false }),
        manager: async (c: any) => (c.managerId ? UserModel.findOne({ _id: c.managerId, isDeleted: false }) : null),
        lastMessage: async (c: any) => {
            return MessageModel.findOne({ chatId: c._id, isDeleted: false }).sort({ createdAt: -1 });
        }
    },

    Message: {
        id: (m: any) => m._id.toString(),
        chat: async (m: any) => ChatModel.findOne({ _id: m.chatId, isDeleted: false }),
        author: async (m: any) => UserModel.findOne({ _id: m.authorId, isDeleted: false })
    },

    Query: {
        me: async (_: unknown, __: unknown, ctx: GqlContext) => {
            if (!ctx.user) return null;
            return UserModel.findOne({ _id: ctx.user.id, isDeleted: false });
        },

        cars: async (_: unknown, args: any) => carService.listCars(args.filter, args.pagination),

        car: async (_: unknown, { id }: { id: string }) => CarModel.findOne({ _id: id, isDeleted: false }),

        compareCars: async (_: unknown, { ids }: { ids: string[] }) =>
            CarModel.find({ _id: { $in: ids }, isDeleted: false }),

        myFavorites: async (_: unknown, __: unknown, ctx: GqlContext) => {
            assertAuth(ctx.user);
            const u = await UserModel.findOne({ _id: ctx.user.id, isDeleted: false });
            if (!u) throw gqlError("NOT_FOUND", "User not found");
            const ids = (u as any).favoriteCarIds ?? [];
            return CarModel.find({ _id: { $in: ids }, isDeleted: false });
        },

        myLeads: async (_: unknown, __: unknown, ctx: GqlContext) => {
            assertAuth(ctx.user);
            return LeadModel.find({ customerId: ctx.user.id, isDeleted: false }).sort({ createdAt: -1 });
        },

        crmLeads: async (_: unknown, args: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            const q: any = { isDeleted: false };
            if (args.status) q.status = args.status;
            if (args.assignedManagerId) q.assignedManagerId = args.assignedManagerId;
            return LeadModel.find(q).sort({ createdAt: -1 });
        },

        promotions: async (_: unknown, { activeOnly }: { activeOnly: boolean }) => {
            const q: any = { isDeleted: false };
            if (activeOnly) q.isActive = true;
            return PromotionModel.find(q).sort({ createdAt: -1 });
        },

        myChats: async (_: unknown, __: unknown, ctx: GqlContext) => {
            assertAuth(ctx.user);
            // клиент видит свои, менеджер — назначенные
            if (ctx.user.role === "CUSTOMER") {
                return ChatModel.find({ customerId: ctx.user.id, isDeleted: false }).sort({ lastMessageAt: -1, createdAt: -1 });
            }
            return ChatModel.find({ managerId: ctx.user.id, isDeleted: false }).sort({ lastMessageAt: -1, createdAt: -1 });
        },

        crmChats: async (_: unknown, args: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            const q: any = { isDeleted: false };
            if (args.status) q.status = args.status;
            if (args.unassignedOnly) q.managerId = { $exists: false };
            return ChatModel.find(q).sort({ lastMessageAt: -1, createdAt: -1 });
        },

        chat: async (_: unknown, { id }: { id: string }, ctx: GqlContext) => {
            assertAuth(ctx.user);
            const chat = await ChatModel.findOne({ _id: id, isDeleted: false });
            if (!chat) return null;

            // доступ: клиент-владелец или назначенный менеджер/админ
            const customerId = (chat as any).customerId?.toString();
            const managerId = (chat as any).managerId?.toString();

            const ok =
                ctx.user.role === "ADMIN" ||
                customerId === ctx.user.id ||
                (managerId && managerId === ctx.user.id);

            if (!ok) throw gqlError("FORBIDDEN", "No access to chat");

            return chat;
        },

        chatMessages: async (_: unknown, { chatId }: { chatId: string }, ctx: GqlContext) => {
            assertAuth(ctx.user);
            const chat = await ChatModel.findOne({ _id: chatId, isDeleted: false });
            if (!chat) throw gqlError("NOT_FOUND", "Chat not found");

            const customerId = (chat as any).customerId?.toString();
            const managerId = (chat as any).managerId?.toString();

            const ok =
                ctx.user.role === "ADMIN" ||
                customerId === ctx.user.id ||
                (managerId && managerId === ctx.user.id);

            if (!ok) throw gqlError("FORBIDDEN", "No access to messages");

            return MessageModel.find({ chatId, isDeleted: false }).sort({ createdAt: 1 });
        }
    },

    Mutation: {
        register: async (_: unknown, args: any) => authService.register(args),
        login: async (_: unknown, args: any) => authService.login(args),

        toggleFavorite: async (_: unknown, { carId }: { carId: string }, ctx: GqlContext) => {
            assertAuth(ctx.user);
            const u = await UserModel.findOne({ _id: ctx.user.id, isDeleted: false });
            if (!u) throw gqlError("NOT_FOUND", "User not found");

            const car = await CarModel.findOne({ _id: carId, isDeleted: false });
            if (!car) throw gqlError("NOT_FOUND", "Car not found");

            const ids: string[] = (u as any).favoriteCarIds?.map((x: any) => x.toString()) ?? [];
            const exists = ids.includes(carId);

            (u as any).favoriteCarIds = exists ? ids.filter(id => id !== carId) : [...ids, carId];
            await u.save();

            return CarModel.find({ _id: { $in: (u as any).favoriteCarIds }, isDeleted: false });
        },

        createCar: async (_: unknown, { input }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            return carService.createCar(input);
        },

        updateCar: async (_: unknown, { carId, input }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            return carService.updateCar(carId, input);
        },

        createLead: async (_: unknown, args: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            const lead = await leadService.createLead({ ...args, customerId: ctx.user.id });

            // notify managers/admins
            const managers = await UserModel.find({ role: { $in: ["MANAGER", "ADMIN"] }, isDeleted: false }).select("_id");
            for (const m of managers) {
                pubsub.publish(TOPICS.NOTIFICATION, {
                    notificationReceived: {
                        userId: m._id.toString(),
                        title: "New lead",
                        message: "A customer created a request",
                        createdAt: new Date().toISOString()
                    }
                });
            }
            return lead;
        },

        assignLead: async (_: unknown, { leadId, managerId }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["ADMIN"]);
            return leadService.assignLead(leadId, managerId);
        },

        updateLeadStatus: async (_: unknown, { leadId, status }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            const lead = await leadService.updateStatus(leadId, status);

            pubsub.publish(TOPICS.NOTIFICATION, {
                notificationReceived: {
                    userId: lead.customerId.toString(),
                    title: "Lead updated",
                    message: `Status changed to ${status}`,
                    createdAt: new Date().toISOString()
                }
            });

            return lead;
        },

        createAppointment: async (_: unknown, { input }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            return appointmentService.createAppointment({ ...input, managerId: ctx.user.id });
        },

        createPromotion: async (_: unknown, { input }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["ADMIN"]);
            const promo = await PromotionModel.create({ ...input, createdById: ctx.user.id, isDeleted: false });

            pubsub.publish(TOPICS.PROMO_PUBLISHED, { promotionPublished: promo });
            return promo;
        },

        createCarChat: async (_: unknown, { carId }: { carId: string }, ctx: GqlContext) => {
            assertAuth(ctx.user);
            // клиент пишет только если авторизован
            return chatService.createCarChat(ctx.user.id, carId);
        },

        createSupportChat: async (_: unknown, __: unknown, ctx: GqlContext) => {
            assertAuth(ctx.user);
            return chatService.createSupportChat(ctx.user.id);
        },

        assignChat: async (_: unknown, { chatId, managerId }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["ADMIN"]);
            return chatService.assignChat(chatId, managerId);
        },

        closeChat: async (_: unknown, { chatId }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);
            assertRole(ctx.user, ["MANAGER", "ADMIN"]);
            return chatService.closeChat(chatId);
        },

        sendMessage: async (_: unknown, { chatId, text }: any, ctx: GqlContext) => {
            assertAuth(ctx.user);

            const chat = await ChatModel.findOne({ _id: chatId, isDeleted: false });
            if (!chat) throw gqlError("NOT_FOUND", "Chat not found");

            const customerId = (chat as any).customerId?.toString();
            const managerId = (chat as any).managerId?.toString();

            // customer can write only to their chat
            if (ctx.user.role === "CUSTOMER" && customerId !== ctx.user.id) {
                throw gqlError("FORBIDDEN", "No access to chat");
            }

            // manager can write only if assigned (admin always can)
            if (ctx.user.role === "MANAGER" && managerId !== ctx.user.id) {
                throw gqlError("FORBIDDEN", "Chat not assigned to you");
            }

            return chatService.sendMessage({ chatId, authorId: ctx.user.id, text });
        }
    },


    Subscription: {
        leadUpdated: {
            subscribe: withFilter(
                () => pubsub.asyncIterableIterator([TOPICS.LEAD_UPDATED]),
                (payload, variables) => payload.leadUpdated.customerId.toString() === variables.customerId
            )
        },

        messageAdded: {
            subscribe: withFilter(
                () => pubsub.asyncIterableIterator([TOPICS.MESSAGE_ADDED]),
                (payload, variables) => payload.messageAdded.chatId.toString() === variables.chatId
            )
        },

        notificationReceived: {
            subscribe: withFilter(
                () => pubsub.asyncIterableIterator([TOPICS.NOTIFICATION]),
                (payload, variables) => payload.notificationReceived.userId === variables.userId
            )
        },

        promotionPublished: {
            subscribe: () => pubsub.asyncIterableIterator([TOPICS.PROMO_PUBLISHED])
        }
    }
};
