import { v2 as cloudinary } from "cloudinary";

function getRequiredEnv(envName: string) {
  const value = process.env[envName];

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${envName}`);
  }

  return value;
}

cloudinary.config({
  cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
  api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

export { cloudinary };