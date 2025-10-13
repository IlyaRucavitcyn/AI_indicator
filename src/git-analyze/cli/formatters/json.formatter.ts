import { AnalyzeResponseDto } from '../../routes/dto/analyze-response.dto';

export class JsonFormatter {
  /**
   * Formats analysis results as JSON
   * @param data Analysis results
   * @returns JSON string
   */
  format(data: AnalyzeResponseDto): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Formats analysis results as compact JSON
   * @param data Analysis results
   * @returns Compact JSON string
   */
  formatCompact(data: AnalyzeResponseDto): string {
    return JSON.stringify(data);
  }
}
