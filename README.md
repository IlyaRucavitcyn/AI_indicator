# Git Analyzer

A powerful Git repository analysis tool that provides comprehensive metrics and insights about repository activity, contributors, and development patterns. Available as both a CLI tool and a REST API.

## Features

- **Comprehensive Repository Analysis**: Analyze any Git repository by URL
- **Multiple Output Formats**: Console tables, JSON, HTML reports
- **Detailed Metrics**: Commits, contributors, duration, activity patterns
- **Dual Interface**: Command-line tool and REST API
- **Branch Analysis**: Analyze specific branches
- **Contributor Statistics**: Detailed breakdown by contributor
- **Easy Integration**: Built with NestJS and TypeScript

## Metrics Provided

- Total number of commits
- Number of contributors
- First and last commit dates
- Repository duration (in days)
- Average commits per day
- Top contributor identification
- Detailed per-contributor statistics (name, email, commit count)

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git installed on your system

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Copy the example environment file and configure as needed:

```bash
cp .env.example .env
```

Available environment variables:

- `PORT` - API server port (default: 3000)
- `NODE_ENV` - Environment mode: development, production, or test (default: development)

### Build the Project

```bash
# Build the entire project (API + CLI)
npm run build

# Build CLI specifically and make it executable
npm run build:cli
```

## Quick Start

### Using the CLI

After building, you can use the CLI tool:

```bash
# Analyze a repository with console output
npx git-analyzer analyze https://github.com/octocat/Hello-World.git

# Analyze a specific branch
npx git-analyzer analyze https://github.com/octocat/Hello-World.git -b develop

# Output as JSON
npx git-analyzer analyze https://github.com/octocat/Hello-World.git -f json

# Save JSON to file
npx git-analyzer analyze https://github.com/octocat/Hello-World.git -f json -o report.json

# Generate HTML report
npx git-analyzer analyze https://github.com/octocat/Hello-World.git -f html -o report.html

# Generate all formats
npx git-analyzer analyze https://github.com/octocat/Hello-World.git -f all
```

### Using the REST API

Start the API server:

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3000`.

## CLI Usage

### Command Syntax

```bash
git-analyzer analyze <repository-url> [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--branch <branch>` | `-b` | Branch to analyze | `main` |
| `--format <format>` | `-f` | Output format (console, json, html, all) | `console` |
| `--output <path>` | `-o` | Output file path (for json/html formats) | - |

### Examples

```bash
# Basic analysis with console output
git-analyzer analyze https://github.com/facebook/react.git

# Analyze specific branch
git-analyzer analyze https://github.com/facebook/react.git -b develop

# JSON output to file
git-analyzer analyze https://github.com/facebook/react.git -f json -o react-analysis.json

# HTML report
git-analyzer analyze https://github.com/facebook/react.git -f html -o react-report.html

# All formats (console + JSON + HTML)
git-analyzer analyze https://github.com/facebook/react.git -f all
```

## API Usage

### Health Check

**Endpoint:** `POST /git-analyzer/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Analyze Repository

**Endpoint:** `POST /git-analyzer/analyze`

**Request Body:**
```json
{
  "repositoryUrl": "https://github.com/octocat/Hello-World.git",
  "branch": "main",
  "format": "json"
}
```

**Response:**
```json
{
  "repository": "octocat/Hello-World",
  "branch": "main",
  "metrics": {
    "totalCommits": 125,
    "contributors": 15,
    "firstCommit": "2020-01-15T08:00:00.000Z",
    "lastCommit": "2024-01-15T10:00:00.000Z",
    "durationDays": 1461,
    "avgCommitsPerDay": 0.09,
    "topContributor": "john@example.com",
    "contributorStats": [
      {
        "email": "john@example.com",
        "name": "John Doe",
        "commitCount": 45
      },
      {
        "email": "jane@example.com",
        "name": "Jane Smith",
        "commitCount": 32
      }
    ]
  },
  "analyzedAt": "2024-01-15T10:30:00.000Z"
}
```

### Using cURL

```bash
# Analyze a repository
curl -X POST http://localhost:3000/git-analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/octocat/Hello-World.git",
    "branch": "main",
    "format": "json"
  }'

# Health check
curl -X POST http://localhost:3000/git-analyzer/health
```

### Using JavaScript/TypeScript

```typescript
const analyzeRepository = async (repoUrl: string, branch: string = 'main') => {
  const response = await fetch('http://localhost:3000/git-analyzer/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repositoryUrl: repoUrl,
      branch: branch,
      format: 'json',
    }),
  });

  const data = await response.json();
  return data;
};

// Usage
const result = await analyzeRepository('https://github.com/octocat/Hello-World.git');
console.log(result.metrics);
```

## Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Available environment variables:

- `PORT`: API server port (default: `3000`)
- `NODE_ENV`: Environment mode - `development`, `production`, or `test` (default: `development`)

**Note:** The `.env` file is ignored by git for security. Never commit sensitive configuration to version control.

### Output Formats

#### Console
Formatted table output with colored text, displayed in the terminal.

#### JSON
Machine-readable JSON format, can be saved to file or returned by API.

#### HTML
Beautiful HTML report with styled tables and formatting, saved to file.

#### All
Generates console output, JSON file, and HTML file simultaneously.

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch

# Performance tests
npm run perf              # Run all performance tests
npm run perf:basic        # Basic metrics performance
npm run perf:all          # All services comparison
npm run perf:scanner      # File system scanner performance
npm run perf:code-analyzers  # Code analyzers performance
npm run perf:analyzer     # Full integration performance
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Development Mode

```bash
# Start API in watch mode
npm run start:dev

# Start with debugging
npm run start:debug
```

## Project Structure

```
AI_indicator/
├── src/
│   ├── cli/                      # CLI tool
│   │   ├── formatters/           # Output formatters
│   │   │   ├── console.formatter.ts
│   │   │   ├── json.formatter.ts
│   │   │   └── html.formatter.ts
│   │   └── index.ts              # CLI entry point
│   ├── git-analyzer/             # Core analysis module
│   │   ├── dto/                  # Data Transfer Objects
│   │   │   ├── analyze-request.dto.ts
│   │   │   └── analyze-response.dto.ts
│   │   ├── services/             # Business logic
│   │   │   ├── analyzer.service.ts
│   │   │   ├── git.service.ts
│   │   │   └── temp.service.ts
│   │   ├── git-analyzer.controller.ts
│   │   ├── git-analyzer.service.ts
│   │   └── git-analyzer.module.ts
│   ├── app.module.ts             # Root module
│   └── main.ts                   # API entry point
├── test/                         # E2E tests
├── docs/                         # Documentation
└── dist/                         # Compiled output
```

## Documentation

- [API Reference](docs/API.md) - Detailed API documentation
- [Architecture](docs/ARCHITECTURE.md) - System design and architecture
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and development setup

## Technologies

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **simple-git** - Git operations
- **Commander** - CLI framework
- **chalk** - Terminal colors
- **cli-table3** - Terminal tables
- **class-validator** - DTO validation
- **Jest** - Testing framework

## Error Handling

The tool provides clear error messages for common issues:

- Invalid repository URLs
- Network connectivity problems
- Authentication failures
- Missing or invalid branches
- Repository access errors

## Limitations

- Requires Git to be installed on the system
- Clones repositories temporarily (requires disk space)
- Public repositories only (unless authentication is configured)
- Large repositories may take time to clone and analyze

## License

UNLICENSED - Private project

## Support

For issues, questions, or contributions, please refer to the [Development Guide](docs/DEVELOPMENT.md).

## Version

Current version: 0.0.1
