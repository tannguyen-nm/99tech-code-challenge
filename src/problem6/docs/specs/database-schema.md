# Database Schema & Optimization - Live Scoreboard System

This document provides the complete database schema design, indexing strategies, and optimization techniques.

---

## 1. Database Technology Selection

### PostgreSQL 15+ (Chosen)

**Rationale**:
- ✅ Strong ACID guarantees for score updates
- ✅ Excellent indexing capabilities (B-tree, GiST, GIN)
- ✅ Materialized views for leaderboard optimization
- ✅ Partitioning support for audit log scaling
- ✅ JSON/JSONB support for metadata
- ✅ Window functions for ranking
- ✅ Proven scalability with read replicas
- ✅ Strong community and ecosystem

**Alternatives Considered**:
- ❌ MySQL: Weaker ranking function support
- ❌ MongoDB: Eventual consistency issues for scores
- ❌ Redis: Not suitable as primary data store (no ACID)

---

## 2. Schema Definition

### 2.1 Users Table

```sql
-- Users table with optimized structure
CREATE TABLE users (
  -- Primary Key
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Credentials
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Score Data
  score BIGINT DEFAULT 0 NOT NULL CHECK (score >= 0),
  rank INTEGER,
  version INTEGER DEFAULT 0 NOT NULL, -- For optimistic locking

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_score_increment TIMESTAMP,

  -- Security Flags
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
  ban_reason TEXT,
  flagged_at TIMESTAMP,

  -- Additional Info
  avatar_url VARCHAR(500),
  country_code CHAR(2),
  timezone VARCHAR(50)
);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user profiles and current scores';
COMMENT ON COLUMN users.score IS 'Current total score (cannot be negative)';
COMMENT ON COLUMN users.rank IS 'Cached global rank (updated on score change)';
COMMENT ON COLUMN users.version IS 'Version for optimistic locking (prevents concurrent update conflicts)';
COMMENT ON COLUMN users.is_flagged IS 'TRUE if user has suspicious activity';
COMMENT ON COLUMN users.is_banned IS 'TRUE if user is permanently banned';
```

### 2.2 Actions Audit Table (Partitioned)

```sql
-- Actions table partitioned by month for performance
CREATE TABLE actions (
  -- Primary Key
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL,

  -- Action Details
  action_type VARCHAR(50) NOT NULL, -- 'TOKEN_REQUEST', 'SCORE_INCREMENT', 'FRAUD_DETECTED'
  action_token TEXT, -- The action token used (for audit)

  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Additional Metadata (flexible JSON storage)
  
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) PARTITION BY RANGE (created_at);

-- Comments
COMMENT ON TABLE actions IS 'Audit log of all user actions (partitioned by month)';
COMMENT ON COLUMN actions.metadata IS 'Flexible JSON storage for additional data (e.g., previous_score, new_score, fraud_rule_name)';

-- Create partitions for each month (automate with cron job or extension)
CREATE TABLE actions_2025_01 PARTITION OF actions
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE actions_2025_02 PARTITION OF actions
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE actions_2025_03 PARTITION OF actions
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Create default partition for future dates
CREATE TABLE actions_default PARTITION OF actions DEFAULT;
```

### 2.3 Sessions Table

```sql
-- Sessions table for rate limiting and JWT management
CREATE TABLE sessions (
  -- Primary Key
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL,

  -- JWT Token Info
  jwt_token_id VARCHAR(100) UNIQUE NOT NULL, -- JWT 'jti' claim
  refresh_token_hash VARCHAR(255),

  -- Rate Limiting Counters
  token_requests_count INTEGER DEFAULT 0 NOT NULL,
  score_increments_count INTEGER DEFAULT 0 NOT NULL,

  -- Timestamps
  last_token_request TIMESTAMP,
  last_score_increment TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Comments
COMMENT ON TABLE sessions IS 'Tracks user sessions, rate limiting, and JWT tokens';
COMMENT ON COLUMN sessions.jwt_token_id IS 'JWT jti claim for token revocation';
COMMENT ON COLUMN sessions.token_requests_count IS 'Number of action token requests in current minute';
COMMENT ON COLUMN sessions.score_increments_count IS 'Number of score increments in current minute';
```

### 2.4 Fraud Events Table

```sql
-- Fraud events table for security monitoring
CREATE TABLE fraud_events (
  -- Primary Key
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL,

  -- Event Details
  rule_name VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  action_taken VARCHAR(50) NOT NULL, -- 'log', 'flag', 'ban'

  -- Event Data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Additional Context
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_action CHECK (action_taken IN ('log', 'flag', 'ban'))
);

-- Comments
COMMENT ON TABLE fraud_events IS 'Logs all fraud detection rule triggers';
COMMENT ON COLUMN fraud_events.metadata IS 'Additional context (e.g., actions_count, time_window)';
```

