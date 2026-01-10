import { Injectable } from '@nestjs/common';
import { LinkedInStrategy } from './linkedin.strategy';
import { IScraperStrategy } from './scraper.strategy.interface';
import { JobSource } from '@app/database';

@Injectable()
export class ScraperFactory {
  constructor(private readonly linkedin: LinkedInStrategy) {}

  getStrategy(source: JobSource): IScraperStrategy {
    switch (source) {
      case JobSource.LINKEDIN:
        return this.linkedin;
      default:
        throw new Error(`No strategy found for ${source}`);
    }
  }
}
