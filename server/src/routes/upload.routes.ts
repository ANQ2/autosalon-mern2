import { Router } from "express";
import { carImageUpload } from "../middlewares/upload";
import { buildContext } from "../graphql/context";
import { assertAuth, assertRole } from "../utils/errors";

export const uploadRouter = Router();

uploadRouter.post(
    "/car",
    (req, _res, next) => {
        const ctx = buildContext(req);
        assertAuth(ctx.user);
        assertRole(ctx.user, ["MANAGER", "ADMIN"]);
        next();
    },
    carImageUpload.single("image"),
    (req, res) => {
        const file = (req as any).file as Express.Multer.File;
        res.json({ url: `/uploads/cars/${file.filename}` });
    }
);
