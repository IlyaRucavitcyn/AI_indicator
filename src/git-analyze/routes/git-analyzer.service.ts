import { Injectable } from '@nestjs/common';
import { AnalyzerService } from '../services/analyzer.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

@Injectable()
export class GitAnalyzerService {
  constructor(private readonly analyzerService: AnalyzerService) { }

  /**
   * Analyzes a Git repository via API
   * @param request Analysis request
   * @returns Analysis results
   */
  async analyzeRepository(
    request: AnalyzeRequestDto,
  ): Promise<AnalyzeResponseDto> {
    return this.analyzerService.analyzeRepository(
      request.repositoryUrl,
      request.branch,
    );
  }
}
