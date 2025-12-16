import { gql } from "@apollo/client";

export const MY_CHATS = gql`
    query MyChats {
        myChats {
            id
            status
            lastMessageAt
            createdAt
            updatedAt
            car {
                id
            }
            customer {
                id
                username
                role
            }
            manager {
                id
                username
                role
            }
            lastMessage {
                id
                text
                kind
                createdAt
                author {
                    id
                    username
                    role
                }
            }
        }
    }
`;

export const CHAT = gql`
    query Chat($id: ID!) {
        chat(id: $id) {
            id
            status
            lastMessageAt
            createdAt
            updatedAt
            car {
                id
            }
            customer {
                id
                username
                role
            }
            manager {
                id
                username
                role
            }
            lastMessage {
                id
                text
                kind
                createdAt
                author {
                    id
                    username
                    role
                }
            }
        }
    }
`;

export const MESSAGES = gql`
    query ChatMessages($chatId: ID!) {
        chatMessages(chatId: $chatId) {
            id
            text
            kind
            createdAt
            updatedAt
            author {
                id
                username
                role
            }
            chat {
                id
            }
        }
    }
`;

export const CREATE_CAR_CHAT = gql`
    mutation CreateCarChat($carId: ID!) {
        createCarChat(carId: $carId) {
            id
        }
    }
`;

export const CREATE_SUPPORT_CHAT = gql`
    mutation CreateSupportChat {
        createSupportChat {
            id
        }
    }
`;

export const SEND_MESSAGE = gql`
    mutation SendMessage($chatId: ID!, $text: String!) {
        sendMessage(chatId: $chatId, text: $text) {
            id
            text
            kind
            createdAt
            updatedAt
            author {
                id
                username
                role
            }
            chat {
                id
            }
        }
    }
`;

export const MESSAGE_ADDED = gql`
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      text
      kind
      createdAt
      updatedAt
      author {
        id
        username
        role
      }
      chat {
        id
      }
    }
  }
`;