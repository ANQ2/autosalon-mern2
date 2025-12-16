import { gql } from "@apollo/client";

export const MY_LEADS = gql`
    query MyLeads {
        myLeads {
            id
            status
            type
            message
            preferredDate
            managerComment
            createdAt
            updatedAt
            car {
                id
                brand
                model
            }
            customer {
                id
                email
                username
                role
            }
            assignedManager {
                id
                email
                username
                role
            }
        }
    }
`;

export const CRM_LEADS = gql`
    query CrmLeads($status: LeadStatus, $assignedManagerId: ID) {
        crmLeads(status: $status, assignedManagerId: $assignedManagerId) {
            id
            status
            type
            message
            preferredDate
            managerComment
            createdAt
            updatedAt
            car {
                id
                brand
                model
            }
            customer {
                id
                email
                username
                role
            }
            assignedManager {
                id
                email
                username
                role
            }
        }
    }
`;

export const CREATE_LEAD = gql`
    mutation CreateLead($input: LeadCreateInput!) {
        createLead(input: $input) {
            id
            status
            type
            message
            preferredDate
            createdAt
            car {
                id
                brand
                model
            }
            customer {
                id
                username
                role
            }
        }
    }
`;

export const UPDATE_LEAD_STATUS = gql`
    mutation UpdateLeadStatus($leadId: ID!, $status: LeadStatus!) {
        updateLeadStatus(leadId: $leadId, status: $status) {
            id
            status
            managerComment
            updatedAt
        }
    }
`;

export const LEAD_UPDATED = gql`
    subscription LeadUpdated($customerId: ID!) {
        leadUpdated(customerId: $customerId) {
            id
            status
            managerComment
            updatedAt
        }
    }
`;