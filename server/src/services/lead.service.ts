import { z } from "zod";
import { LeadModel } from "../models/Lead";
import { CarModel } from "../models/Car";
import { UserModel } from "../models/User";
import { gqlError } from "../utils/errors";
import { parseOrThrow } from "../utils/zod";
import { pubsub, TOPICS } from "../graphql/pubsub";

const createLeadSchema = z.object({
    type: z.enum(["TEST_DRIVE", "RESERVE"]),
    carId: z.string().min(10),
    customerId: z.string().min(10),
    preferredDate: z.coerce.date().optional(),
    comment: z.string().max(500).optional()
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
            preferredDate: data.preferredDate,
            comment: data.comment
        });

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return lead;
    },

    async assignLead(leadId: string, managerId: string) {
        const lead = await LeadModel.findOne({ _id: leadId, isDeleted: false });
        if (!lead) throw gqlError("NOT_FOUND", "Lead not found");

        const manager = await UserModel.findOne({ _id: managerId, isDeleted: false, role: { $in: ["MANAGER", "ADMIN"] } });
        if (!manager) throw gqlError("NOT_FOUND", "Manager not found");

        (lead as any).assignedManagerId = managerId;
        (lead as any).status = "IN_PROGRESS";
        await lead.save();

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return lead;
    },

    async updateStatus(leadId: string, status: string) {
        const lead = await LeadModel.findOne({ _id: leadId, isDeleted: false });
        if (!lead) throw gqlError("NOT_FOUND", "Lead not found");

        (lead as any).status = status;
        await lead.save();

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return lead;
    }
};
