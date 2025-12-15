import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) { token user { id email username role } }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) { token user { id email username role } }
  }
`;

export const ME = gql`
  query Me { me { id email username role } }
`;
