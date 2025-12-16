import { gql } from "@apollo/client";

export const USERS = gql`
  query Users { users { id email username role } }
`;

export const SET_USER_ROLE = gql`
  mutation SetUserRole($userId: ID!, $role: Role!) {
    setUserRole(userId: $userId, role: $role) { id role }
  }
`;