### 2.5 Materialized View for Leaderboard

```sql
-- Materialized view for top 10 leaderboard (fast queries)
CREATE MATERIALIZED VIEW leaderboard_top10 AS
SELECT
  u.user_id,
  u.username,
  u.score,
  u.avatar_url,
  u.country_code,
  ROW_NUMBER() OVER (ORDER BY u.score DESC, u.user_id ASC) AS rank
FROM users u
WHERE u.is_banned = FALSE
ORDER BY u.score DESC, u.user_id ASC
LIMIT 10;

-- Create unique index on materialized view for CONCURRENT refresh
CREATE UNIQUE INDEX idx_leaderboard_top10_user_id ON leaderboard_top10(user_id);

-- Comments
COMMENT ON MATERIALIZED VIEW leaderboard_top10 IS 'Cached top 10 users for fast leaderboard queries';
```

---

## 3. Indexes

### 3.1 Users Table Indexes

```sql
-- Primary index (automatically created with PRIMARY KEY)
-- CREATE UNIQUE INDEX users_pkey ON users(user_id);

-- Username lookup (automatically created with UNIQUE constraint)
-- CREATE UNIQUE INDEX users_username_key ON users(username);

-- Email lookup (automatically created with UNIQUE constraint)
-- CREATE UNIQUE INDEX users_email_key ON users(email);

-- Covering index for leaderboard queries (most important!)
-- Includes user_id, username, score, avatar_url to avoid table lookups
CREATE INDEX idx_users_leaderboard_covering ON users(score DESC, user_id ASC)
INCLUDE (username, avatar_url, country_code)
WHERE is_banned = FALSE;

-- Index for flagged users (partial index for security dashboard)
CREATE INDEX idx_users_flagged ON users(flagged_at DESC)
WHERE is_flagged = TRUE;

-- Index for banned users (partial index for admin queries)
CREATE INDEX idx_users_banned ON users(created_at DESC)
WHERE is_banned = TRUE;

-- Index for last activity queries
CREATE INDEX idx_users_last_score_increment ON users(last_score_increment DESC)
WHERE last_score_increment IS NOT NULL;

-- Analyze index usage
COMMENT ON INDEX idx_users_leaderboard_covering IS 'Covering index for leaderboard queries (avoids table lookup)';
COMMENT ON INDEX idx_users_flagged IS 'Partial index for flagged users (security dashboard)';
```

### 3.2 Actions Table Indexes

```sql
-- Index for user audit log queries
CREATE INDEX idx_actions_user_created ON actions(user_id, created_at DESC);

-- Index for timestamp-based queries (data retention, export)
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);

-- Index for IP-based fraud detection
CREATE INDEX idx_actions_ip_created ON actions(ip_address, created_at DESC);

-- Index for action type filtering
CREATE INDEX idx_actions_type_created ON actions(action_type, created_at DESC);

-- GIN index for metadata JSONB queries (flexible searching)
CREATE INDEX idx_actions_metadata_gin ON actions USING GIN (metadata jsonb_path_ops);

-- Comments
COMMENT ON INDEX idx_actions_user_created IS 'Composite index for user audit log queries (sorted by time)';
COMMENT ON INDEX idx_actions_metadata_gin IS 'GIN index for JSONB metadata queries (e.g., fraud rule name)';
```

### 3.3 Sessions Table Indexes

```sql
-- Index for user session lookup
CREATE INDEX idx_sessions_user_id ON sessions(user_id, expires_at DESC);

-- Index for JWT token revocation
CREATE INDEX idx_sessions_jwt_token_id ON sessions(jwt_token_id);

-- Index for session expiration cleanup
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at)
WHERE expires_at < NOW();

-- Index for rate limiting queries
CREATE INDEX idx_sessions_user_last_request ON sessions(user_id, last_token_request DESC);

-- Comments
COMMENT ON INDEX idx_sessions_expires_at IS 'Partial index for expired sessions (cleanup job)';
```

### 3.4 Fraud Events Table Indexes

```sql
-- Index for user fraud history
CREATE INDEX idx_fraud_events_user_created ON fraud_events(user_id, created_at DESC);

-- Index for severity-based queries (admin dashboard)
CREATE INDEX idx_fraud_events_severity ON fraud_events(severity, created_at DESC);

-- Index for rule analysis
CREATE INDEX idx_fraud_events_rule ON fraud_events(rule_name, created_at DESC);

-- GIN index for metadata searching
CREATE INDEX idx_fraud_events_metadata_gin ON fraud_events USING GIN (metadata jsonb_path_ops);
```

