#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { AnalyzerService } from '../services/analyzer.service';
import { GitService } from '../services/git.service';
import { TempService } from '../services/temp.service';
import { ConsoleFormatter } from './formatters/console.formatter';
import { JsonFormatter } from './formatters/json.formatter';
import { HtmlFormatter } from './formatters/html.formatter';
// import { OutputFormat } from '../git-analyzer/dto/analyze-request.dto';

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
    'Output format (console, json, html, all)',
    'console',
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
        const analyzerService = new AnalyzerService(gitService, tempService);

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

function handleOutput(result: any, format: string, outputPath?: string): void {
  const formats = format === 'all' ? ['console', 'json', 'html'] : [format];

  for (const fmt of formats) {
    let content: string;
    let extension: string;

    let formatter: { format: (data: any) => string };
    switch (fmt) {
      case 'console': {
        formatter = new ConsoleFormatter();
        content = formatter.format(result);
        extension = 'txt';
        break;
      }

      case 'json': {
        formatter = new JsonFormatter();
        content = formatter.format(result);
        extension = 'json';
        break;
      }

      case 'html': {
        formatter = new HtmlFormatter();
        content = formatter.format(result);
        extension = 'html';
        break;
      }

      default:
        throw new Error(`Unsupported format: ${fmt}`);
    }

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
