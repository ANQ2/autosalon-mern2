import { z } from "zod";
import { LeadModel } from "../models/Lead";
import { UserModel } from "../models/User";
import { CarModel } from "../models/Car";
import { gqlError } from "../utils/errors";
import { parseOrThrow } from "../utils/zod";
import { pubsub, TOPICS } from "../graphql/pubsub";

const createLeadSchema = z.object({
    carId: z.string().min(1),
    customerId: z.string().min(1),

    type: z.enum(["TEST_DRIVE", "RESERVE", "QUESTION"]),

    message: z.string().max(2000).optional().nullable(),
    // Принимаем либо Date объект, либо ISO string, либо null/undefined
    preferredDate: z
        .union([
            z.date(),
            z.string().datetime(), // ISO 8601 string
        ])
        .transform((val) => (typeof val === "string" ? new Date(val) : val))
        .optional()
        .nullable(),
});

export const leadService = {
    async createLead(input: unknown) {
        const data = parseOrThrow(createLeadSchema, input);

        const car = await CarModel.findOne({ _id: data.carId, isDeleted: false });
        if (!car) throw gqlError("NOT_FOUND", "Car not found");

        const customer = await UserModel.findOne({ _id: data.customerId, isDeleted: false });
        if (!customer) throw gqlError("NOT_FOUND", "Customer not found");

        const lead = await LeadModel.create({
            type: data.type,
            status: "NEW",
            customerId: data.customerId,
            carId: data.carId,
            preferredDate: data.preferredDate ?? null,
            message: data.message ?? null,
        });

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return lead;
    },

    async assignLead(leadId: string, managerId: string) {
        const lead = await LeadModel.findOne({ _id: leadId, isDeleted: false });
        if (!lead) throw gqlError("NOT_FOUND", "Lead not found");

        const manager = await UserModel.findOne({
            _id: managerId,
            isDeleted: false,
            role: { $in: ["MANAGER", "ADMIN"] },
        });
        if (!manager) throw gqlError("NOT_FOUND", "Manager not found");

        (lead as any).assignedManagerId = managerId;
        (lead as any).status = "IN_PROGRESS";
        await lead.save();

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return lead;
    },

    async updateStatus(leadId: string, status: "NEW" | "IN_PROGRESS" | "APPROVED" | "REJECTED") {
        const lead = await LeadModel.findOne({ _id: leadId, isDeleted: false });
        if (!lead) throw gqlError("NOT_FOUND", "Lead not found");

        (lead as any).status = status;
        await lead.save();

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return lead;
    },
};