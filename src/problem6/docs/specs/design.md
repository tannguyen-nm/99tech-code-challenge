# System Architecture Design - Live Scoreboard System

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Browser    │  │   Browser    │  │   Browser    │              │
│  │  (WebSocket) │  │  (WebSocket) │  │  (WebSocket) │  ...         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                         EDGE LAYER                                  │
│                    ┌───────▼────────┐                               │
│                    │  CDN / WAF     │                               │
│                    │  (CloudFlare)  │                               │
│                    └───────┬────────┘                               │
│                            │                                        │
│                    ┌───────▼────────┐                               │
│                    │ Load Balancer  │                               │
│                    │  (NGINX/ALB)   │                               │
│                    └───────┬────────┘                               │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
┌───────────────────▼──────┐  ┌───────▼──────────────────┐
│   APPLICATION LAYER      │  │   APPLICATION LAYER      │
│  ┌────────────────────┐  │  │  ┌────────────────────┐  │
│  │   API Server 1     │  │  │  │   API Server 2     │  │
│  │  (Express + TS)    │  │  │  │  (Express + TS)    │  │
│  ├────────────────────┤  │  │  ├────────────────────┤  │
│  │  - Auth Middleware │  │  │  │  - Auth Middleware │  │
│  │  - Rate Limiter    │  │  │  │  - Rate Limiter    │  │
│  │  - Controllers     │  │  │  │  - Controllers     │  │
│  │  - Services        │  │  │  │  - Services        │  │
│  │  - Validators      │  │  │  │  - Validators      │  │
│  └─────────┬──────────┘  │  │  └─────────┬──────────┘  │
│            │             │  │            │             │
│  ┌─────────▼──────────┐  │  │  ┌─────────▼──────────┐  │
│  │ WebSocket Server 1 │  │  │  │ WebSocket Server 2 │  │
│  │   (Socket.IO)      │  │  │  │   (Socket.IO)      │  │
│  └─────────┬──────────┘  │  │  └─────────┬──────────┘  │
└────────────┼─────────────┘  └────────────┼─────────────┘
             │                             │
             └──────────┬──────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────┐
│                   CACHING LAYER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Redis Cluster                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Master     │  │   Replica    │  │  Sentinel  │  │  │
│  │  │              │  │              │  │            │  │  │
│  │  │ - Sessions   │→→│ - Sessions   │  │ - Monitor  │  │  │
│  │  │ - Cache      │→→│ - Cache      │  │ - Failover │  │  │
│  │  │ - Pub/Sub    │→→│ - Pub/Sub    │  │            │  │  │
│  │  │ - Rate Limit │→→│ - Rate Limit │  │            │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Cluster                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Primary    │  │  Replica 1   │  │  Replica 2   │  │  │
│  │  │              │  │  (Read-only) │  │  (Read-only) │  │  │
│  │  │ - users      │→→│ - users      │  │ - users      │  │  │
│  │  │ - actions    │→→│ - actions    │  │ - actions    │  │  │
│  │  │ - sessions   │→→│ - sessions   │  │ - sessions   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────┐
│                   OBSERVABILITY LAYER                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Prometheus  │  │    Grafana   │  │  ELK Stack   │  │
│  │   (Metrics)  │  │ (Dashboards) │  │   (Logs)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 1.2 Component Interaction Flow

```
User Action Flow (Score Increment):
───────────────────────────────────

1. Client → API: POST /api/actions/token (with JWT)
2. API → Redis: Check rate limit (10/min)
3. API → Crypto: Generate token (HMAC-SHA256)
4. API → Redis: Store token (60s TTL)
5. API → Client: Return action token
6. Client waits for user action completion
7. Client → API: POST /api/scores/increment (with token)
8. API → Redis: Validate token (exists, not used, not expired)
9. API → Redis: Mark token as used
10. API → DB: BEGIN TRANSACTION
11. API → DB: UPDATE users SET score = score + 1 WHERE user_id = ?
12. API → DB: INSERT INTO actions (user_id, token, timestamp)
13. API → DB: COMMIT TRANSACTION
14. API → Redis: Invalidate leaderboard cache
15. API → Redis: PUBLISH score_update event
16. WebSocket Servers → Redis: SUBSCRIBE to score_update
17. WebSocket → Clients: Broadcast new leaderboard
18. API → Client: Return success response
```

## 2. Detailed Component Design

### 2.1 API Server Architecture

