import { Module } from '@nestjs/common';
import { GitAnalyzerController } from './git-analyzer.controller';
import { AnalyzerService } from '../services/analyzer.service';
import { GitService } from '../services/git.service';
import { TempService } from '../services/temp.service';

@Module({
  controllers: [GitAnalyzerController],
  providers: [AnalyzerService, GitService, TempService],
  exports: [AnalyzerService],
})
export class GitAnalyzerModule {}
