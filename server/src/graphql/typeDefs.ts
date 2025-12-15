import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  enum Role { CUSTOMER MANAGER ADMIN }
  enum CarStatus { AVAILABLE RESERVED SOLD }
  enum LeadType { TEST_DRIVE RESERVE }
  enum LeadStatus { NEW IN_PROGRESS APPOINTED DONE CANCELED }
  enum ChatType { CAR SUPPORT }
  enum ChatStatus { OPEN CLOSED }

  type User {
    id: ID!
    email: String!
    role: Role!
    fullName: String!
    phone: String
    favorites: [Car!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Car {
    id: ID!
    title: String!
    brand: String!
    model: String!
    year: Int!
    price: Int!
    mileage: Int!
    fuelType: String!
    transmission: String!
    status: CarStatus!
    images: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Lead {
    id: ID!
    type: LeadType!
    status: LeadStatus!
    customer: User!
    car: Car!
    assignedManager: User
    preferredDate: DateTime
    comment: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Appointment {
    id: ID!
    lead: Lead!
    manager: User!
    dateTime: DateTime!
    location: String!
    note: String
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Promotion {
    id: ID!
    title: String!
    description: String!
    discountPercent: Int!
    startsAt: DateTime!
    endsAt: DateTime!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Chat {
    id: ID!
    type: ChatType!
    status: ChatStatus!
    car: Car
    customer: User!
    manager: User
    lastMessageAt: DateTime
    lastMessage: Message
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Message {
    id: ID!
    chat: Chat!
    author: User!
    text: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type Notification {
    userId: ID!
    title: String!
    message: String!
    createdAt: DateTime!
  }

  input CarFilterInput {
    brand: String
    minPrice: Int
    maxPrice: Int
    status: CarStatus
    yearFrom: Int
    yearTo: Int
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 12
  }

  input CarCreateInput {
    title: String!
    brand: String!
    model: String!
    year: Int!
    price: Int!
    mileage: Int!
    fuelType: String!
    transmission: String!
    images: [String!]
  }

  input CarUpdateInput {
    title: String
    price: Int
    mileage: Int
    status: CarStatus
    images: [String!]
  }

  input PromotionCreateInput {
    title: String!
    description: String!
    discountPercent: Int!
    startsAt: DateTime!
    endsAt: DateTime!
    isActive: Boolean = true
  }

  input AppointmentCreateInput {
    leadId: ID!
    dateTime: DateTime!
    location: String!
    note: String
  }

  type Query {
    me: User

    cars(filter: CarFilterInput, pagination: PaginationInput): [Car!]!
    car(id: ID!): Car
    compareCars(ids: [ID!]!): [Car!]!

    myFavorites: [Car!]!

    myLeads: [Lead!]!
    crmLeads(status: LeadStatus, assignedManagerId: ID): [Lead!]!

    promotions(activeOnly: Boolean = true): [Promotion!]!

    # chats
    myChats: [Chat!]!
    crmChats(status: ChatStatus, unassignedOnly: Boolean = false): [Chat!]!
    chat(id: ID!): Chat
    chatMessages(chatId: ID!): [Message!]!
  }

  type Mutation {
    register(email: String!, password: String!, fullName: String!, phone: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    toggleFavorite(carId: ID!): [Car!]!

    # cars (only manager/admin)
    createCar(input: CarCreateInput!): Car!
    updateCar(carId: ID!, input: CarUpdateInput!): Car!

    # leads (test drive / reserve)
    createLead(type: LeadType!, carId: ID!, preferredDate: DateTime, comment: String): Lead!
    assignLead(leadId: ID!, managerId: ID!): Lead!          # only ADMIN
    updateLeadStatus(leadId: ID!, status: LeadStatus!): Lead! # manager/admin

    # appointment (manager/admin)
    createAppointment(input: AppointmentCreateInput!): Appointment!

    # promotions (admin)
    createPromotion(input: PromotionCreateInput!): Promotion!

    # chats
    createCarChat(carId: ID!): Chat!     # customer only (auth)
    createSupportChat(): Chat!           # customer only (auth)
    assignChat(chatId: ID!, managerId: ID!): Chat!  # admin
    closeChat(chatId: ID!): Chat!        # manager/admin
    sendMessage(chatId: ID!, text: String!): Message! # auth; customer or assigned manager
  }

  type Subscription {
    leadUpdated(customerId: ID!): Lead!
    messageAdded(chatId: ID!): Message!
    notificationReceived(userId: ID!): Notification!
    promotionPublished: Promotion!
  }
`;
