import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitAnalyzerModule } from './git-analyzer/git-analyzer.module';

@Module({
  imports: [GitAnalyzerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
