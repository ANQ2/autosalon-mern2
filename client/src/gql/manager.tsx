import { gql } from "@apollo/client";

export const CREATE_CAR = gql`
  mutation CreateCar($input: CarCreateInput!) {
    createCar(input: $input) { id brand model year price }
  }
`;
