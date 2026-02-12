-- V2__demo_data.sql
-- Demo tenant and seed data

-- Demo Tenant
INSERT INTO tenants (name, subdomain, plan) VALUES ('デモ株式会社', 'demo', 'PROFESSIONAL');

-- Positions (demo tenant_id = 1)
INSERT INTO positions (tenant_id, code, name, sort_order, can_view_all, can_evaluate, can_final_approve) VALUES
(1, 0, 'システム管理者', 0, TRUE, TRUE, TRUE),
(1, 1, '役員', 1, TRUE, TRUE, TRUE),
(1, 2, '部門長', 2, TRUE, TRUE, FALSE),
(1, 3, '課長', 3, FALSE, TRUE, FALSE),
(1, 4, '主任', 4, FALSE, TRUE, FALSE),
(1, 5, '一般', 5, FALSE, FALSE, FALSE);

-- Departments
INSERT INTO departments (tenant_id, name) VALUES
(1, '本社'),
(1, '開発部'),
(1, '営業部');

-- Users (password: demo1234 = BCrypt hash)
INSERT INTO users (tenant_id, department_id, position_id, name, name_kana, email, password, can_evaluate) VALUES
(1, 1, 1, 'デモ管理者', 'デモカンリシャ', 'admin@demo.example.com',
 '$2a$10$rVdApyag/heHAPFWFs.uMeLjjuL21yGehOB4pWePLSwdUdcVOFCCu', TRUE),
(1, 2, 3, '山田 太郎', 'ヤマダ タロウ', 'manager@demo.example.com',
 '$2a$10$rVdApyag/heHAPFWFs.uMeLjjuL21yGehOB4pWePLSwdUdcVOFCCu', TRUE),
(1, 2, 4, '佐藤 花子', 'サトウ ハナコ', 'evaluator@demo.example.com',
 '$2a$10$rVdApyag/heHAPFWFs.uMeLjjuL21yGehOB4pWePLSwdUdcVOFCCu', TRUE),
(1, 2, 6, '鈴木 一郎', 'スズキ イチロウ', 'staff@demo.example.com',
 '$2a$10$rVdApyag/heHAPFWFs.uMeLjjuL21yGehOB4pWePLSwdUdcVOFCCu', FALSE);

-- Fiscal Years
INSERT INTO fiscal_years (tenant_id, year, is_current, goal_setting_open, summer_self_open, summer_eval_open, winter_self_open, winter_eval_open) VALUES
(1, 2025, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
(1, 2026, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE);
