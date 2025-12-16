import { carService } from '../services/car.service';
import { CarModel } from '../models/Car';

describe('CarService', () => {
    describe('createCar', () => {
        it('should create a new car', async () => {
            const input = {
                brand: 'Toyota',
                model: 'Camry',
                year: 2023,
                price: 25000,
                mileage: 0,
                color: 'White',
                fuel: 'GAS',
                transmission: 'AT',
                drive: 'FWD',
            };

            const car = await carService.createCar(input);

            expect(car).toHaveProperty('_id');
            expect(car.brand).toBe(input.brand);
            expect(car.model).toBe(input.model);
            expect(car.year).toBe(input.year);
            expect(car.price).toBe(input.price);
        });

        it('should throw error if required fields are missing', async () => {
            const invalidInput = {
                brand: 'Toyota',
            };

            await expect(carService.createCar(invalidInput)).rejects.toThrow();
        });
    });

    describe('listCars', () => {
        beforeEach(async () => {
            await CarModel.create([
                {
                    title: 'Toyota Camry',
                    brand: 'Toyota',
                    model: 'Camry',
                    year: 2023,
                    price: 25000,
                    mileage: 0,
                    fuelType: 'GAS',
                    transmission: 'AT',
                    drive: 'FWD',
                    status: 'AVAILABLE',
                },
                {
                    title: 'Honda Accord',
                    brand: 'Honda',
                    model: 'Accord',
                    year: 2022,
                    price: 23000,
                    mileage: 5000,
                    fuelType: 'HYBRID',
                    transmission: 'CVT',
                    drive: 'FWD',
                    status: 'AVAILABLE',
                },
                {
                    title: 'BMW X5',
                    brand: 'BMW',
                    model: 'X5',
                    year: 2021,
                    price: 45000,
                    mileage: 15000,
                    fuelType: 'DIESEL',
                    transmission: 'AT',
                    drive: 'AWD',
                    status: 'SOLD',
                },
            ]);
        });

        it('should list all cars without filter', async () => {
            const cars = await carService.listCars(undefined, undefined);
            expect(cars.length).toBeGreaterThanOrEqual(3);
        });

        it('should filter cars by brand', async () => {
            const cars = await carService.listCars({ brand: 'Toyota' }, undefined);
            expect(cars.length).toBeGreaterThanOrEqual(1);
            expect(cars[0].brand).toBe('Toyota');
        });

        it('should filter cars by price range', async () => {
            const cars = await carService.listCars(
                {
                    minPrice: 20000,
                    maxPrice: 30000,
                },
                undefined
            );
            expect(cars.length).toBeGreaterThanOrEqual(1);
        });

        it('should filter cars by status', async () => {
            const cars = await carService.listCars({ status: 'SOLD' }, undefined);
            expect(cars.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('updateCar', () => {
        it('should update car fields', async () => {
            const car = await CarModel.create({
                title: 'Toyota Camry',
                brand: 'Toyota',
                model: 'Camry',
                year: 2023,
                price: 25000,
                mileage: 0,
                fuelType: 'GAS',
                transmission: 'AT',
                drive: 'FWD',
                status: 'AVAILABLE',
            });

            const updated = await carService.updateCar(car._id.toString(), {
                price: 23000,
            });

            expect(updated.price).toBe(23000);
        });

        it('should throw error if car not found', async () => {
            await expect(
                carService.updateCar('507f1f77bcf86cd799439011', { price: 20000 })
            ).rejects.toThrow();
        });
    });
});