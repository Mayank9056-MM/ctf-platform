import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import { config } from "../config/config";

// configure cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary and delete the local file after upload.
 * @param {string} localFilePath - The path to the file to be uploaded.
 * @returns {Promise<object>} - The response from Cloudinary containing the uploaded file information.
 * @throws {Error} - If there is an error while uploading the file or deleting the local file.
 */
const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // once the file is uploaded, we would like to delete it from our server
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

/**
 * Delete a file from Cloudinary.
 * @param {string} publicId - The public id of the file to be deleted.
 * @returns {Promise<void>} - A promise that resolves if the file is deleted successfully.
 * @throws {Error} - If there is an error while deleting the file.
 */
const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log("error deleting from cloudinary", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