---

## 4. Triggers and Functions

### 4.1 Update Timestamp Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users table
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';
```

### 4.2 Refresh Materialized View Trigger

```sql
-- Function to refresh leaderboard materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh materialized view concurrently (non-blocking)
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_top10;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users table (after score update)
CREATE TRIGGER trigger_refresh_leaderboard
AFTER UPDATE OF score ON users
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard();

COMMENT ON FUNCTION refresh_leaderboard() IS 'Refreshes leaderboard materialized view after score changes';
```

### 4.3 Auto-Partition Creation Function

```sql
-- Function to automatically create next month's partition
CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS void AS $$
DECLARE
  next_month_start DATE;
  next_month_end DATE;
  partition_name TEXT;
BEGIN
  -- Calculate next month
  next_month_start := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  next_month_end := next_month_start + INTERVAL '1 month';

  -- Generate partition name (e.g., actions_2025_04)
  partition_name := 'actions_' || TO_CHAR(next_month_start, 'YYYY_MM');

  -- Create partition if not exists
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF actions FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    next_month_start,
    next_month_end
  );

  RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_next_month_partition() IS 'Creates next month partition for actions table (run monthly via cron)';
```

### 4.4 Cleanup Expired Sessions Function

```sql
-- Function to delete expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Deletes expired sessions (run hourly via cron)';
```

---

## 5. Constraints and Validation

### 5.1 Check Constraints

```sql
-- Add check constraints for data integrity

-- Score cannot be negative
ALTER TABLE users
ADD CONSTRAINT check_score_non_negative
CHECK (score >= 0);

-- Rank must be positive if set
ALTER TABLE users
ADD CONSTRAINT check_rank_positive
CHECK (rank IS NULL OR rank > 0);

-- Expiration must be in the future when created
ALTER TABLE sessions
ADD CONSTRAINT check_session_valid_expiration
CHECK (expires_at > created_at);

-- Severity must be valid enum value
ALTER TABLE fraud_events
ADD CONSTRAINT check_fraud_severity
CHECK (severity IN ('low', 'medium', 'high', 'critical'));
```

### 5.2 Foreign Key Constraints

```sql
-- Already defined in table creation, but listed here for reference

-- actions.user_id → users.user_id
ALTER TABLE actions
ADD CONSTRAINT fk_actions_user
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- sessions.user_id → users.user_id
ALTER TABLE sessions
ADD CONSTRAINT fk_sessions_user
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- fraud_events.user_id → users.user_id
ALTER TABLE fraud_events
ADD CONSTRAINT fk_fraud_events_user
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
```

---

## 6. Query Optimization

### 6.1 Optimized Leaderboard Query

```sql
-- Fast leaderboard query using materialized view
-- Execution time: ~2ms (vs ~50ms with full table scan)

-- Option 1: Query materialized view (fastest)
SELECT * FROM leaderboard_top10;

-- Option 2: Query with covering index (if materialized view not available)
SELECT
  user_id,
  username,
  score,
  avatar_url,
  country_code,
  ROW_NUMBER() OVER (ORDER BY score DESC, user_id ASC) AS rank
FROM users
WHERE is_banned = FALSE
ORDER BY score DESC, user_id ASC
LIMIT 10;

-- Query plan analysis
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM leaderboard_top10;
```

### 6.2 Optimized User Rank Query

```sql
-- Get user's rank efficiently using window function
-- Uses covering index for performance

WITH ranked_users AS (
  SELECT
    user_id,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC, user_id ASC) AS rank
  FROM users
  WHERE is_banned = FALSE
)
SELECT rank, score
FROM ranked_users
WHERE user_id = $1;

-- For very large datasets, use approximate percentile rank
SELECT
  user_id,
  score,
  PERCENT_RANK() OVER (ORDER BY score DESC) * 100 AS percentile
FROM users
WHERE user_id = $1;
```

### 6.3 Optimized Score Increment Query

```sql
-- Score increment with optimistic locking
-- Prevents lost updates in concurrent scenarios

WITH updated AS (
  UPDATE users
  SET
    score = score + 1,
    version = version + 1,
    last_score_increment = NOW(),
    updated_at = NOW()
  WHERE
    user_id = $1
    AND version = $2 -- Optimistic lock check
    AND is_banned = FALSE
  RETURNING user_id, score, version
)
SELECT * FROM updated;

