import { getEnvOrThrow } from '@/common/utils/env-validator.util';
import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: getEnvOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: getEnvOrThrow('CLOUDINARY_API_KEY'),
      api_secret: getEnvOrThrow('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary
   * @param fileBuffer - Buffer of the file to upload
   * @param folder - Folder path in Cloudinary
   * @param resourceType - Type of resource (image, video, raw, auto)
   * @returns Promise with Cloudinary upload response
   */
  async uploadFile(
    fileBuffer: Buffer,
    folder: string = 'resumes',
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'raw',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new BadRequestException(`File upload failed: ${error.message}`));
          } else if (result) {
            resolve(result);
          } else {
            reject(new BadRequestException('File upload failed'));
          }
        },
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Upload a file from base64 string
   * @param base64String - Base64 encoded file string
   * @param folder - Folder path in Cloudinary
   * @param resourceType - Type of resource
   * @returns Promise with Cloudinary upload response
   */
  async uploadBase64(
    base64String: string,
    folder: string = 'resumes',
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'raw',
  ): Promise<UploadApiResponse> {
    try {
      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
      };

      // Set allowed formats based on resource type
      if (resourceType === 'image') {
        uploadOptions.allowed_formats = ['jpg', 'jpeg', 'png', 'webp'];
        uploadOptions.transformation = [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
        ];
      } else if (resourceType === 'raw') {
        uploadOptions.allowed_formats = ['pdf', 'doc', 'docx', 'txt'];
      }

      const result = await cloudinary.uploader.upload(base64String, uploadOptions);
      return result;
    } catch (error: any) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @param resourceType - Type of resource
   * @returns Promise with deletion result
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'raw',
  ): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error: any) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }
}