```
src/
├── index.ts                    # Application entry point
├── server.ts                   # Express server setup
├── config/
│   ├── environment.ts          # Environment variables
│   ├── database.ts             # Database configuration
│   ├── redis.ts                # Redis configuration
│   └── security.ts             # Security settings
├── middleware/
│   ├── authentication.ts       # JWT validation
│   ├── rate-limiter.ts         # Rate limiting logic
│   ├── error-handler.ts        # Global error handler
│   ├── request-logger.ts       # Request/response logging
│   └── cors.ts                 # CORS configuration
├── controllers/
│   ├── auth.controller.ts      # Authentication endpoints
│   ├── action.controller.ts    # Action token endpoints
│   ├── score.controller.ts     # Score management
│   └── leaderboard.controller.ts # Leaderboard queries
├── services/
│   ├── auth.service.ts         # JWT generation/validation
│   ├── token.service.ts        # Action token logic
│   ├── score.service.ts        # Score business logic
│   ├── fraud.service.ts        # Fraud detection
│   └── cache.service.ts        # Cache management
├── repositories/
│   ├── user.repository.ts      # User data access
│   ├── action.repository.ts    # Action audit data
│   └── session.repository.ts   # Session management
├── validators/
│   ├── action.validator.ts     # Action token validation schemas
│   └── score.validator.ts      # Score request validation
├── utils/
│   ├── crypto.ts               # Cryptographic functions
│   ├── logger.ts               # Winston logger setup
│   └── metrics.ts              # Prometheus metrics
└── websocket/
    ├── server.ts               # WebSocket server setup
    ├── handlers.ts             # WebSocket event handlers
    └── broadcaster.ts          # Score update broadcaster
```

### 2.2 Authentication & Authorization Design

#### JWT Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-2025-01"
  },
  "payload": {
    "sub": "user_12345",
    "username": "johndoe",
    "iat": 1733097600,
    "exp": 1733184000,
    "jti": "jwt_abc123",
    "iss": "scoreboard-api",
    "aud": "scoreboard-client"
  },
  "signature": "..."
}
```

#### Action Token Structure
```json
{
  "userId": "user_12345",
  "timestamp": 1733097600000,
  "nonce": "f4d8b9c1e2a3",
  "signature": "hmac-sha256-signature"
}
```

**Signature Generation**:
```typescript
const payload = `${userId}:${timestamp}:${nonce}`;
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(payload)
  .digest('hex');
```

**Validation Flow**:
```
1. Parse token JSON
2. Extract userId, timestamp, nonce, signature
3. Check timestamp (current_time - timestamp < 60s)
4. Recompute signature with SECRET_KEY
5. Compare signatures (constant-time comparison)
6. Check Redis: token not already used
7. Check Redis: user rate limit not exceeded
8. Mark token as used in Redis
```

### 2.3 Rate Limiting Strategy

#### Multi-Layer Rate Limiting

**Layer 1: IP-Based (NGINX/WAF)**
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req zone=api_limit burst=20 nodelay;
```

**Layer 2: User-Based (Redis)**
```typescript
// Token Request Rate Limit: 10 requests per minute
const tokenRequestKey = `rate:token:${userId}`;
const tokenRequestCount = await redis.incr(tokenRequestKey);
if (tokenRequestCount === 1) {
  await redis.expire(tokenRequestKey, 60);
}
if (tokenRequestCount > 10) {
  throw new RateLimitError('Token request limit exceeded');
}

// Score Increment Rate Limit: 5 requests per minute
const scoreIncrementKey = `rate:score:${userId}`;
const scoreIncrementCount = await redis.incr(scoreIncrementKey);
if (scoreIncrementCount === 1) {
  await redis.expire(scoreIncrementKey, 60);
}
if (scoreIncrementCount > 5) {
  throw new RateLimitError('Score increment limit exceeded');
}
```

**Layer 3: Adaptive Rate Limiting (Fraud Detection)**
```typescript
// Detect suspicious patterns and reduce rate limits
if (isSuspiciousActivity(userId)) {
  // Reduce to 1 request per minute
  const restrictedKey = `rate:restricted:${userId}`;
  const restrictedCount = await redis.incr(restrictedKey);
  if (restrictedCount === 1) {
    await redis.expire(restrictedKey, 60);
  }
  if (restrictedCount > 1) {
    throw new FraudDetectionError('Account flagged for suspicious activity');
  }
}
```

