import { Module } from '@nestjs/common';
import { GitAnalyzerModule } from './git-analyze/routes/git-analyzer.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, GitAnalyzerModule],
})
export class AppModule {}
