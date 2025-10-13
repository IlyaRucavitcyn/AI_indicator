# Git Analyzer API Reference

Complete REST API documentation for the Git Analyzer service.

## Base URL

```
http://localhost:3000
```

## Endpoints

### 1. Health Check

Check if the API service is running.

**Endpoint:** `POST /git-analyzer/health`

**Method:** `POST`

**Authentication:** None

**Request Body:** None

**Response:**

- **Status Code:** `201 Created`
- **Content-Type:** `application/json`

**Response Schema:**

```json
{
  "status": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:3000/git-analyzer/health
```

---

### 2. Analyze Repository

Analyze a Git repository and return comprehensive metrics.

**Endpoint:** `POST /git-analyzer/analyze`

**Method:** `POST`

**Authentication:** None

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `repositoryUrl` | string | Yes | - | Valid Git repository URL |
| `branch` | string | No | `"main"` | Branch name to analyze |
| `format` | string | No | `"json"` | Output format: `console`, `json`, `html`, or `all` |
| `outputPath` | string | No | - | File path for output (CLI only) |

**Request Schema (AnalyzeRequestDto):**

```typescript
{
  repositoryUrl: string;  // Must be a valid URL
  branch?: string;        // Default: "main"
  format?: "console" | "json" | "html" | "all";  // Default: "json"
  outputPath?: string;    // Optional output file path
}
```

**Validation Rules:**

- `repositoryUrl`: Must be a valid URL format
- `branch`: Optional string, defaults to "main"
- `format`: Must be one of: `console`, `json`, `html`, `all`
- `outputPath`: Optional string

**Response:**

- **Status Code:** `201 Created` (success)
- **Status Code:** `400 Bad Request` (validation error or analysis failure)
- **Content-Type:** `application/json`

**Success Response Schema (AnalyzeResponseDto):**

```typescript
{
  repository: string;     // Repository name (e.g., "owner/repo")
  branch: string;         // Analyzed branch name
  metrics: GitMetrics;    // Detailed metrics
  analyzedAt: string;     // ISO 8601 timestamp
}
```

**GitMetrics Schema:**

```typescript
{
  totalCommits: number;           // Total number of commits
  contributors: number;           // Number of unique contributors
  firstCommit: string;            // ISO 8601 timestamp of first commit
  lastCommit: string;             // ISO 8601 timestamp of last commit
  durationDays: number;           // Days between first and last commit
  avgCommitsPerDay: number;       // Average commits per day (rounded to 2 decimals)
  topContributor: string;         // Email of top contributor
  contributorStats: ContributorStats[];  // Detailed contributor breakdown
}
```

**ContributorStats Schema:**

```typescript
{
  email: string;        // Contributor email
  name: string;         // Contributor name
  commitCount: number;  // Number of commits by this contributor
}
```

**Example Request:**

```json
{
  "repositoryUrl": "https://github.com/octocat/Hello-World.git",
  "branch": "main",
  "format": "json"
}
```

**Example Success Response:**

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
      },
      {
        "email": "bob@example.com",
        "name": "Bob Johnson",
        "commitCount": 28
      }
    ]
  },
  "analyzedAt": "2024-01-15T10:30:45.123Z"
}
```

**Error Response Schema:**

```json
{
  "message": "string",
  "error": "string",
  "statusCode": number
}
```

**Example Error Responses:**

```json
// Invalid repository URL
{
  "message": "Analysis failed",
  "error": "Analysis failed: Repository not found",
  "statusCode": 400
}

// Validation error
{
  "message": "Bad Request",
  "error": [
    "Repository URL must be a valid URL"
  ],
  "statusCode": 400
}

// Network timeout
{
  "message": "Analysis failed",
  "error": "Analysis failed: Network timeout",
  "statusCode": 400
}
```

---

## Usage Examples

### cURL Examples

**Analyze a Repository:**

```bash
curl -X POST http://localhost:3000/git-analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/facebook/react.git",
    "branch": "main",
    "format": "json"
  }'
```

**Analyze a Specific Branch:**

```bash
curl -X POST http://localhost:3000/git-analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/vuejs/vue.git",
    "branch": "dev",
    "format": "json"
  }'
