import { IsUrl, IsOptional, IsEnum, IsString } from 'class-validator';

export enum OutputFormat {
  CONSOLE = 'console',
  JSON = 'json',
  HTML = 'html',
  ALL = 'all',
}

export class AnalyzeRequestDto {
  @IsUrl({}, { message: 'Repository URL must be a valid URL' })
  repositoryUrl: string;

  @IsOptional()
  @IsString()
  branch?: string = 'main';

  @IsOptional()
  @IsEnum(OutputFormat, {
    message: 'Format must be one of: console, json, html, all',
  })
  format?: OutputFormat = OutputFormat.JSON;

  @IsOptional()
  @IsString()
  outputPath?: string;
}
