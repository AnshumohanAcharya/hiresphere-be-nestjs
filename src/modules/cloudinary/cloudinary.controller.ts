import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  async uploadImage(@Body() body: { base64: string; folder?: string }) {
    const { base64, folder = 'avatars' } = body;

    if (!base64) {
      throw new Error('No image data provided');
    }

    // Upload to Cloudinary
    const result = await this.cloudinaryService.uploadBase64(
      base64,
      folder,
      'image', // resource type for images
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
