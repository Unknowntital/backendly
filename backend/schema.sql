CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    picture VARCHAR,
    auth_provider VARCHAR NOT NULL,
    password_hash VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_token VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
    reset_token VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    project_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    region VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_invites (
    invite_id VARCHAR PRIMARY KEY,
    owner_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    name VARCHAR,
    role VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_tables (
    table_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    fields JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS project_records (
    record_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    table_id VARCHAR NOT NULL REFERENCES project_tables(table_id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_project_records_project_table ON project_records(project_id, table_id);

ALTER TABLE project_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_records FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_records' AND policyname = 'project_records_rls'
    ) THEN
        CREATE POLICY project_records_rls ON project_records FOR ALL
        USING (
            current_setting('backendly.current_user_id', true) IS NULL OR
            current_setting('backendly.current_user_id', true) = '' OR
            data->>'end_user_id' = current_setting('backendly.current_user_id', true)
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS api_keys (
    key_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    key_hash VARCHAR UNIQUE NOT NULL,
    prefix VARCHAR NOT NULL,
    last4 VARCHAR NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);

CREATE TABLE IF NOT EXISTS request_logs (
    id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    api_key_id VARCHAR,
    method VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    status INTEGER NOT NULL,
    bytes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_request_logs_project ON request_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);

CREATE TABLE IF NOT EXISTS end_users (
    end_user_id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    metadata JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, email)
);

CREATE TABLE IF NOT EXISTS end_user_sessions (
    token VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    end_user_id VARCHAR NOT NULL REFERENCES end_users(end_user_id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_checks (
    id VARCHAR PRIMARY KEY,
    client_name VARCHAR NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    company VARCHAR,
    subject VARCHAR NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
