import { z } from "zod";
import { AppointmentModel } from "../models/Appointment";
import { LeadModel } from "../models/Lead";
import { gqlError } from "../utils/errors";
import { parseOrThrow } from "../utils/zod";
import { pubsub, TOPICS } from "../graphql/pubsub";

const createSchema = z.object({
    leadId: z.string().min(10),
    managerId: z.string().min(10),
    dateTime: z.coerce.date(),
    location: z.string().min(2).max(120),
    note: z.string().max(500).optional()
});

export const appointmentService = {
    async createAppointment(input: unknown) {
        const data = parseOrThrow(createSchema, input);

        const lead = await LeadModel.findOne({ _id: data.leadId, isDeleted: false });
        if (!lead) throw gqlError("NOT_FOUND", "Lead not found");

        const existing = await AppointmentModel.findOne({ leadId: data.leadId, isDeleted: false });
        if (existing) throw gqlError("CONFLICT", "Appointment already exists for this lead");

        const appt = await AppointmentModel.create({
            leadId: data.leadId,
            managerId: data.managerId,
            dateTime: data.dateTime,
            location: data.location,
            note: data.note,
            status: "SCHEDULED"
        });

        // lead → APPOINTED
        (lead as any).status = "APPOINTED";
        await lead.save();

        pubsub.publish(TOPICS.LEAD_UPDATED, { leadUpdated: lead });

        return appt;
    }
};
