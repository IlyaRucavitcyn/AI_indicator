#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { AnalyzerService } from '../services/analyzer.service';
import { GitService } from '../services/git.service';
import { TempService } from '../services/temp.service';
import { BasicMetricsService } from '../services/metrics/basic-metrics.service';
import { GitSizeService } from '../services/metrics/ai-indicators/git-size.service';
import { GitMessagesService } from '../services/metrics/ai-indicators/git-messages.service';
import { GitTimingService } from '../services/metrics/ai-indicators/git-timing.service';
import { CodeQualityService } from '../services/metrics/ai-indicators/code-quality.service';
import { ConsoleFormatter } from './formatters/console.formatter';
import { JsonFormatter } from './formatters/json.formatter';
import { HtmlFormatter } from './formatters/html.formatter';
import { AnalyzeResponseDto } from '../routes/dto/analyze-response.dto';
import { OutputFormat } from '../routes/dto/analyze-request.dto';

interface Formatter {
  format: (data: AnalyzeResponseDto) => string;
}

interface FormatterConfig {
  formatter: new () => Formatter;
  extension: string;
}

const FORMATTERS: Record<OutputFormat, FormatterConfig> = {
  [OutputFormat.CONSOLE]: { formatter: ConsoleFormatter, extension: 'txt' },
  [OutputFormat.JSON]: { formatter: JsonFormatter, extension: 'json' },
  [OutputFormat.HTML]: { formatter: HtmlFormatter, extension: 'html' },
  [OutputFormat.ALL]: { formatter: ConsoleFormatter, extension: 'txt' }, // placeholder, not used
};

const program = new Command();

program
  .name('git-analyzer')
  .description(
    'Analyze Git repositories for commit statistics and development metrics',
  )
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze a Git repository')
  .argument('<repository-url>', 'Git repository URL to analyze')
  .option('-b, --branch <branch>', 'Branch to analyze', 'main')
  .option(
    '-f, --format <format>',
    `Output format (${Object.values(OutputFormat).join(', ')})`,
    OutputFormat.CONSOLE,
  )
  .option('-o, --output <path>', 'Output file path (for json/html formats)')
  .action(
    async (
      repositoryUrl: string,
      options: { branch: string; format: string; output?: string },
    ) => {
      try {
        console.log(chalk.blue('🔍 Starting Git repository analysis...'));
        console.log(chalk.gray(`Repository: ${repositoryUrl}`));
        console.log(chalk.gray(`Branch: ${options.branch}`));
        console.log(chalk.gray(`Format: ${options.format}`));
        console.log('');

        // Initialize services
        const tempService = new TempService();
        const gitService = new GitService(tempService);
        const basicMetricsService = new BasicMetricsService();
        const gitSizeService = new GitSizeService();
        const gitMessagesService = new GitMessagesService();
        const gitTimingService = new GitTimingService();
        const codeQualityService = new CodeQualityService();
        const analyzerService = new AnalyzerService(
          gitService,
          tempService,
          basicMetricsService,
          gitSizeService,
          gitMessagesService,
          gitTimingService,
          codeQualityService,
        );

        // Perform analysis
        const result = await analyzerService.analyzeRepository(
          repositoryUrl,
          options.branch,
        );

        // Format and output results
        handleOutput(result, options.format, options.output);

        console.log(chalk.green('✅ Analysis completed successfully!'));
      } catch (error) {
        console.error(
          chalk.red('❌ Analysis failed:'),
          (error as Error).message,
        );
        process.exit(1);
      }
    },
  );

function handleOutput(
  result: AnalyzeResponseDto,
  format: string,
  outputPath?: string,
): void {
  const outputFormat = format as OutputFormat;
  const formats =
    outputFormat === OutputFormat.ALL
      ? [OutputFormat.CONSOLE, OutputFormat.JSON, OutputFormat.HTML]
      : [outputFormat];

  for (const fmt of formats) {
    const formatterConfig = FORMATTERS[fmt];
    if (!formatterConfig) {
      throw new Error(`Unsupported format: ${fmt}`);
    }

    const formatter = new formatterConfig.formatter();
    const content = formatter.format(result);
    const extension = formatterConfig.extension;

    if (outputPath && formats.length === 1) {
      // Single format with specific output path
      const fullPath = path.resolve(outputPath);
      fs.writeFileSync(fullPath, content);
      console.log(chalk.green(`📄 Output saved to: ${fullPath}`));
    } else if (outputPath && formats.length > 1) {
      // Multiple formats with output directory
      const outputDir = path.resolve(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const filename = `git-analysis-${Date.now()}.${extension}`;
      const fullPath = path.join(outputDir, filename);
      fs.writeFileSync(fullPath, content);
      console.log(chalk.green(`📄 ${fmt.toUpperCase()} saved to: ${fullPath}`));
    } else {
      // Console output
      console.log(content);
      if (formats.length > 1) {
        console.log(chalk.gray('─'.repeat(50)));
      }
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();
