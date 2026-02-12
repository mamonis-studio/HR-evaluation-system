-- V1__init.sql
-- HR Evaluation System - Initial Schema (Multi-tenant)

-- ============================================================
-- テナント
-- ============================================================
CREATE TABLE tenants (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    subdomain   VARCHAR(100) NOT NULL UNIQUE,
    plan        VARCHAR(50) NOT NULL DEFAULT 'FREE',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 役職マスタ
-- ============================================================
CREATE TABLE positions (
    id                BIGSERIAL PRIMARY KEY,
    tenant_id         BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code              INT NOT NULL,
    name              VARCHAR(100) NOT NULL,
    sort_order        INT NOT NULL DEFAULT 0,
    can_view_all      BOOLEAN NOT NULL DEFAULT FALSE,
    can_evaluate      BOOLEAN NOT NULL DEFAULT FALSE,
    can_final_approve BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_positions_tenant ON positions(tenant_id);

-- ============================================================
-- 部署（旧: facilities → 汎用化）
-- ============================================================
CREATE TABLE departments (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);

-- ============================================================
-- ユーザー
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_id   BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    position_id     BIGINT REFERENCES positions(id) ON DELETE SET NULL,
    name            VARCHAR(100) NOT NULL,
    name_kana       VARCHAR(100),
    email           VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    can_evaluate    BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- 年度マスタ
-- ============================================================
CREATE TABLE fiscal_years (
    id                BIGSERIAL PRIMARY KEY,
    tenant_id         BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    year              INT NOT NULL,
    is_current        BOOLEAN NOT NULL DEFAULT FALSE,
    goal_setting_open BOOLEAN NOT NULL DEFAULT FALSE,
    summer_self_open  BOOLEAN NOT NULL DEFAULT FALSE,
    summer_eval_open  BOOLEAN NOT NULL DEFAULT FALSE,
    winter_self_open  BOOLEAN NOT NULL DEFAULT FALSE,
    winter_eval_open  BOOLEAN NOT NULL DEFAULT FALSE,
    summer_start_date DATE,
    summer_end_date   DATE,
    winter_start_date DATE,
    winter_end_date   DATE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, year)
);

CREATE INDEX idx_fiscal_years_tenant ON fiscal_years(tenant_id);

-- ============================================================
-- 目標
-- ============================================================
CREATE TABLE goals (
    id                      BIGSERIAL PRIMARY KEY,
    tenant_id               BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_year_id          BIGINT NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
    goal_text               TEXT NOT NULL,
    summer_self_assessment  TEXT,
    winter_self_assessment  TEXT,
    sort_order              INT NOT NULL DEFAULT 0,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_tenant ON goals(tenant_id);
CREATE INDEX idx_goals_user_year ON goals(user_id, fiscal_year_id);

-- ============================================================
-- 評価
-- ============================================================
CREATE TYPE evaluation_period AS ENUM ('SUMMER', 'WINTER');
CREATE TYPE evaluation_status AS ENUM (
    'NOT_STARTED',
    'SELF_SUBMITTED',
    'EVALUATOR_SUBMITTED',
    'MANAGER_APPROVED',
    'DIRECTOR_EVALUATED',
    'FINALIZED'
);

CREATE TABLE evaluations (
    id                      BIGSERIAL PRIMARY KEY,
    tenant_id               BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_year_id          BIGINT NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
    period                  evaluation_period NOT NULL,
    department_id           BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    position_id             BIGINT REFERENCES positions(id) ON DELETE SET NULL,
    status                  evaluation_status NOT NULL DEFAULT 'NOT_STARTED',

    -- 評価者
    evaluator_id            BIGINT REFERENCES users(id) ON DELETE SET NULL,
    evaluator_grade         VARCHAR(10),
    evaluator_comment       TEXT,
    evaluated_at            TIMESTAMP,

    -- 管理者（施設長相当）
    manager_id              BIGINT REFERENCES users(id) ON DELETE SET NULL,
    manager_grade           VARCHAR(10),
    manager_comment         TEXT,
    manager_approved_at     TIMESTAMP,

    -- 役員（理事長相当）
    director_id             BIGINT REFERENCES users(id) ON DELETE SET NULL,
    director_grade          VARCHAR(10),
    director_comment        TEXT,
    director_evaluated_at   TIMESTAMP,

    finalized_at            TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, user_id, fiscal_year_id, period)
);

CREATE INDEX idx_evaluations_tenant ON evaluations(tenant_id);
CREATE INDEX idx_evaluations_user ON evaluations(user_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_status ON evaluations(tenant_id, status);

-- ============================================================
-- 通知
-- ============================================================
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50),
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    link        VARCHAR(500),
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);

-- ============================================================
-- リフレッシュトークン
-- ============================================================
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
