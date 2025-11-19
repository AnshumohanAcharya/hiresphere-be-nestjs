import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { AudioAuthGuard } from './modules/auth/guards/audio-auth.guard';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('audio/:filename')
  @UseGuards(AudioAuthGuard)
  serveAudio(@Param('filename') filename: string, @Res() res: Response): void {
    const audioDir = path.join(process.cwd(), 'uploads', 'audio');
    // Try both .wav and .aiff extensions
    let filePath = path.join(audioDir, filename);
    if (!fs.existsSync(filePath)) {
      // Try .aiff if .wav doesn't exist
      const aiffPath = filePath.replace(/\.wav$/, '.aiff');
      if (fs.existsSync(aiffPath)) {
        filePath = aiffPath;
      } else {
        res
          .status(404)
          .json({ error: 'Audio file not found', filename, tried: [filePath, aiffPath] });
        return;
      }
    }

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.aiff' ? 'audio/aiff' : 'audio/wav';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
