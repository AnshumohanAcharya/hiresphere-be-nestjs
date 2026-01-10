import { Injectable, Logger } from '@nestjs/common';
import { IScraperStrategy, ScrapedJobResult } from './scraper.strategy.interface';
import { JobSource } from '@app/database';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

@Injectable()
export class LinkedInStrategy implements IScraperStrategy {
  private readonly logger = new Logger(LinkedInStrategy.name);
  public readonly source = JobSource.LINKEDIN;

  async scrape(keyword: string, location: string): Promise<ScrapedJobResult[]> {
    this.logger.log(`Scraping LinkedIn for ${keyword} in ${location}...`);

    // Using LinkedIn's guest search URL
    const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;

    try {
      const { data } = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
      });

      const $ = cheerio.load(data);
      const results: ScrapedJobResult[] = [];

      $('.jobs-search__results-list li').each((_, el) => {
        const title = $(el).find('.base-search-card__title').text().trim();
        const companyName = $(el).find('.base-search-card__subtitle').text().trim();
        const url = $(el).find('.base-card__full-link').attr('href')?.split('?')[0];
        const externalId = url?.split('-').pop() || '';

        if (title && companyName && url) {
          results.push({
            externalId: `li-${externalId}`,
            title,
            companyName,
            url,
            source: JobSource.LINKEDIN,
            rawDescription: 'Click through to fetch full description...', // We'll handle this in the detail-scrape step
          });
        }
      });

      return results;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        this.logger.error(`LinkedIn scrape failed: ${error.message}`);
      }
      return [];
    }
  }

  async scrapeDetail(url: string): Promise<string> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // LinkedIn public job page selector for description
      const description = await page.textContent('.description__text');
      await browser.close();
      return description?.trim() || 'Description not found';
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}