### 2.4 Caching Strategy

#### Cache Hierarchy

**L1 Cache: Application Memory (Node.js)**
```typescript
// In-memory cache with 5-second TTL
const memoryCache = new LRUCache({
  max: 1000,
  ttl: 5000, // 5 seconds
});

async function getTopScores() {
  const cacheKey = 'leaderboard:top10';

  // Check L1 (memory)
  let cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  // Check L2 (Redis)
  cached = await redis.get(cacheKey);
  if (cached) {
    memoryCache.set(cacheKey, cached);
    return JSON.parse(cached);
  }

  // Query L3 (Database)
  const scores = await db.query(`
    SELECT user_id, username, score, rank
    FROM users
    ORDER BY score DESC
    LIMIT 10
  `);

  // Populate caches
  await redis.setex(cacheKey, 5, JSON.stringify(scores));
  memoryCache.set(cacheKey, scores);

  return scores;
}
```

#### Cache Invalidation Strategy

**Approach 1: Time-Based Expiration (Current)**
- Leaderboard cache TTL: 5 seconds
- Acceptable for eventual consistency
- Reduces database load significantly

**Approach 2: Event-Based Invalidation (Future)**
```typescript
// When score is updated
async function incrementScore(userId: string) {
  // Update database
  await db.query(`UPDATE users SET score = score + 1 WHERE user_id = $1`, [userId]);

  // Invalidate cache
  await redis.del('leaderboard:top10');
  memoryCache.delete('leaderboard:top10');

  // Publish event for other servers
  await redis.publish('cache:invalidate', JSON.stringify({
    key: 'leaderboard:top10',
    timestamp: Date.now()
  }));
}
```

### 2.5 WebSocket Architecture

#### Connection Management

```typescript
// WebSocket Server Setup
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Connection Authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = verifyJWT(token);
    socket.data.userId = decoded.sub;
    socket.data.username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Connection Event Handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.username}`);

  // Join leaderboard room
  socket.join('leaderboard');

  // Send current leaderboard immediately
  emitLeaderboard(socket);

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.data.username}, reason: ${reason}`);
  });

  // Handle ping-pong (heartbeat)
  socket.on('ping', () => {
    socket.emit('pong');
  });
});
```

#### Broadcasting Strategy

```typescript
// Redis Pub/Sub for Multi-Server Broadcasting
const redisSubscriber = redis.duplicate();
redisSubscriber.subscribe('score_update');

redisSubscriber.on('message', async (channel, message) => {
  if (channel === 'score_update') {
    // Fetch updated leaderboard
    const leaderboard = await getTopScores();

    // Broadcast to all connected clients
    io.to('leaderboard').emit('leaderboard_update', {
      type: 'full',
      data: leaderboard,
      timestamp: Date.now(),
    });
  }
});

// Publish score update event
async function publishScoreUpdate() {
  await redis.publish('score_update', JSON.stringify({
    timestamp: Date.now(),
  }));
}
```

#### Fallback Mechanism (Polling)

```typescript
// If WebSocket connection fails, fallback to HTTP polling
class LeaderboardClient {
  private socket: Socket | null = null;
  private pollingInterval: NodeJS.Timer | null = null;

  connect() {
    try {
      this.socket = io(API_URL, {
        auth: { token: getAuthToken() },
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket failed, falling back to polling');
        this.startPolling();
      });

      this.socket.on('leaderboard_update', (data) => {
        this.updateUI(data);
      });
    } catch (error) {
      this.startPolling();
    }
  }

  startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      const leaderboard = await fetch(`${API_URL}/api/scores/top`);
      const data = await leaderboard.json();
      this.updateUI(data);
    }, 5000); // Poll every 5 seconds
  }

  disconnect() {
    this.socket?.disconnect();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
```

### 2.6 Database Design

#### Schema Definition

