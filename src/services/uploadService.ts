import type { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../config/cloudinary.js";

type UploadImageServiceData = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
};

export type UploadImageResult = {
  url: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  original_filename: string;
};

function ensureCloudinaryEnv() {
  const requiredEnv = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingEnv = requiredEnv.filter((envName) => !process.env[envName]);

  if (missingEnv.length > 0) {
    throw new Error(
      `Configuração do Cloudinary incompleta. Variáveis ausentes: ${missingEnv.join(
        ", ",
      )}`,
    );
  }
}

function normalizeFolder(folder?: string) {
  if (!folder) {
    return "serviu/uploads";
  }

  return folder
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

function uploadBufferToCloudinary(data: UploadImageServiceData) {
  const folder = normalizeFolder(data.folder);

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary não retornou resultado do upload."));
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(data.buffer);
  });
}

export async function uploadImageService(data: UploadImageServiceData) {
  ensureCloudinaryEnv();

  if (!data.mimeType.startsWith("image/")) {
    throw new Error("Arquivo inválido. Envie apenas imagens.");
  }

  const uploadedImage = await uploadBufferToCloudinary(data);

  const result: UploadImageResult = {
    url: uploadedImage.url,
    secure_url: uploadedImage.secure_url,
    public_id: uploadedImage.public_id,
    width: uploadedImage.width,
    height: uploadedImage.height,
    format: uploadedImage.format,
    bytes: uploadedImage.bytes,
    original_filename:
      uploadedImage.original_filename || data.originalName || "imagem",
  };

  return result;
}