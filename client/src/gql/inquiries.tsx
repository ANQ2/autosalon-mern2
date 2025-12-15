import { gql } from "@apollo/client";

export const MY_INQUIRIES = gql`
  query MyInquiries {
    myInquiries { id status type message preferredDate car { id brand model } createdAt managerComment }
  }
`;

export const INQUIRIES = gql`
  query Inquiries {
    inquiries { id status type message preferredDate user { id email username } car { id brand model } createdAt managerComment }
  }
`;

export const CREATE_INQUIRY = gql`
  mutation CreateInquiry($input: InquiryCreateInput!) {
    createInquiry(input: $input) { id status type car { id brand model } }
  }
`;

export const UPDATE_INQUIRY_STATUS = gql`
  mutation UpdateInquiryStatus($input: InquiryStatusInput!) {
    updateInquiryStatus(input: $input) { id status managerComment }
  }
`;

export const INQUIRY_UPDATED = gql`
  subscription InquiryUpdated {
    inquiryUpdated { id status managerComment updatedAt }
  }
`;
