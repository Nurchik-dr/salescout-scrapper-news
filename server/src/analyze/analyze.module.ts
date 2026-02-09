import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AnalyzeService } from './analyze.service';
import { AnalyzeController } from './analyze.controller';
import { VideoModule } from '../video/video.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Analysis, AnalysisSchema } from './schemas/analyze.schema';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { Company, CompanySchema } from '../company/schemas/company.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analysis.name, schema: AnalysisSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    HttpModule,
    ConfigModule,
    VideoModule,
    CompanyModule,
    AuthModule,
  ],
  controllers: [AnalyzeController],
  providers: [AnalyzeService],
  exports: [AnalyzeService],
})
export class AnalyzeModule {}
