import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { Company, CompanySchema } from './schemas/company.schemas';
import { SearchTask, SearchTaskSchema } from '../search/schemas/search-query.schema';
import { Video, VideoSchema } from '../video/schemas/video.schema';
import { AnalysisTasks, AnalysisTasksSchema } from '../analysis-tasks/schemas/analyze-tasks.schema';
import { Analysis, AnalysisSchema } from '../analyze/schemas/analyze.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
      { name: SearchTask.name, schema: SearchTaskSchema },
      { name: Video.name, schema: VideoSchema },
      { name: AnalysisTasks.name, schema: AnalysisTasksSchema },
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
    AuthModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