```sql
-- Users table with optimized indexes
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  score BIGINT DEFAULT 0 NOT NULL,
  rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_users_score_desc ON users(score DESC, user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_flagged ON users(is_flagged) WHERE is_flagged = TRUE;

-- Actions audit table (partitioned by month)
CREATE TABLE actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  action_type VARCHAR(50) NOT NULL,
  action_token TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE actions_2025_01 PARTITION OF actions
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE actions_2025_02 PARTITION OF actions
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Indexes for audit queries
CREATE INDEX idx_actions_user_id ON actions(user_id, created_at DESC);
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);
CREATE INDEX idx_actions_ip_address ON actions(ip_address, created_at DESC);

-- Sessions table for rate limiting
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  token_requests_count INTEGER DEFAULT 0,
  score_increments_count INTEGER DEFAULT 0,
  last_token_request TIMESTAMP,
  last_score_increment TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Materialized view for top 10 leaderboard (faster queries)
CREATE MATERIALIZED VIEW leaderboard_top10 AS
SELECT
  user_id,
  username,
  score,
  ROW_NUMBER() OVER (ORDER BY score DESC, user_id) AS rank
FROM users
WHERE is_banned = FALSE
ORDER BY score DESC
LIMIT 10;

-- Refresh materialized view automatically (using trigger)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_top10;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_leaderboard
AFTER UPDATE OF score ON users
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard();
```

#### Query Optimization Strategies

**Strategy 1: Use Materialized Views**
```sql
-- Fast query (uses materialized view)
SELECT * FROM leaderboard_top10;

-- Execution time: ~2ms (vs ~50ms for full table scan)
```

**Strategy 2: Optimistic Locking for Concurrent Updates**
```typescript
async function incrementScoreOptimistic(userId: string) {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Read current score and version
      const user = await db.query(
        `SELECT score, version FROM users WHERE user_id = $1`,
        [userId]
      );

      // Increment with version check (optimistic lock)
      const result = await db.query(
        `UPDATE users
         SET score = $1, version = version + 1, updated_at = NOW()
         WHERE user_id = $2 AND version = $3
         RETURNING *`,
        [user.score + 1, userId, user.version]
      );

      if (result.rowCount === 0) {
        // Version mismatch, retry
        continue;
      }

      return result.rows[0];
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
    }
  }

  throw new Error('Failed to increment score after retries');
}
```

**Strategy 3: Read Replicas for Query Load**
```typescript
// Primary for writes
const primaryPool = new Pool({
  host: PRIMARY_DB_HOST,
  port: 5432,
  database: 'scoreboard',
  max: 20,
});

// Replicas for reads
const replicaPool = new Pool({
  host: REPLICA_DB_HOST,
  port: 5432,
  database: 'scoreboard',
  max: 50, // More connections for read-heavy workload
});

// Route queries appropriately
async function getTopScores() {
  return replicaPool.query(`SELECT * FROM leaderboard_top10`);
}

async function incrementScore(userId: string) {
  return primaryPool.query(
    `UPDATE users SET score = score + 1 WHERE user_id = $1`,
    [userId]
  );
}
```

### 2.7 Fraud Detection System

#### Rule-Based Detection (Phase 1)

```typescript
interface FraudRule {
  name: string;
  check: (event: ActionEvent) => Promise<boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'flag' | 'ban';
}

const fraudRules: FraudRule[] = [
  {
    name: 'Rapid Successive Requests',
    check: async (event) => {
      const recent = await getRecentActions(event.userId, 10); // Last 10 seconds
      return recent.length > 8; // More than 8 actions in 10 seconds
    },
    severity: 'high',
    action: 'flag',
  },
  {
    name: 'Unusual Time Pattern',
    check: async (event) => {
      const hourOfDay = new Date(event.timestamp).getHours();
      return hourOfDay >= 2 && hourOfDay <= 5; // 2 AM - 5 AM activity
    },
    severity: 'medium',
    action: 'log',
  },
  {
    name: 'IP Address Change',
    check: async (event) => {
      const previousIP = await getLastIP(event.userId);
      return previousIP !== event.ipAddress;
    },
    severity: 'low',
    action: 'log',
  },
  {
    name: 'Token Manipulation Attempt',
    check: async (event) => {
      // Check if token signature is invalid but request was made
      return event.tokenValidationFailed === true;
    },
    severity: 'critical',
    action: 'ban',
  },
];

async function evaluateFraud(event: ActionEvent) {
  for (const rule of fraudRules) {
    const triggered = await rule.check(event);

    if (triggered) {
      // Log fraud event
      await logFraudEvent({
        userId: event.userId,
        ruleName: rule.name,
        severity: rule.severity,
        timestamp: Date.now(),
      });

      // Execute action
      switch (rule.action) {
        case 'log':
          logger.warn(`Fraud rule triggered: ${rule.name}`, { userId: event.userId });
          break;
        case 'flag':
          await flagUser(event.userId);
          break;
        case 'ban':
          await banUser(event.userId);
          throw new FraudDetectionError('Account banned due to fraudulent activity');
      }
    }
  }
}
```

