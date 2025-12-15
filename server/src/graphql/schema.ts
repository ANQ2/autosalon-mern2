export const typeDefs = /* GraphQL */ `
  """
  Roles:
  - CLIENT: покупатель/клиент
  - MANAGER: менеджер автосалона (создаёт/редактирует авто, ведёт заявки и чат)
  - ADMIN: главный менеджер (назначает роли)
  """
  enum Role { CLIENT MANAGER ADMIN }

  enum Fuel { GAS DIESEL HYBRID EV }
  enum Transmission { AT MT CVT }
  enum Drive { FWD RWD AWD }

  enum CarStatus { AVAILABLE RESERVED SOLD ARCHIVED }

  enum InquiryType { TEST_DRIVE RESERVE QUESTION }
  enum InquiryStatus { NEW IN_PROGRESS APPROVED REJECTED }

  enum MessageKind { TEXT SYSTEM }

  type User {
    id: ID!
    email: String!
    username: String!
    role: Role!
    phone: String
    avatarUrl: String
    createdAt: String!
    updatedAt: String!
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
    createdAt: String!
    updatedAt: String!
  }

  type Inquiry {
    id: ID!
    type: InquiryType!
    status: InquiryStatus!
    message: String
    preferredDate: String
    user: User!
    car: Car!
    managerComment: String
    assignedManager: User
    createdAt: String!
    updatedAt: String!
  }

  type Review {
    id: ID!
    rating: Int!
    text: String!
    pros: [String!]!
    cons: [String!]!
    user: User!
    car: Car!
    createdAt: String!
    updatedAt: String!
  }

  type Chat {
    id: ID!
    title: String
    participants: [User!]!
    inquiry: Inquiry
    lastMessageAt: String
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    id: ID!
    chat: Chat!
    sender: User!
    text: String!
    kind: MessageKind!
    readBy: [User!]!
    editedAt: String
    createdAt: String!
    updatedAt: String!
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

  input InquiryCreateInput {
    carId: ID!
    type: InquiryType!
    message: String
    preferredDate: String
  }

  input InquiryStatusInput {
    inquiryId: ID!
    status: InquiryStatus!
    managerComment: String
    assignedManagerId: ID
  }

  input ReviewCreateInput {
    carId: ID!
    rating: Int!
    text: String!
    pros: [String!]
    cons: [String!]
  }

  input CreateChatInput {
    otherUserId: ID!
    inquiryId: ID
    title: String
  }

  input SendMessageInput {
    chatId: ID!
    text: String!
  }

  input MarkReadInput {
    messageId: ID!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # ----------------- QUERIES (>=6) -----------------

  type Query {
    # auth
    me: User

    # admin
    users: [User!]!

    # cars
    cars(filter: CarFilterInput): [Car!]!
    car(id: ID!): Car

    # inquiries
    inquiries: [Inquiry!]!       # manager/admin
    myInquiries: [Inquiry!]!     # client
    inquiry(id: ID!): Inquiry

    # reviews
    reviewsByCar(carId: ID!): [Review!]!

    # chat/messages
    myChats: [Chat!]!
    chat(id: ID!): Chat
    messages(chatId: ID!, limit: Int = 30): [Message!]!
  }

  # ----------------- MUTATIONS (>=6) -----------------

  type Mutation {
    # auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # admin
    setUserRole(userId: ID!, role: Role!): User!

    # manager/admin cars
    createCar(input: CarCreateInput!): Car!
    updateCar(id: ID!, input: CarUpdateInput!): Car!
    archiveCar(id: ID!): Car!   # soft delete by status=ARCHIVED

    # client inquiries
    createInquiry(input: InquiryCreateInput!): Inquiry!

    # manager/admin inquiries
    updateInquiryStatus(input: InquiryStatusInput!): Inquiry!

    # client reviews
    addReview(input: ReviewCreateInput!): Review!

    # chat/messages
    createChat(input: CreateChatInput!): Chat!
    sendMessage(input: SendMessageInput!): Message!
    markMessageRead(input: MarkReadInput!): Boolean!
  }

  # ----------------- SUBSCRIPTIONS (>=1) -----------------

  type Subscription {
    inquiryUpdated: Inquiry!
    messageAdded(chatId: ID!): Message!
  }
`;
