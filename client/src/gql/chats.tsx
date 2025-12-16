import { gql } from "@apollo/client";

export const MY_CHATS = gql`
  query MyChats {
    myChats { id title lastMessageAt participants { id username role } inquiry { id } }
  }
`;

export const CHAT = gql`
  query Chat($id: ID!) {
    chat(id: $id) { id title participants { id username role } inquiry { id } }
  }
`;

export const MESSAGES = gql`
  query Messages($chatId: ID!, $limit: Int) {
    messages(chatId: $chatId, limit: $limit) {
      id text kind createdAt sender { id username role }
      chat { id }
    }
  }
`;

export const CREATE_CHAT = gql`
  mutation CreateChat($input: CreateChatInput!) {
    createChat(input: $input) { id }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id text createdAt sender { id username role } chat { id }
    }
  }
`;

export const MESSAGE_ADDED = gql`
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id text createdAt sender { id username role } chat { id }
    }
  }
`;
