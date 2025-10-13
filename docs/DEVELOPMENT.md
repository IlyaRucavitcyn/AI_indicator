# Git Analyzer - Development Guide

Complete guide for developers who want to contribute to or extend the Git Analyzer project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building](#building)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: v2.x or higher
- **Code Editor**: VS Code recommended

### Verify Installation

```bash
node --version    # Should be v18.x or higher
npm --version     # Should be v9.x or higher
git --version     # Should be v2.x or higher
```

---

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI_indicator
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- Production dependencies (NestJS, simple-git, commander, etc.)
- Development dependencies (ESLint, Prettier, Jest, TypeScript, etc.)

### 3. Verify Setup

```bash
# Run linter
npm run lint

# Run tests
npm run test

# Build project
npm run build
```

If all commands succeed, your setup is complete!

---

## Project Structure

```
AI_indicator/
├── src/                          # Source code
│   ├── cli/                      # CLI implementation
│   │   ├── formatters/           # Output formatters
│   │   │   ├── console.formatter.ts
│   │   │   ├── json.formatter.ts
│   │   │   └── html.formatter.ts
│   │   └── index.ts              # CLI entry point
│   │
│   ├── git-analyzer/             # Core module
│   │   ├── dto/                  # Data Transfer Objects
│   │   │   ├── analyze-request.dto.ts
│   │   │   └── analyze-response.dto.ts
│   │   │
│   │   ├── services/             # Business logic
│   │   │   ├── analyzer.service.ts
│   │   │   ├── analyzer.service.spec.ts
│   │   │   ├── git.service.ts
│   │   │   ├── git.service.spec.ts
│   │   │   ├── temp.service.ts
│   │   │   └── temp.service.spec.ts
│   │   │
│   │   ├── git-analyzer.controller.ts
│   │   ├── git-analyzer.controller.spec.ts
│   │   ├── git-analyzer.service.ts
│   │   ├── git-analyzer.service.spec.ts
│   │   └── git-analyzer.module.ts
│   │
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts                   # NestJS entry point
│
├── test/                         # E2E tests
│   ├── app.e2e-spec.ts
│   ├── git-analyzer.e2e-spec.ts
│   └── jest-e2e.json
│
├── docs/                         # Documentation
├── dist/                         # Compiled output
├── node_modules/                 # Dependencies
│
├── .gitignore                    # Git ignore rules
├── .prettierrc                   # Prettier config
├── eslint.config.mjs             # ESLint config
├── nest-cli.json                 # NestJS CLI config
├── package.json                  # Project metadata
├── tsconfig.json                 # TypeScript config
└── tsconfig.build.json           # Build config
```

---

## Code Standards

### TypeScript

- **Strict mode**: Enabled in `tsconfig.json`
- **Target**: ES2021
- **Module**: CommonJS
- **Type checking**: Strict null checks, no implicit any

### Code Style

Enforced by ESLint and Prettier:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing commas**: Required for multiline
- **Line length**: 80 characters (soft limit)

### Naming Conventions

- **Classes**: PascalCase (e.g., `AnalyzerService`)
- **Interfaces**: PascalCase (e.g., `GitMetrics`)
- **Methods**: camelCase (e.g., `analyzeRepository`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `OUTPUT_FORMAT`)
- **Private members**: Prefix with `private` keyword
- **Files**: kebab-case (e.g., `analyzer.service.ts`)

### Documentation

- **JSDoc comments**: For public methods and complex logic
- **Inline comments**: For non-obvious code sections
- **README updates**: When adding new features

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files using your preferred editor. VS Code is recommended with these extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### 3. Run Linter

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable errors
npm run lint
```

ESLint will automatically fix many issues. Manual fixes may be required for others.

### 4. Format Code

```bash
npm run format
```

This runs Prettier on all TypeScript files in `src/` and `test/`.

### 5. Run Tests

```bash
# All tests
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# Specific test file
npm run test -- analyzer.service.spec.ts

# Coverage report
npm run test:cov
```

### 6. Build Project

```bash
# Build everything
npm run build

# Build and prepare CLI
npm run build:cli
```

### 7. Test Locally

#### Test CLI:
```bash
node dist/cli/index.js analyze https://github.com/octocat/Hello-World.git
```

#### Test API:
```bash
# Terminal 1: Start server
npm run start:dev

# Terminal 2: Make request
curl -X POST http://localhost:3000/git-analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "https://github.com/octocat/Hello-World.git"}'
```

### 8. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

**Commit message format**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `style:` Code style changes
- `chore:` Build/config changes

---

## Testing

### Unit Tests

Located alongside source files (`*.spec.ts`).

**Run unit tests**:
```bash
npm run test
```

**Write a unit test**:
```typescript
import { Test } from '@nestjs/testing';
import { AnalyzerService } from './analyzer.service';
import { GitService } from './git.service';
import { TempService } from './temp.service';

describe('AnalyzerService', () => {
  let service: AnalyzerService;
  let gitService: GitService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AnalyzerService, GitService, TempService],
    }).compile();

    service = module.get<AnalyzerService>(AnalyzerService);
    gitService = module.get<GitService>(GitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate metrics correctly', () => {
    // Mock data
    const commits = [/* ... */];
    
    // Execute
    const result = service.calculateMetrics(commits, 'repo', 'main');
    
    // Assert
    expect(result.metrics.totalCommits).toBe(commits.length);
  });
});
```

### E2E Tests

Located in `test/` directory.

**Run E2E tests**:
```bash
npm run test:e2e
```

**Write an E2E test**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GitAnalyzer (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/git-analyzer/health (POST)', () => {
    return request(app.getHttpServer())
      .post('/git-analyzer/health')
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
      });
  });
});
```

### Test Coverage

```bash
npm run test:cov
```