```

### JavaScript/TypeScript Examples

**Using Fetch API:**

```typescript
async function analyzeRepository(url: string, branch: string = 'main') {
  try {
    const response = await fetch('http://localhost:3000/git-analyzer/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repositoryUrl: url,
        branch: branch,
        format: 'json',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
}

// Usage
const result = await analyzeRepository('https://github.com/octocat/Hello-World.git');
console.log(`Total commits: ${result.metrics.totalCommits}`);
console.log(`Contributors: ${result.metrics.contributors}`);
console.log(`Top contributor: ${result.metrics.topContributor}`);
```

**Using Axios:**

```typescript
import axios from 'axios';

async function analyzeRepository(url: string, branch: string = 'main') {
  try {
    const response = await axios.post('http://localhost:3000/git-analyzer/analyze', {
      repositoryUrl: url,
      branch: branch,
      format: 'json',
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Analysis error:', error.response?.data);
    }
    throw error;
  }
}

// Usage
const result = await analyzeRepository('https://github.com/nestjs/nest.git', 'master');
console.log(result.metrics);
```

### Python Example

```python
import requests
import json

def analyze_repository(url, branch='main'):
    endpoint = 'http://localhost:3000/git-analyzer/analyze'
    
    payload = {
        'repositoryUrl': url,
        'branch': branch,
        'format': 'json'
    }
    
    try:
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        return None

# Usage
result = analyze_repository('https://github.com/django/django.git', 'main')
if result:
    print(f"Total commits: {result['metrics']['totalCommits']}")
    print(f"Contributors: {result['metrics']['contributors']}")
```

---

## Error Codes

| Status Code | Description | Example Cause |
|-------------|-------------|---------------|
| 201 | Created | Successful analysis |
| 400 | Bad Request | Invalid URL, validation error, repository not found, network error |
| 500 | Internal Server Error | Unexpected server error |

---

## Rate Limiting

Currently, there are no rate limits implemented. This may change in future versions.

---

## Common Error Scenarios

### 1. Invalid Repository URL

**Request:**
```json
{
  "repositoryUrl": "not-a-valid-url",
  "branch": "main"
}
```

**Response:**
```json
{
  "message": "Bad Request",
  "error": [
    "Repository URL must be a valid URL"
  ],
  "statusCode": 400
}
```

### 2. Repository Not Found

**Request:**
```json
{
  "repositoryUrl": "https://github.com/nonexistent/repo.git",
  "branch": "main"
}
```

**Response:**
```json
{
  "message": "Analysis failed",
  "error": "Analysis failed: Repository not found",
  "statusCode": 400
}
```

### 3. Invalid Branch

**Request:**
```json
{
  "repositoryUrl": "https://github.com/octocat/Hello-World.git",
  "branch": "nonexistent-branch"
}
```

**Response:**
```json
{
  "message": "Analysis failed",
  "error": "Analysis failed: Branch not found",
  "statusCode": 400
}
```

### 4. Missing Required Field

**Request:**
```json
{
  "branch": "main"
}
```

**Response:**
```json
{
  "message": "Bad Request",
  "error": [
    "repositoryUrl must be a URL address",
    "repositoryUrl should not be empty"
  ],
  "statusCode": 400
}
```

---

## Response Time

Response times vary based on repository size:

- **Small repositories** (< 100 commits): 2-5 seconds
- **Medium repositories** (100-1000 commits): 5-15 seconds
- **Large repositories** (> 1000 commits): 15-60+ seconds

The analysis includes cloning the repository, which is the most time-consuming operation.

---

## Best Practices

1. **Handle Timeouts**: Set appropriate timeout values for large repositories
2. **Error Handling**: Always implement proper error handling for network and validation errors
3. **Async Operations**: Use async/await or promises for non-blocking operations
4. **Validate Input**: Validate repository URLs on the client side before sending requests
5. **Monitor Progress**: For large repositories, consider implementing a polling mechanism or webhooks

---

## Versioning

Current API version: **v1** (implicit)

Future versions may include explicit versioning in the URL path (e.g., `/v2/git-analyzer/analyze`).

