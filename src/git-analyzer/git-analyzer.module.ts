import { Module } from '@nestjs/common';
import { GitAnalyzerController } from './git-analyzer.controller';
import { GitAnalyzerService } from './git-analyzer.service';
import { AnalyzerService } from './services/analyzer.service';
import { GitService } from './services/git.service';
import { TempService } from './services/temp.service';

@Module({
  controllers: [GitAnalyzerController],
  providers: [GitAnalyzerService, AnalyzerService, GitService, TempService],
  exports: [GitAnalyzerService],
})
export class GitAnalyzerModule {}