#### Machine Learning Detection (Phase 2 - Future)

```typescript
// Behavioral analysis using anomaly detection
interface UserBehaviorProfile {
  userId: string;
  avgActionsPerHour: number;
  avgTimeBetweenActions: number;
  commonActiveHours: number[];
  commonIpAddresses: string[];
  scoreVelocity: number; // Score increase per hour
}

async function detectAnomalies(userId: string, currentEvent: ActionEvent) {
  const profile = await getUserBehaviorProfile(userId);

  // Calculate z-scores for various metrics
  const timeSinceLastAction = currentEvent.timestamp - profile.lastActionTimestamp;
  const zScore = calculateZScore(timeSinceLastAction, profile.avgTimeBetweenActions, profile.stdDev);

  // If z-score > 3 (3 standard deviations), it's an anomaly
  if (Math.abs(zScore) > 3) {
    return {
      isAnomaly: true,
      reason: 'Unusual time between actions',
      severity: 'medium',
    };
  }

  // Check score velocity
  const currentVelocity = await calculateScoreVelocity(userId, 3600); // Last hour
  const velocityZScore = calculateZScore(currentVelocity, profile.scoreVelocity, profile.velocityStdDev);

  if (velocityZScore > 4) {
    return {
      isAnomaly: true,
      reason: 'Unusually high scoring rate',
      severity: 'high',
    };
  }

  return { isAnomaly: false };
}
```

## 3. API Specification

### 3.1 RESTful API Endpoints

#### Authentication Endpoints

**POST /api/auth/register**
```typescript
// Request
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecureP@ssw0rd"
}

// Response (201 Created)
{
  "userId": "user_12345",
  "username": "johndoe",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 86400
}
```

**POST /api/auth/login**
```typescript
// Request
{
  "username": "johndoe",
  "password": "SecureP@ssw0rd"
}

// Response (200 OK)
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 86400
}
```

#### Action Token Endpoints

**POST /api/actions/token**
```typescript
// Request Headers
Authorization: Bearer <jwt_token>

// Response (200 OK)
{
  "actionToken": {
    "userId": "user_12345",
    "timestamp": 1733097600000,
    "nonce": "f4d8b9c1e2a3",
    "signature": "a1b2c3..."
  },
  "expiresAt": 1733097660000,
  "expiresIn": 60
}

// Response (429 Too Many Requests)
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 token requests per minute",
  "retryAfter": 45
}
```

#### Score Management Endpoints

**POST /api/scores/increment**
```typescript
// Request Headers
Authorization: Bearer <jwt_token>

// Request Body
{
  "actionToken": {
    "userId": "user_12345",
    "timestamp": 1733097600000,
    "nonce": "f4d8b9c1e2a3",
    "signature": "a1b2c3..."
  }
}

// Response (200 OK)
{
  "success": true,
  "newScore": 1537,
  "previousRank": 12,
  "newRank": 11,
  "rankChanged": true
}

// Response (400 Bad Request - Token expired)
{
  "error": "Invalid token",
  "message": "Action token has expired",
  "code": "TOKEN_EXPIRED"
}

// Response (400 Bad Request - Token already used)
{
  "error": "Invalid token",
  "message": "Action token has already been used",
  "code": "TOKEN_ALREADY_USED"
}
```

**GET /api/scores/top**
```typescript
// Request (optional query params)
?limit=10&offset=0

// Response (200 OK)
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_789",
      "username": "champion",
      "score": 9876,
      "lastUpdated": "2025-12-01T10:30:00Z"
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "runner_up",
      "score": 9654,
      "lastUpdated": "2025-12-01T10:25:00Z"
    }
    // ... 8 more entries
  ],
  "totalUsers": 150000,
  "cacheHit": true,
  "timestamp": 1733097600000
}
```

**GET /api/scores/user/:userId**
```typescript
// Response (200 OK)
{
  "userId": "user_12345",
  "username": "johndoe",
  "score": 1537,
  "rank": 11,
  "percentile": 99.2,
  "lastUpdated": "2025-12-01T10:15:00Z"
}
```

### 3.2 WebSocket Events

#### Client → Server Events

**authenticate**
```typescript
socket.emit('authenticate', {
  token: 'eyJhbGc...'
});
```