-- If no rows returned, version mismatch occurred (retry needed)
```

### 6.4 Optimized Audit Log Query

```sql
-- Query user audit log with pagination
-- Uses composite index (user_id, created_at)

SELECT
  action_id,
  action_type,
  ip_address,
  created_at,
  metadata
FROM actions
WHERE
  user_id = $1
  AND created_at > $2 -- Timestamp pagination
ORDER BY created_at DESC
LIMIT 50;

-- For date range queries
SELECT
  action_type,
  COUNT(*) as count
FROM actions
WHERE
  user_id = $1
  AND created_at BETWEEN $2 AND $3
GROUP BY action_type;
```

### 6.5 Fraud Detection Query

```sql
-- Get recent actions for fraud detection
-- Uses composite index (user_id, created_at)

SELECT COUNT(*) as action_count
FROM actions
WHERE
  user_id = $1
  AND action_type = 'SCORE_INCREMENT'
  AND created_at > NOW() - INTERVAL '10 seconds';

-- Get IP-based fraud patterns
SELECT
  ip_address,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(*) as action_count
FROM actions
WHERE
  action_type = 'SCORE_INCREMENT'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(DISTINCT user_id) > 5
ORDER BY action_count DESC;
```

---

## 7. Performance Tuning

### 7.1 PostgreSQL Configuration

```conf
# postgresql.conf optimizations for scoreboard workload

# Memory Settings
shared_buffers = 4GB                  # 25% of RAM
effective_cache_size = 12GB           # 75% of RAM
maintenance_work_mem = 1GB            # For index creation
work_mem = 64MB                       # Per query sort/hash

# Checkpoint Settings
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
wal_buffers = 16MB
max_wal_size = 4GB

# Query Planning
random_page_cost = 1.1                # For SSD storage
effective_io_concurrency = 200        # For SSD storage

# Connection Pooling
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Logging
log_min_duration_statement = 100      # Log slow queries (>100ms)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

### 7.2 Connection Pooling (PgBouncer)

```ini
# pgbouncer.ini configuration

[databases]
scoreboard = host=localhost port=5432 dbname=scoreboard

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Connection pooling mode
pool_mode = transaction              # Best for stateless app servers

# Connection limits
max_client_conn = 1000               # Maximum client connections
default_pool_size = 25               # Connections per database
reserve_pool_size = 5                # Reserve pool
reserve_pool_timeout = 3             # Seconds

# Performance tuning
server_idle_timeout = 600            # Close idle server connections after 10min
server_lifetime = 3600               # Recycle server connections after 1h
```

### 7.3 Vacuum and Analyze Strategy

```sql
-- Auto-vacuum settings per table

-- Users table (frequent updates)
ALTER TABLE users SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Vacuum when 5% of rows change
  autovacuum_analyze_scale_factor = 0.02, -- Analyze when 2% of rows change
  autovacuum_vacuum_cost_delay = 10       -- Throttle vacuum to reduce I/O
);

-- Actions table (append-only, partitioned)
ALTER TABLE actions SET (
  autovacuum_vacuum_scale_factor = 0.1,   -- Less frequent vacuum
  autovacuum_analyze_scale_factor = 0.05
);

-- Manual vacuum for maintenance windows
VACUUM (ANALYZE, VERBOSE) users;
VACUUM (ANALYZE, VERBOSE) actions;

-- Reindex to rebuild fragmented indexes
REINDEX TABLE CONCURRENTLY users;
```

---

## 8. Backup and Recovery

### 8.1 Backup Strategy

```bash
#!/bin/bash
# Daily full backup script

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="scoreboard"

# Full database backup
pg_dump -U postgres -d $DB_NAME -F c -f "${BACKUP_DIR}/full_${TIMESTAMP}.dump"

# Backup schema only (for migrations)
pg_dump -U postgres -d $DB_NAME --schema-only -f "${BACKUP_DIR}/schema_${TIMESTAMP}.sql"

# Backup specific tables
pg_dump -U postgres -d $DB_NAME -t users -t actions -F c -f "${BACKUP_DIR}/critical_${TIMESTAMP}.dump"

# Compress old backups
find ${BACKUP_DIR} -name "*.dump" -mtime +7 -exec gzip {} \;

# Delete backups older than 30 days
find ${BACKUP_DIR} -name "*.dump.gz" -mtime +30 -delete
```

### 8.2 Point-in-Time Recovery (PITR)

```sql
-- Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
archive_timeout = 300  -- Force archive every 5 minutes

-- Restore to specific point in time
-- 1. Stop PostgreSQL
-- 2. Restore base backup
-- 3. Create recovery.conf:
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2025-12-01 10:30:00'
recovery_target_action = 'promote'

-- 4. Start PostgreSQL (automatic recovery)
```

