import { Module } from '@nestjs/common';
import { GitAnalyzerController } from './git-analyzer.controller';
import { AnalyzerService } from '../services/analyzer.service';
import { GitService } from '../services/git.service';
import { TempService } from '../services/temp.service';
import { BasicMetricsService } from '../services/metrics/basic-metrics.service';
import { GitSizeService } from '../services/metrics/ai-indicators/git-size.service';
import { GitMessagesService } from '../services/metrics/ai-indicators/git-messages.service';
import { GitTimingService } from '../services/metrics/ai-indicators/git-timing.service';
import { CodeQualityService } from '../services/metrics/ai-indicators/code-quality.service';
import { CodeCommentAnalysisService } from '../services/metrics/ai-indicators/code-comment-analysis.service';
import { CodeNonTypicalExpressionsService } from '../services/metrics/ai-indicators/code-non-typical-expressions.service';
import { FileSystemScannerService } from '../services/metrics/ai-indicators/file-system-scanner.service';

@Module({
  controllers: [GitAnalyzerController],
  providers: [
    AnalyzerService,
    GitService,
    TempService,
    BasicMetricsService,
    GitSizeService,
    GitMessagesService,
    GitTimingService,
    CodeQualityService,
    FileSystemScannerService,
    CodeCommentAnalysisService,
    CodeNonTypicalExpressionsService,
  ],
  exports: [AnalyzerService],
})
export class GitAnalyzerModule {}
