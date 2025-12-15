import { gql } from "@apollo/client";

export const CARS = gql`
  query Cars($filter: CarFilterInput) {
    cars(filter: $filter) { id brand model year price mileage fuel status color }
  }
`;

export const CAR = gql`
  query Car($id: ID!) {
    car(id: $id) { id brand model year price mileage fuel status color images }
  }
`;
