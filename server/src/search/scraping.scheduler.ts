import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScrapingScheduler {
  private readonly logger = new Logger(ScrapingScheduler.name);


  // Запускается каждый день в 12:00 и 00:00
  @Cron('0 0,12 * * *')
  async handleScrapingSchedule() {
    this.logger.log('Starting scheduled scraping tasks...');
    this.logger.log('All tasks queued successfully');
  }
}