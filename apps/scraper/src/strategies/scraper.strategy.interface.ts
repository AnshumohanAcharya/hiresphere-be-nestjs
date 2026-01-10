import { JobSource } from '@app/database'; // From your Prisma enum

export interface ScrapedJobResult {
  externalId: string;
  title: string;
  companyName: string;
  source: JobSource;
  url: string;
  location?: string;
  rawDescription: string;
  salaryRaw?: string;
  postedAt?: Date;
}

export interface IScraperStrategy {
  source: JobSource;
  scrape(keyword: string, location: string): Promise<ScrapedJobResult[]>;
  scrapeDetail(url: string): Promise<string>; // 👈 Returns full description
}