### 8.3 Disaster Recovery

```bash
#!/bin/bash
# Restore database from backup

BACKUP_FILE=$1
DB_NAME="scoreboard"

# Drop existing database (careful!)
dropdb -U postgres $DB_NAME

# Create new database
createdb -U postgres $DB_NAME

# Restore from backup
pg_restore -U postgres -d $DB_NAME -v $BACKUP_FILE

# Verify restoration
psql -U postgres -d $DB_NAME -c "SELECT COUNT(*) FROM users;"
```

---

## 9. Monitoring Queries

### 9.1 Index Usage Analysis

```sql
-- Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid::regclass::text NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 9.2 Slow Query Analysis

```sql
-- Top 10 slowest queries (requires pg_stat_statements)
SELECT
  query,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND((total_exec_time / SUM(total_exec_time) OVER ()) * 100, 2) AS pct_total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

### 9.3 Table Bloat Detection

```sql
-- Detect table bloat (wasted space)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) AS indexes_size,
  ROUND(100 * pg_total_relation_size(schemaname || '.' || tablename) / NULLIF(pg_database_size(current_database()), 0), 2) AS pct_of_db
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

### 9.4 Connection Monitoring

```sql
-- Active connections by state
SELECT
  state,
  COUNT(*) AS connection_count,
  MAX(NOW() - query_start) AS max_query_duration
FROM pg_stat_activity
WHERE datname = 'scoreboard'
GROUP BY state;

-- Long-running queries (>5 seconds)
SELECT
  pid,
  NOW() - query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND NOW() - query_start > INTERVAL '5 seconds'
ORDER BY duration DESC;
```

---

## 10. Migration Scripts

### 10.1 Initial Schema Migration

```sql
-- migrations/001_initial_schema.sql

BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create tables (as defined in section 2)
-- ... (users, actions, sessions, fraud_events)

-- Create indexes (as defined in section 3)
-- ... (all indexes)

-- Create triggers (as defined in section 4)
-- ... (all triggers)

-- Create materialized view (as defined in section 2.5)
-- ... (leaderboard_top10)

COMMIT;
```

### 10.2 Add Optimistic Locking

```sql
-- migrations/002_add_optimistic_locking.sql

BEGIN;

-- Add version column to users table
ALTER TABLE users
ADD COLUMN version INTEGER DEFAULT 0 NOT NULL;

-- Update existing rows
UPDATE users SET version = 0;

-- Add index for version queries (optional)
CREATE INDEX idx_users_version ON users(user_id, version);

COMMIT;
```

### 10.3 Add Partitioning to Actions

```sql
-- migrations/003_partition_actions_table.sql

BEGIN;

-- Create new partitioned table
CREATE TABLE actions_partitioned (
  LIKE actions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Copy data to partitioned table
INSERT INTO actions_partitioned SELECT * FROM actions;

-- Drop old table and rename
DROP TABLE actions;
ALTER TABLE actions_partitioned RENAME TO actions;

-- Create initial partitions
-- ... (as defined in section 2.2)

COMMIT;
```

---

## 11. Testing Queries

### 11.1 Performance Test Queries

```sql
-- Test 1: Leaderboard query performance
EXPLAIN ANALYZE
SELECT * FROM leaderboard_top10;

-- Test 2: Score increment with concurrency
BEGIN;
UPDATE users
SET score = score + 1, version = version + 1
WHERE user_id = 'test-user-id' AND version = 0;
COMMIT;

-- Test 3: Audit log pagination
EXPLAIN ANALYZE
SELECT * FROM actions
WHERE user_id = 'test-user-id'
ORDER BY created_at DESC
LIMIT 50;
```

### 11.2 Data Integrity Tests

```sql
-- Test 1: Verify no negative scores
SELECT COUNT(*) FROM users WHERE score < 0;
-- Expected: 0

-- Test 2: Verify no orphaned actions
SELECT COUNT(*) FROM actions a
LEFT JOIN users u ON a.user_id = u.user_id
WHERE u.user_id IS NULL;
-- Expected: 0

-- Test 3: Verify rank consistency
WITH ranked AS (
  SELECT
    user_id,
    ROW_NUMBER() OVER (ORDER BY score DESC, user_id ASC) AS computed_rank,
    rank
  FROM users
  WHERE is_banned = FALSE
)
SELECT COUNT(*) FROM ranked WHERE computed_rank != rank;
-- Expected: 0
```

---