Coverage reports are generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view.

**Coverage goals**:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## Building

### Development Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in `dist/` directory.

### Production Build

```bash
npm run build
```

Same as development build. NestJS doesn't differentiate between dev and prod builds.

### CLI Build

```bash
npm run build:cli
```

Builds the project and makes the CLI executable (`chmod +x dist/cli/index.js`).

### Build Output

```
dist/
├── cli/
│   ├── index.js              # CLI executable
│   └── formatters/
├── git-analyzer/
│   ├── services/
│   ├── dto/
│   └── ...
├── main.js                   # API entry point
└── *.js.map                  # Source maps
```

---

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeArgs": ["--nolazy", "-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/main.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "cwd": "${workspaceFolder}"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": [
        "${workspaceFolder}/src/cli/index.ts",
        "analyze",
        "https://github.com/octocat/Hello-World.git"
      ],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug with Chrome DevTools

```bash
npm run start:debug
```

Open `chrome://inspect` in Chrome and click "inspect" on the Node.js process.

### Logging

Add console.log statements for debugging:

```typescript
console.log('Analyzing repository:', repositoryUrl);
console.log('Commit count:', commits.length);
```

For production, consider using NestJS Logger:

```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(AnalyzerService.name);

this.logger.log('Starting analysis');
this.logger.error('Analysis failed', error);
```

---

## Contributing

### Code Review Checklist

Before submitting a pull request:

- [ ] Code follows style guidelines (ESLint + Prettier)
- [ ] All tests pass (`npm run test` and `npm run test:e2e`)
- [ ] New features have unit tests
- [ ] Code coverage hasn't decreased
- [ ] Documentation is updated (README, API docs, etc.)
- [ ] Commit messages follow conventions
- [ ] No console.log or debug code left in
- [ ] TypeScript strict mode compliance
- [ ] Error handling is comprehensive

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Linting passes
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

---

## Troubleshooting

### Common Issues

#### 1. TypeScript Compilation Errors

**Issue**: `Cannot find module` or type errors

**Solution**:
```bash
# Clear TypeScript cache
rm -rf dist/
rm tsconfig.build.tsbuildinfo

# Reinstall dependencies
rm -rf node_modules/
npm install

# Rebuild
npm run build
```

#### 2. Test Failures

**Issue**: Tests fail unexpectedly

**Solution**:
```bash
# Clear Jest cache
npm run test -- --clearCache

# Run tests in band (sequential)
npm run test -- --runInBand

# Run specific test
npm run test -- analyzer.service.spec.ts
```

#### 3. ESLint Errors

**Issue**: `Unsafe member access` or `any` type errors

**Solution**:
```typescript
// Add type assertions
const value = (obj as any).property;

// Or define proper types
interface MyType {
  property: string;
}
const value = (obj as MyType).property;
```

#### 4. Git Clone Failures

**Issue**: Repository cloning fails during analysis

**Solution**:
- Check network connectivity
- Verify repository URL is valid
- Ensure Git is installed (`git --version`)
- Check repository is public (or authentication is configured)

#### 5. Permission Errors

**Issue**: `EACCES` permission errors

**Solution**:
```bash
# CLI executable permissions
chmod +x dist/cli/index.js

# Temp directory permissions
# Ensure user has write access to OS temp directory
```

#### 6. Port Already in Use

**Issue**: `Address already in use` when starting API

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run start:dev
```

### Debug Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list --depth=0

# Verify TypeScript installation
npx tsc --version

# Check for outdated packages
npm outdated

# Audit for security issues
npm audit
```

### Getting Help

1. Check documentation in `docs/` directory
2. Search existing GitHub issues
3. Review error messages carefully
4. Check TypeScript and NestJS documentation
5. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (Node version, OS, etc.)

---

## Development Best Practices

### 1. Write Tests First (TDD)

```typescript
// 1. Write failing test
it('should calculate average commits per day', () => {
  const result = service.calculateAverage(commits, days);
  expect(result).toBe(0.5);
});

// 2. Implement feature
calculateAverage(commits: number, days: number): number {
  return Math.round((commits / days) * 100) / 100;
}

// 3. Test passes!
```

### 2. Keep Functions Small

```typescript
// Bad: One large function
analyzeRepository(url: string) {
  // 100 lines of code
}

// Good: Multiple focused functions
analyzeRepository(url: string) {
  const git = await this.cloneRepo(url);
  const commits = await this.getCommits(git);
  const metrics = this.calculateMetrics(commits);
  return this.formatResults(metrics);
}
```

### 3. Use Dependency Injection

```typescript
// Bad: Direct instantiation
class AnalyzerService {
  private gitService = new GitService();
}

// Good: Dependency injection
class AnalyzerService {
  constructor(private readonly gitService: GitService) {}
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  const result = await this.analyzeRepository(url);
  return result;
} catch (error) {
  this.logger.error('Analysis failed', error);
  throw new HttpException(
    `Analysis failed: ${(error as Error).message}`,
    HttpStatus.BAD_REQUEST,
  );
} finally {
  await this.cleanup();
}
```

### 5. Document Complex Logic

```typescript
/**
 * Calculates the average commits per day across the repository's lifetime.
 * 
 * @param totalCommits - Total number of commits
 * @param durationDays - Number of days between first and last commit
 * @returns Average commits per day, rounded to 2 decimal places
 */
private calculateAverage(totalCommits: number, durationDays: number): number {
  if (durationDays === 0) return 0;
  return Math.round((totalCommits / durationDays) * 100) / 100;
}
```

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [simple-git Documentation](https://github.com/steveukx/git-js)
- [Commander.js Documentation](https://github.com/tj/commander.js)

---

## License

UNLICENSED - Private project

## Questions?

For questions or issues, please create a GitHub issue with detailed information about your problem.

