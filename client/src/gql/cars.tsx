import { gql } from "@apollo/client";

export const CARS = gql`
    query Cars($filter: CarFilterInput) {
        cars(filter: $filter) {
            id brand model year price mileage fuel status color
        }
    }
`;

export const CAR = gql`
    query Car($id: ID!) {
        car(id: $id) {
            id brand model year price mileage fuel status color images
        }
    }
`;

export const CREATE_CAR = gql`
  mutation CreateCar($input: CarCreateInput!) {
    createCar(input: $input) {
      id
      brand
      model
      year
      price
      mileage
      fuel
      transmission
      drive
      status
      color
      vin
      description
      images
      createdAt
      updatedAt
    }
  }
`;