import type { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../config/cloudinary.js";

type UploadResourceType = "image" | "video";

type UploadMediaServiceData = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  resourceType: UploadResourceType;
};

export type UploadMediaResult = {
  url: string;
  secure_url: string;
  public_id: string;
  resource_type: UploadResourceType;
  width: number | null;
  height: number | null;
  format: string;
  bytes: number;
  duration: number | null;
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

function uploadBufferToCloudinary(data: UploadMediaServiceData) {
  const folder = normalizeFolder(data.folder);

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: data.resourceType,
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

async function uploadMediaService(data: UploadMediaServiceData) {
  ensureCloudinaryEnv();

  if (data.resourceType === "image" && !data.mimeType.startsWith("image/")) {
    throw new Error("Arquivo inválido. Envie apenas imagens.");
  }

  if (data.resourceType === "video" && !data.mimeType.startsWith("video/")) {
    throw new Error("Arquivo inválido. Envie apenas vídeos.");
  }

  const uploadedMedia = await uploadBufferToCloudinary(data);

  const result: UploadMediaResult = {
    url: uploadedMedia.url,
    secure_url: uploadedMedia.secure_url,
    public_id: uploadedMedia.public_id,
    resource_type: data.resourceType,
    width: uploadedMedia.width ?? null,
    height: uploadedMedia.height ?? null,
    format: uploadedMedia.format,
    bytes: uploadedMedia.bytes,
    duration: uploadedMedia.duration ?? null,
    original_filename:
      uploadedMedia.original_filename || data.originalName || "arquivo",
  };

  return result;
}

export async function uploadImageService(
  data: Omit<UploadMediaServiceData, "resourceType">,
) {
  return uploadMediaService({
    ...data,
    resourceType: "image",
  });
}

export async function uploadVideoService(
  data: Omit<UploadMediaServiceData, "resourceType">,
) {
  return uploadMediaService({
    ...data,
    resourceType: "video",
  });
}