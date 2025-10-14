import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitAnalyzerModule } from './git-analyze/routes/git-analyzer.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, GitAnalyzerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