**ping** (heartbeat)
```typescript
socket.emit('ping');
```

#### Server → Client Events

**leaderboard_update** (full leaderboard)
```typescript
socket.on('leaderboard_update', (data) => {
  // data structure:
  {
    "type": "full",
    "data": [
      { "rank": 1, "username": "champion", "score": 9876 },
      // ... 9 more entries
    ],
    "timestamp": 1733097600000
  }
});
```

**score_changed** (individual user score change)
```typescript
socket.on('score_changed', (data) => {
  // data structure:
  {
    "userId": "user_12345",
    "username": "johndoe",
    "previousScore": 1536,
    "newScore": 1537,
    "previousRank": 12,
    "newRank": 11,
    "timestamp": 1733097600000
  }
});
```

**rank_changed** (user entered/exited top 10)
```typescript
socket.on('rank_changed', (data) => {
  // data structure:
  {
    "userId": "user_12345",
    "username": "johndoe",
    "newRank": 10,
    "enteredTop10": true,
    "timestamp": 1733097600000
  }
});
```

**pong** (heartbeat response)
```typescript
socket.on('pong');
```

**error**
```typescript
socket.on('error', (error) => {
  // error structure:
  {
    "code": "AUTH_FAILED",
    "message": "Authentication token is invalid"
  }
});
```

## 4. Security Architecture

### 4.1 Defense in Depth Strategy

```
Layer 1: Network Security
├── WAF (Web Application Firewall)
│   ├── DDoS protection
│   ├── SQL injection filtering
│   └── XSS attack prevention
└── TLS 1.3 encryption

Layer 2: Application Security
├── JWT authentication (RS256)
├── Action token validation (HMAC-SHA256)
├── Rate limiting (IP + User)
└── CORS policies

Layer 3: Data Security
├── Password hashing (bcrypt, cost 12)
├── PII encryption at rest
├── SQL parameterized queries
└── Input validation (Zod schemas)

Layer 4: Monitoring & Response
├── Fraud detection rules
├── Audit logging
├── Anomaly detection
└── Incident response automation
```

### 4.2 Secret Management

```typescript
// Environment-based configuration
interface SecurityConfig {
  jwt: {
    privateKey: string;      // RS256 private key (from file/vault)
    publicKey: string;       // RS256 public key
    algorithm: 'RS256';
    expiresIn: '24h';
  };
  actionToken: {
    secretKey: string;       // HMAC secret key (rotated monthly)
    previousKeys: string[];  // Support key rotation
    algorithm: 'sha256';
    expiresIn: 60;          // seconds
  };
  bcrypt: {
    saltRounds: 12;
  };
}

// Key rotation strategy
async function validateActionToken(token: ActionToken): Promise<boolean> {
  const { secretKey, previousKeys } = config.actionToken;

  // Try current key
  if (verifySignature(token, secretKey)) {
    return true;
  }

  // Try previous keys (for graceful rotation)
  for (const oldKey of previousKeys) {
    if (verifySignature(token, oldKey)) {
      logger.warn('Token validated with previous key', { userId: token.userId });
      return true;
    }
  }

  return false;
}
```

### 4.3 Security Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss://api.example.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

## 5. Performance Optimization

### 5.1 Database Indexing Strategy

```sql
-- Covering index for leaderboard query
CREATE INDEX idx_users_leaderboard ON users(score DESC, user_id, username)
WHERE is_banned = FALSE;

-- Partial index for flagged users
CREATE INDEX idx_users_flagged ON users(user_id, score)
WHERE is_flagged = TRUE;

-- Composite index for audit queries
CREATE INDEX idx_actions_audit ON actions(user_id, created_at DESC, action_type);
```

### 5.2 Connection Pooling

```typescript
// PostgreSQL connection pool
const pool = new Pool({
  host: DB_HOST,
  port: 5432,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  min: 10,                 // Minimum connections
  max: 100,                // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Redis connection pool
const redisPool = new RedisPool({
  host: REDIS_HOST,
  port: 6379,
  maxConnections: 50,
  minConnections: 5,
});
```

### 5.3 Query Optimization

