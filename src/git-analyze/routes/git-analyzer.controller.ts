import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AnalyzerService } from '../services/analyzer.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

@Controller('git-analyzer')
export class GitAnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  /**
   * Analyzes a Git repository
   * @param request Analysis request
   * @returns Analysis results
   */
  @Post('analyze')
  async analyzeRepository(
    @Body() request: AnalyzeRequestDto,
  ): Promise<AnalyzeResponseDto> {
    try {
      return await this.analyzerService.analyzeRepository(
        request.repositoryUrl,
        request.branch,
      );
    } catch (error) {
      throw new HttpException(
        {
          message: 'Analysis failed',
          error: (error as Error).message,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Health check endpoint
   * @returns Service status
   */
  @Post('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
