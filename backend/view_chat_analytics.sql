-- View chat analytics in Supabase SQL Editor

-- 1. Recent queries (last 50)
SELECT 
    id,
    query,
    left(response, 80) as response_preview,
    timestamp,
    response_time_ms,
    found_results
FROM chat_logs
ORDER BY timestamp DESC
LIMIT 50;

-- 2. Most common questions
SELECT 
    query,
    COUNT(*) as times_asked,
    AVG(response_time_ms) as avg_response_time
FROM chat_logs
GROUP BY query
ORDER BY times_asked DESC
LIMIT 20;

-- 3. Failed searches (no results found)
SELECT 
    query,
    timestamp
FROM chat_logs
WHERE found_results = false
ORDER BY timestamp DESC
LIMIT 20;

-- 4. Performance stats
SELECT 
    COUNT(*) as total_queries,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    MIN(response_time_ms) as min_response_time,
    COUNT(CASE WHEN found_results = false THEN 1 END) as failed_queries,
    ROUND(COUNT(CASE WHEN found_results = false THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as failure_rate_pct
FROM chat_logs;

-- 5. Queries per day
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as queries
FROM chat_logs
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 30;

