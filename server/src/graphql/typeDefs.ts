export const typeDefs = /* GraphQL */ `
  scalar DateTime

  """
  Roles:
  - CLIENT: покупатель/клиент
  - MANAGER: менеджер автосалона
  - ADMIN: главный менеджер (назначает роли)
  """
  enum Role { CLIENT MANAGER ADMIN }

  enum Fuel { GAS DIESEL HYBRID EV }
  enum Transmission { AT MT CVT }
  enum Drive { FWD RWD AWD }

  enum CarStatus { AVAILABLE RESERVED SOLD ARCHIVED }

  enum LeadType { TEST_DRIVE RESERVE QUESTION }
  enum LeadStatus { NEW IN_PROGRESS APPROVED REJECTED }

  enum ChatStatus { OPEN CLOSED }

  enum MessageKind { TEXT SYSTEM }

  type User {
    id: ID!
    email: String!
    username: String!
    role: Role!
    phone: String
    avatarUrl: String
    favorites: [Car!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Car {
    id: ID!
    brand: String!
    model: String!
    year: Int!
    price: Float!
    mileage: Float!
    color: String
    fuel: Fuel!
    transmission: Transmission!
    drive: Drive!
    status: CarStatus!
    vin: String
    description: String
    images: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Lead {
    id: ID!
    type: LeadType!
    status: LeadStatus!
    message: String
    preferredDate: DateTime
    customer: User!
    car: Car!
    managerComment: String
    assignedManager: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Appointment {
    id: ID!
    lead: Lead!
    manager: User!
    scheduledAt: DateTime!
    note: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Promotion {
    id: ID!
    title: String!
    description: String
    discountPercent: Int
    isActive: Boolean!
    validFrom: DateTime
    validTo: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Chat {
    id: ID!
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
    kind: MessageKind!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Notification {
    userId: ID!
    title: String!
    message: String!
    createdAt: DateTime!
  }

  # ----------------- INPUTS -----------------

  input RegisterInput {
    email: String!
    username: String!
    password: String!
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input PaginationInput {
    limit: Int = 20
    offset: Int = 0
  }

  input CarFilterInput {
    brand: String
    minPrice: Float
    maxPrice: Float
    fuel: Fuel
    status: CarStatus
    yearFrom: Int
    yearTo: Int
  }

  input CarCreateInput {
    brand: String!
    model: String!
    year: Int!
    price: Float!
    mileage: Float!
    color: String
    fuel: Fuel!
    transmission: Transmission!
    drive: Drive!
    vin: String
    description: String
    images: [String!]
  }

  input CarUpdateInput {
    brand: String
    model: String
    year: Int
    price: Float
    mileage: Float
    color: String
    fuel: Fuel
    transmission: Transmission
    drive: Drive
    status: CarStatus
    vin: String
    description: String
    images: [String!]
  }

  input LeadCreateInput {
    carId: ID!
    type: LeadType!
    message: String
    preferredDate: DateTime
  }

  input AppointmentCreateInput {
    leadId: ID!
    scheduledAt: DateTime!
    note: String
  }

  input PromotionCreateInput {
    title: String!
    description: String
    discountPercent: Int
    isActive: Boolean = true
    validFrom: DateTime
    validTo: DateTime
  }

  input CarsCompareInput {
    ids: [ID!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # ----------------- QUERIES -----------------

  type Query {
    me: User

    cars(filter: CarFilterInput, pagination: PaginationInput): [Car!]!
    car(id: ID!): Car
    compareCars(ids: [ID!]!): [Car!]!

    myFavorites: [Car!]!

    myLeads: [Lead!]!
    crmLeads(status: LeadStatus, assignedManagerId: ID): [Lead!]!

    promotions(activeOnly: Boolean = false): [Promotion!]!

    myChats: [Chat!]!
    crmChats(status: ChatStatus, unassignedOnly: Boolean): [Chat!]!
    chat(id: ID!): Chat
    chatMessages(chatId: ID!): [Message!]!

    users: [User!]!
  }

  # ----------------- MUTATIONS -----------------

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    toggleFavorite(carId: ID!): [Car!]!

    setUserRole(userId: ID!, role: Role!): User!

    createCar(input: CarCreateInput!): Car!
    updateCar(carId: ID!, input: CarUpdateInput!): Car!

    createLead(input: LeadCreateInput!): Lead!
    assignLead(leadId: ID!, managerId: ID!): Lead!
    updateLeadStatus(leadId: ID!, status: LeadStatus!): Lead!

    createAppointment(input: AppointmentCreateInput!): Appointment!

    createPromotion(input: PromotionCreateInput!): Promotion!

    createCarChat(carId: ID!): Chat!
    createSupportChat: Chat!
    assignChat(chatId: ID!, managerId: ID!): Chat!
    closeChat(chatId: ID!): Chat!

    sendMessage(chatId: ID!, text: String!): Message!
  }

  # ----------------- SUBSCRIPTIONS -----------------

  type Subscription {
    leadUpdated(customerId: ID!): Lead!
    messageAdded(chatId: ID!): Message!
    notificationReceived(userId: ID!): Notification!
    promotionPublished: Promotion!
  }
`;
