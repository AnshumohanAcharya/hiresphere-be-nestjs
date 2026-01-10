import { Injectable } from '@nestjs/common';
import { ScraperFactory } from './strategies/scraper.factory';
import { JobSource } from '@app/database';

@Injectable()
export class ScraperService {
  constructor(private readonly factory: ScraperFactory) {}

  async fetchJobList(source: JobSource, keyword: string, location: string) {
    const strategy = this.factory.getStrategy(source);
    return strategy.scrape(keyword, location);
  }

  async fetchJobDetail(source: JobSource, url: string) {
    const strategy = this.factory.getStrategy(source);
    return strategy.scrapeDetail(url);
  }
}