```typescript
// Bad: N+1 query problem
async function getLeaderboardWithDetails() {
  const users = await db.query('SELECT user_id FROM users ORDER BY score DESC LIMIT 10');

  const details = await Promise.all(
    users.map(u => db.query('SELECT * FROM user_details WHERE user_id = $1', [u.user_id]))
  );

  return details;
}

// Good: Single query with JOIN
async function getLeaderboardWithDetailsOptimized() {
  return db.query(`
    SELECT u.user_id, u.username, u.score, ud.avatar_url, ud.country
    FROM users u
    LEFT JOIN user_details ud ON u.user_id = ud.user_id
    WHERE u.is_banned = FALSE
    ORDER BY u.score DESC
    LIMIT 10
  `);
}
```

## 6. Scalability Strategy

### 6.1 Horizontal Scaling

```
┌─────────────────────────────────────────────────────────┐
│              Load Balancer (Round Robin)                │
└─────────────────┬───────────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼────┐ ┌────▼─────┐ ┌──▼───────┐
│ Server 1 │ │ Server 2 │ │ Server 3 │ ... (auto-scale)
└─────┬────┘ └────┬─────┘ └──┬───────┘
      │           │           │
      └───────────┼───────────┘
                  │
         ┌────────▼────────┐
         │  Redis Pub/Sub  │ (shared state)
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │   PostgreSQL    │
         └─────────────────┘
```

### 6.2 Database Sharding Strategy (Future)

```typescript
// Shard by user_id hash
function getShardForUser(userId: string): number {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % NUM_SHARDS;
}

// Route queries to appropriate shard
async function incrementScore(userId: string) {
  const shard = getShardForUser(userId);
  const db = getDatabaseConnection(shard);

  return db.query(
    'UPDATE users SET score = score + 1 WHERE user_id = $1',
    [userId]
  );
}
```

### 6.3 CDN Strategy

```
Static Assets:
├── index.html → CDN (cache: 1 hour)
├── app.js → CDN (cache: 1 year, versioned)
├── styles.css → CDN (cache: 1 year, versioned)
└── images/* → CDN (cache: 1 year)

API Responses:
├── GET /api/scores/top → CDN (cache: 5 seconds)
└── Other endpoints → No CDN (dynamic)
```

## 7. Deployment Architecture

### 7.1 Infrastructure as Code (Terraform)

```hcl
# Load Balancer
resource "aws_lb" "api" {
  name               = "scoreboard-api-lb"
  load_balancer_type = "application"
  subnets            = var.public_subnets
  security_groups    = [aws_security_group.lb.id]
}

# Auto Scaling Group
resource "aws_autoscaling_group" "api_servers" {
  name                = "scoreboard-api-asg"
  vpc_zone_identifier = var.private_subnets
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3

  launch_template {
    id      = aws_launch_template.api_server.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.api.arn]
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "scoreboard-db"
  engine            = "postgres"
  engine_version    = "15.3"
  instance_class    = "db.t3.large"
  allocated_storage = 100
  multi_az          = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "scoreboard-redis"
  replication_group_description = "Redis cluster for caching"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.t3.medium"
  num_cache_clusters         = 3
  automatic_failover_enabled = true
}
```

### 7.2 Docker Configuration

**Dockerfile**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
```

**docker-compose.yml** (for local development)
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=scoreboard
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 8. Monitoring & Observability

### 8.1 Prometheus Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Business metrics
const scoreIncrements = new Counter({
  name: 'score_increments_total',
  help: 'Total number of score increments',
  labelNames: ['user_id'],
});

const activeWebSocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

// Fraud detection metrics
const fraudDetections = new Counter({
  name: 'fraud_detections_total',
  help: 'Total number of fraud detections',
  labelNames: ['rule_name', 'severity'],
});
```

### 8.2 Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Usage
logger.info('Score incremented', {
  userId: 'user_12345',
  newScore: 1537,
  previousRank: 12,
  newRank: 11,
  timestamp: Date.now(),
});
```

### 8.3 Distributed Tracing

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

async function incrementScoreWithTracing(userId: string, token: ActionToken) {
  const tracer = trace.getTracer('scoreboard-api');

  return tracer.startActiveSpan('incrementScore', async (span) => {
    span.setAttribute('user.id', userId);

    try {
      // Validate token (child span)
      await tracer.startActiveSpan('validateToken', async (childSpan) => {
        await validateActionToken(token);
        childSpan.end();
      });

      // Update database (child span)
      await tracer.startActiveSpan('updateDatabase', async (childSpan) => {
        await db.query('UPDATE users SET score = score + 1 WHERE user_id = $1', [userId]);
        childSpan.end();
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return { success: true };
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---
