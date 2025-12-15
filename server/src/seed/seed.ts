import bcrypt from "bcrypt";
import { connectDb } from "../config/db";
import { UserModel } from "../models/User";
import { CarModel } from "../models/Car";
import { LeadModel } from "../models/Lead";
import { ChatModel } from "../models/Chat";
import { MessageModel } from "../models/Message";

async function seed() {
    await connectDb();

    await Promise.all([
        UserModel.deleteMany({}),
        CarModel.deleteMany({}),
        LeadModel.deleteMany({}),
        ChatModel.deleteMany({}),
        MessageModel.deleteMany({})
    ]);

    const admin = await UserModel.create({
        email: "admin@demo.com",
        passwordHash: await bcrypt.hash("admin1234", 10),
        role: "ADMIN",
        fullName: "Admin One"
    });

    const manager = await UserModel.create({
        email: "manager@demo.com",
        passwordHash: await bcrypt.hash("manager1234", 10),
        role: "MANAGER",
        fullName: "Manager One"
    });

    const customer = await UserModel.create({
        email: "customer@demo.com",
        passwordHash: await bcrypt.hash("customer1234", 10),
        role: "CUSTOMER",
        fullName: "Customer One"
    });

    const cars = await CarModel.insertMany([
        {
            title: "Mitsubishi Outlander 2007",
            brand: "Mitsubishi",
            model: "Outlander",
            year: 2007,
            price: 4310000,
            mileage: 386902,
            fuelType: "Gasoline",
            transmission: "CVT",
            status: "AVAILABLE",
            images: ["/uploads/cars/demo.jpg"]
        },
        {
            title: "Audi 90 1993",
            brand: "Audi",
            model: "90",
            year: 1993,
            price: 1700000,
            mileage: 220000,
            fuelType: "Gasoline",
            transmission: "MT",
            status: "AVAILABLE",
            images: ["/uploads/cars/demo2.jpg"]
        }
    ]);

    // lead (test drive)
    await LeadModel.create({
        type: "TEST_DRIVE",
        status: "NEW",
        customerId: customer._id,
        carId: cars[0]._id,
        assignedManagerId: manager._id,
        comment: "Хочу тест-драйв на выходных"
    });

    // chat for car
    const chat = await ChatModel.create({
        type: "CAR",
        status: "OPEN",
        carId: cars[0]._id,
        customerId: customer._id,
        managerId: manager._id,
        lastMessageAt: new Date()
    });

    await MessageModel.insertMany([
        { chatId: chat._id, authorId: customer._id, text: "Доброй ночи, есть ли крыша?" },
        { chatId: chat._id, authorId: manager._id, text: "Здравствуйте! Да, есть. Можем записать на осмотр." }
    ]);

    console.log("Seed done!");
    console.log("ADMIN    admin@demo.com / admin1234");
    console.log("MANAGER  manager@demo.com / manager1234");
    console.log("CUSTOMER customer@demo.com / customer1234");

    process.exit(0);
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
