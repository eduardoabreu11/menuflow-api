import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImageService } from "../services/uploadService.js";

type RequestWithFile = Request & {
  file?: Express.Multer.File | undefined;
};

export const uploadImageController = asyncHandler(
  async (req: Request, res: Response) => {
    const file = (req as RequestWithFile).file;

    if (!file) {
      return res.status(400).json({
        message: "Nenhuma imagem foi enviada.",
      });
    }

    const folder =
      typeof req.body.folder === "string" && req.body.folder.trim()
        ? req.body.folder.trim()
        : "serviu/uploads";

    const image = await uploadImageService({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder,
    });

    return res.status(201).json(image);
  },
);