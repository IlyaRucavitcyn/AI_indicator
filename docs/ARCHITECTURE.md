# Git Analyzer - Architecture Documentation

This document provides a comprehensive overview of the Git Analyzer system architecture, design decisions, and technical implementation.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture Layers](#architecture-layers)
- [Service Design](#service-design)
- [Data Flow](#data-flow)
- [CLI Architecture](#cli-architecture)
- [API Architecture](#api-architecture)
- [Testing Strategy](#testing-strategy)
- [Design Patterns](#design-patterns)
- [Security Considerations](#security-considerations)

---

## System Overview

Git Analyzer is a dual-interface application that provides Git repository analysis capabilities through both a command-line interface (CLI) and a RESTful API. The system clones repositories, analyzes commit history, and generates comprehensive metrics about repository activity and contributors.

### Key Components

1. **CLI Tool**: Standalone command-line application
2. **REST API**: NestJS-based HTTP API
3. **Core Services**: Shared business logic for Git operations and analysis
4. **Formatters**: Multiple output format generators (Console, JSON, HTML)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interfaces                       │
├──────────────────────────┬──────────────────────────────────┤
│      CLI (Commander)     │      REST API (NestJS)           │
│   - analyze command      │   - POST /git-analyzer/analyze   │
│   - format options       │   - POST /git-analyzer/health    │
└──────────────┬───────────┴──────────────┬───────────────────┘
               │                          │
               └──────────┬───────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                     Service Layer                             │
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ AnalyzerService │  │   GitService    │  │ TempService  │ │
│  │  - Orchestrator │  │ - Clone repos   │  │ - Temp dirs  │ │
│  │  - Calculate    │  │ - Read commits  │  │ - Cleanup    │ │
│  │    metrics      │  │ - Get info      │  │ - Path mgmt  │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
│           │                    │                   │         │
└───────────┼────────────────────┼───────────────────┼─────────┘
            │                    │                   │
            └────────────────────┼───────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   simple-git Library    │
                    │   - Git operations      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   File System / Git     │
                    └─────────────────────────┘
```

---

## Technology Stack

### Core Framework
- **NestJS** (v11.0.1): Progressive Node.js framework for building server-side applications
- **TypeScript** (v5.7.3): Type-safe JavaScript with modern features
- **Node.js** (v18+): JavaScript runtime

### Key Libraries

#### Git Operations
- **simple-git** (v3.28.0): Lightweight Git interface for Node.js

#### CLI Framework
- **commander** (v14.0.1): Command-line interface framework
- **chalk** (v5.6.2): Terminal string styling and colors
- **cli-table3** (v0.6.5): Pretty unicode tables for the terminal

#### Validation & Transformation
- **class-validator** (v0.14.2): Decorator-based validation
- **class-transformer** (v0.5.1): Object transformation and serialization

#### Development Tools
- **ESLint** (v9.18.0): Code linting
- **Prettier** (v3.4.2): Code formatting
- **Jest** (v30.0.0): Testing framework
- **Supertest** (v7.0.0): HTTP assertion library

---

## Project Structure

```
AI_indicator/
├── src/
│   ├── cli/                           # CLI tool implementation
│   │   ├── formatters/                # Output formatters
│   │   │   ├── console.formatter.ts   # Console table formatter
│   │   │   ├── json.formatter.ts      # JSON formatter
│   │   │   └── html.formatter.ts      # HTML report formatter
│   │   └── index.ts                   # CLI entry point (Commander)
│   │
│   ├── git-analyzer/                  # Core analysis module
│   │   ├── dto/                       # Data Transfer Objects
│   │   │   ├── analyze-request.dto.ts # API request schema
│   │   │   └── analyze-response.dto.ts# API response schema
│   │   │
│   │   ├── services/                  # Business logic services
│   │   │   ├── analyzer.service.ts    # Main analysis orchestrator
│   │   │   ├── git.service.ts         # Git operations wrapper
│   │   │   └── temp.service.ts        # Temporary directory manager
│   │   │
│   │   ├── git-analyzer.controller.ts # REST API controller
│   │   ├── git-analyzer.service.ts    # NestJS service wrapper
│   │   └── git-analyzer.module.ts     # NestJS module definition
│   │
│   ├── app.module.ts                  # Root NestJS module
│   └── main.ts                        # NestJS application entry point
│
├── test/                              # End-to-end tests
│   ├── app.e2e-spec.ts
│   ├── git-analyzer.e2e-spec.ts
│   └── jest-e2e.json
│
├── docs/                              # Documentation
│   ├── API.md                         # API reference
│   ├── ARCHITECTURE.md                # This file
│   └── DEVELOPMENT.md                 # Developer guide
│
└── dist/                              # Compiled JavaScript output
```

---

## Architecture Layers

### 1. Presentation Layer

**CLI Interface** (`src/cli/index.ts`)
- Command parsing with Commander.js
- User input validation
- Output formatting delegation
- Error display

**API Controller** (`src/git-analyzer/git-analyzer.controller.ts`)
- HTTP request handling
- DTO validation with decorators
- Response formatting
- Error handling with appropriate HTTP status codes

### 2. Service Layer

**AnalyzerService** - Main orchestrator
**GitService** - Git operations
**TempService** - Resource management
**GitAnalyzerService** - NestJS API wrapper

### 3. Data Layer

**DTOs** (Data Transfer Objects)
- Type-safe request/response schemas
- Validation rules
- Transformation logic

**Formatters**
- Console output with tables and colors
- JSON serialization
- HTML report generation

---

## Service Design

### TempService

**Purpose**: Manages temporary directories for cloning repositories

**Key Methods**:
```typescript
class TempService {
  createTempDir(repoName: string): string
  removeTempDir(dirPath: string): void
  cleanupAll(): void
  extractRepoName(url: string): string
  getRepoPath(repoName: string): string
}
```

**Responsibilities**:
- Create unique temporary directories
- Extract repository names from URLs
- Clean up temporary files after analysis
- Track all created directories for cleanup

**Design Decisions**:
- Uses OS temp directory (`os.tmpdir()`)
- Creates unique subdirectories per repository
- Maintains internal registry of created directories
- Ensures cleanup even on errors

---

### GitService

**Purpose**: Wraps simple-git library for Git operations

**Key Methods**:
```typescript
class GitService {
  cloneRepository(url: string, branch: string): Promise<{git, repoPath}>
  isValidRepository(git: SimpleGit): Promise<boolean>
  getCommitHistory(git: SimpleGit, branch: string): Promise<CommitInfo[]>
  getRepositoryInfo(git: SimpleGit): Promise<{branch, remote}>
  cleanupRepository(git: SimpleGit): void
}
```

**Responsibilities**:
- Clone repositories to temporary locations
- Validate repository structure
- Extract commit history with metadata
- Retrieve repository information

**Design Decisions**:
- Accepts TempService via dependency injection
- Returns structured commit data
- Handles Git-specific errors
- Validates repository before processing

---

### AnalyzerService

**Purpose**: Orchestrates analysis workflow and calculates metrics

**Key Methods**:
```typescript
class AnalyzerService {
  analyzeRepository(url: string, branch: string): Promise<AnalyzeResponseDto>
  calculateMetrics(commits: CommitInfo[], repoName: string, branch: string): AnalyzeResponseDto
}
```

**Responsibilities**:
- Coordinate GitService and TempService
- Calculate comprehensive metrics
- Aggregate contributor statistics
- Handle errors and cleanup

**Metrics Calculated**:
- Total commits count
- Unique contributors count
- First and last commit dates
- Repository duration in days
- Average commits per day
- Top contributor (by commit count)
- Per-contributor statistics

**Design Decisions**:
- Single responsibility: analysis only
- Delegates Git operations to GitService
- Ensures cleanup via try-finally blocks
- Returns standardized DTO format

---

### GitAnalyzerService

**Purpose**: NestJS-specific service wrapper for API

**Key Methods**:
```typescript
class GitAnalyzerService {
  analyzeRepository(request: AnalyzeRequestDto): Promise<AnalyzeResponseDto>
}
```

**Responsibilities**:
- Adapt AnalyzerService for NestJS dependency injection
- Handle API-specific request DTOs
- Provide consistent interface for controller

**Design Decisions**:
- Thin wrapper pattern
- Delegates to AnalyzerService
- Uses NestJS @Injectable decorator

---

## Data Flow

### CLI Analysis Flow

```
1. User runs CLI command
   ↓
2. Commander parses arguments and options
   ↓
3. CLI validates input
   ↓
4. Initialize services (TempService, GitService, AnalyzerService)
   ↓
5. AnalyzerService.analyzeRepository()
   ├→ TempService creates temp directory
   ├→ GitService clones repository
   ├→ GitService reads commit history
   ├→ AnalyzerService calculates metrics
   └→ TempService cleanup
   ↓
6. Format results based on --format option
   ├→ ConsoleFormatter: Display table
   ├→ JsonFormatter: Write JSON file
   ├→ HtmlFormatter: Write HTML report
   └→ All: Generate all formats
   ↓
7. Display success message or error
```

### API Analysis Flow

```
1. HTTP POST request to /git-analyzer/analyze
   ↓
2. NestJS validation pipe validates AnalyzeRequestDto
   ↓
3. GitAnalyzerController receives request
   ↓
4. GitAnalyzerService.analyzeRepository()
   ↓
5. AnalyzerService orchestrates analysis
   ├→ TempService creates temp directory
   ├→ GitService clones repository
   ├→ GitService reads commit history
   ├→ AnalyzerService calculates metrics
   └→ TempService cleanup
   ↓
6. Return AnalyzeResponseDto as JSON
   ↓
7. HTTP 201 response or 400 error
```

---

## CLI Architecture

### Command Structure

```typescript
program
  .command('analyze')
  .argument('<repository-url>')
  .option('-b, --branch <branch>', 'Branch to analyze', 'main')
  .option('-f, --format <format>', 'Output format', 'console')
  .option('-o, --output <path>', 'Output file path')
  .action(async (url, options) => { /* ... */ })
```

### Formatter Pattern

Each formatter implements a consistent interface:

```typescript
interface Formatter {
  format(result: AnalyzeResponseDto): string;
}
```

**ConsoleFormatter**:
- Uses cli-table3 for tables
- Uses chalk for colors
- Outputs to stdout

**JsonFormatter**:
- Pretty-prints JSON with 2-space indentation
- Can write to file or return string

**HtmlFormatter**:
- Generates styled HTML with embedded CSS
- Creates complete HTML document
- Writes to file

---

## API Architecture

### NestJS Module Structure

```typescript
@Module({
  providers: [
    TempService,
    GitService,
    AnalyzerService,
    GitAnalyzerService,
  ],
  controllers: [GitAnalyzerController],
})
export class GitAnalyzerModule {}
```

### Dependency Injection Flow

```
AppModule
  └→ GitAnalyzerModule
       ├→ GitAnalyzerController
       │    └→ GitAnalyzerService
       │         └→ AnalyzerService
       │              ├→ GitService
       │              │    └→ TempService
       │              └→ TempService
       └→ Services (Singletons)
```

### Validation Pipeline

```
HTTP Request
  ↓
ValidationPipe (NestJS)
  ↓
class-validator decorators
  - @IsUrl() on repositoryUrl
  - @IsEnum() on format
  - @IsString() on branch
  ↓
Validated AnalyzeRequestDto
  ↓
Controller method
```

---

## Testing Strategy

### Unit Tests

**Coverage**: Individual services in isolation

**Approach**:
- Mock dependencies using Jest
- Test each method independently
- Verify error handling
- Check edge cases

**Example**:
```typescript
// git.service.spec.ts
describe('GitService', () => {
  it('should clone repository successfully', async () => {
    jest.spyOn(simpleGit, 'clone').mockResolvedValue(/* ... */);
    const result = await gitService.cloneRepository(url, branch);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests (E2E)

**Coverage**: Complete API workflows

**Approach**:
- Test full request/response cycle
- Use supertest for HTTP assertions
- Mock Git operations to avoid actual cloning
- Verify error scenarios

**Example**:
```typescript
// git-analyzer.e2e-spec.ts
it('should analyze a valid repository', () => {
  return request(app.getHttpServer())
    .post('/git-analyzer/analyze')
    .send({ repositoryUrl, branch, format })
    .expect(201)
    .expect((res) => {
      expect(res.body).toHaveProperty('metrics');
    });
});
```

### Test Organization

```
src/
├── **/*.spec.ts           # Unit tests (co-located with source)
test/
├── *.e2e-spec.ts          # End-to-end tests
└── jest-e2e.json          # E2E test configuration
```

---

## Design Patterns

### 1. Dependency Injection

All services use constructor-based dependency injection:

```typescript
@Injectable()
export class AnalyzerService {
  constructor(
    private readonly gitService: GitService,
    private readonly tempService: TempService,
  ) {}
}
```

### 2. Service Layer Pattern

Business logic is encapsulated in dedicated services, separated from presentation logic.

### 3. DTO Pattern

Data Transfer Objects provide type safety and validation:

```typescript
export class AnalyzeRequestDto {
  @IsUrl()
  repositoryUrl: string;
  
  @IsOptional()
  @IsString()
  branch?: string;
}
```

### 4. Strategy Pattern

Formatters implement different output strategies:

```typescript
const formatter = format === 'json' ? new JsonFormatter() 
                : format === 'html' ? new HtmlFormatter()
                : new ConsoleFormatter();
```

### 5. Facade Pattern

AnalyzerService acts as a facade for complex Git operations:

```typescript
// Simplifies: clone → validate → read → calculate → cleanup
const result = await analyzerService.analyzeRepository(url, branch);
```

---

## Security Considerations

### Input Validation

- URL validation prevents malicious input
- Branch names are sanitized
- File paths are validated for output operations

### Temporary Files

- Unique temporary directories prevent conflicts
- Automatic cleanup prevents disk space exhaustion
- Cleanup occurs even on errors (try-finally)

### Error Handling

- Sensitive information is not exposed in errors
- Generic error messages for security
- Detailed logging for debugging (not exposed to users)

### Resource Limits

- Temporary files are cleaned up after analysis
- No persistent storage of cloned repositories
- Memory-efficient commit history processing

### Future Considerations

- Rate limiting for API endpoints
- Authentication for private repositories
- Request timeout limits
- Maximum repository size limits
- Concurrent request limits

---

## Performance Considerations

### Bottlenecks

1. **Repository Cloning**: Largest time consumer (network-dependent)
2. **Commit History Reading**: Scales with commit count
3. **Metrics Calculation**: O(n) complexity where n = commits

### Optimizations

- Shallow clones for faster downloads (future enhancement)
- Streaming commit history instead of loading all at once
- Efficient contributor aggregation using Maps
- Async/await for non-blocking operations

### Scalability

**Current Limitations**:
- Single-threaded Node.js process
- Sequential request processing
- Temporary directory on single server

**Future Improvements**:
- Queue-based background processing
- Worker threads for parallel analysis
- Distributed temporary storage
- Caching of repository analysis results

---

## Future Architecture Enhancements

1. **Caching Layer**: Redis for result caching
2. **Queue System**: Bull/BullMQ for background jobs
3. **Database**: PostgreSQL for persistent analysis history
4. **Microservices**: Separate analysis workers
5. **Authentication**: JWT-based API authentication
6. **WebSockets**: Real-time analysis progress updates
7. **Containerization**: Docker for deployment
8. **Monitoring**: Prometheus/Grafana for metrics

---

## Conclusion

The Git Analyzer architecture prioritizes:
- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Dependency injection and mocking support
- **Maintainability**: Clean code structure and documentation
- **Extensibility**: Easy to add new formatters or metrics
- **Type Safety**: TypeScript throughout
- **Error Resilience**: Comprehensive error handling and cleanup

