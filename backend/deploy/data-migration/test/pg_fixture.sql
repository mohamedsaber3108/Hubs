-- Realistic PostgreSQL fixture mirroring the production Hub fork (base-16 schema).
-- Populated tables carry PRODUCTION row counts and every edge case the migration
-- must survive: Unicode (Arabic), NULLs, enums, real bcrypt hashes, tz timestamps,
-- JSON, booleans. Used by run-test.sh to prove transform.js end-to-end.
-- (Schema here is minimal-but-faithful for the 8 populated tables.)

DROP TABLE IF EXISTS community_memberships, communities, admins, users,
  settings, feature_flags, email_templates, pricing_plans CASCADE;

CREATE TABLE users (
  id serial PRIMARY KEY, uuid uuid NOT NULL, first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL, username varchar(50) NOT NULL, email varchar(255) NOT NULL,
  password_hash varchar(255), avatar_url text, cover_url text, bio text, headline varchar(255),
  location varchar(255), website varchar(255), role varchar(20) DEFAULT 'user',
  status varchar(20) DEFAULT 'active', email_verified boolean DEFAULT false,
  provider varchar(20) DEFAULT 'local', provider_id varchar(255),
  is_deleted boolean DEFAULT false, deleted_at timestamptz, last_login timestamptz,
  points_total int DEFAULT 0, followers_count int DEFAULT 0, following_count int DEFAULT 0,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);

CREATE TABLE admins (
  id serial PRIMARY KEY, email varchar(255) NOT NULL, password_hash varchar(255) NOT NULL,
  name varchar(255) NOT NULL, role varchar(20) DEFAULT 'admin', permissions json,
  totp_secret varchar(255), totp_enabled boolean DEFAULT false, is_active boolean DEFAULT true,
  last_login timestamptz, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);

CREATE TABLE communities (
  id serial PRIMARY KEY, slug varchar(50) NOT NULL, name varchar(100) NOT NULL, emoji varchar(10),
  tagline varchar(255), description text, accent_color varchar(20), cover_url text,
  members_count int DEFAULT 0, is_active boolean DEFAULT true, features json,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);

CREATE TABLE community_memberships (
  id serial PRIMARY KEY, user_id int NOT NULL, community_id int NOT NULL,
  role varchar(20) DEFAULT 'member', joined_at timestamptz DEFAULT now());

CREATE TABLE settings (
  id serial PRIMARY KEY, key varchar(100) NOT NULL, value text, type varchar(20) DEFAULT 'string',
  "group" varchar(50) DEFAULT 'general', is_public boolean DEFAULT false, updated_by int,
  updated_at timestamptz NOT NULL);

CREATE TABLE feature_flags (
  id serial PRIMARY KEY, name varchar(100) NOT NULL, is_enabled boolean DEFAULT false,
  description text, updated_by int, updated_at timestamptz NOT NULL);

CREATE TABLE email_templates (
  id serial PRIMARY KEY, name varchar(100) NOT NULL, subject varchar(255) NOT NULL,
  html_body text NOT NULL, variables json, updated_by int, updated_at timestamptz NOT NULL);

CREATE TABLE pricing_plans (
  id serial PRIMARY KEY, name varchar(50) NOT NULL, slug varchar(50) NOT NULL,
  price_monthly numeric(10,2) DEFAULT 0.00, price_yearly numeric(10,2) DEFAULT 0.00,
  features json, limits json, is_active boolean DEFAULT true, sort_order smallint DEFAULT 0,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);

-- users (5): bcrypt hashes, Arabic Unicode, NULLs, enum variety, oauth provider, soft-deleted
INSERT INTO users (uuid, first_name, last_name, username, email, password_hash, bio, headline, role, status, email_verified, provider, provider_id, is_deleted, points_total, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111','Mahmoud','Elwazeer','melwazeer','mahmoud@example.com','$2b$12$abcdefghijklmnopqrstuuWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1a','Full-stack dev','Engineer','admin','active',true,'local',NULL,false,120,'2026-07-24 14:00:00+00','2026-10-20 10:00:00+00'),
('22222222-2222-2222-2222-222222222222','ليلى','منصور','laila','laila@example.com','$2b$12$bcdefghijklmnopqrstuuvWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1b',NULL,'طالبة','user','active',true,'google','g-998877',false,40,'2026-08-01 09:30:00+00','2026-10-18 12:00:00+00'),
('33333333-3333-3333-3333-333333333333','Omar','Farouk','omarf','omar@example.com',NULL,'OAuth-only account',NULL,'user','active',true,'github','gh-5566',false,0,'2026-08-15 18:00:00+00','2026-08-15 18:00:00+00'),
('44444444-4444-4444-4444-444444444444','Nour','Hassan','nour','nour@example.com','$2b$12$cdefghijklmnopqrstuuvwWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1c','Suspended tester',NULL,'moderator','suspended',false,'local',NULL,false,5,'2026-09-01 08:00:00+00','2026-09-02 08:00:00+00'),
('55555555-5555-5555-5555-555555555555','Deleted','User','deleted1','deleted@example.com','$2b$12$defghijklmnopqrstuuvwxWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1d',NULL,NULL,'user','active',false,'local',NULL,true,0,'2026-09-10 08:00:00+00','2026-09-11 08:00:00+00');

-- admins (3): real prod admins (NOT the dev seeder trio); bcrypt verbatim; JSON permissions
INSERT INTO admins (email, password_hash, name, role, permissions, totp_enabled, is_active, created_at, updated_at) VALUES
('ops@usamif.com','$2b$12$adminhashadminhashadminhaWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1A','Ops Lead','super_admin','{"all": true}',false,true,'2026-07-24 14:00:00+00','2026-07-24 14:00:00+00'),
('content@usamif.com','$2b$12$adminhashadminhashadminhbWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1B','Content Mgr','admin','{"content": true, "users": true}',false,true,'2026-07-25 14:00:00+00','2026-07-25 14:00:00+00'),
('mod@usamif.com','$2b$12$adminhashadminhashadminhcWmZ4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1C','Moderator','moderator','{"content": true}',false,true,'2026-07-26 14:00:00+00','2026-07-26 14:00:00+00');

-- communities (4): same 4 slugs as the seed, but PRODUCTION-MODIFIED (members_count edited by ops)
INSERT INTO communities (slug, name, emoji, tagline, description, accent_color, members_count, is_active, features, created_at, updated_at) VALUES
('freelancespace','FreelanceSpace','🔥','For freelancers','desc','#F97316',13042,true,'["a","b"]','2026-07-24 14:00:00+00','2026-10-15 14:00:00+00'),
('studentzone','StudentZone','🎓','Students','وصف عربي','#8B5CF6',18777,true,'["a"]','2026-07-24 14:00:00+00','2026-10-15 14:00:00+00'),
('hrconnect','HR Connect','💼','HR pros','desc','#06B6D4',8600,false,'[]','2026-07-24 14:00:00+00','2026-10-16 14:00:00+00'),
('launchpad','LaunchPad','🚀','Grads','desc','#22C55E',15999,true,'["x","y","z"]','2026-07-24 14:00:00+00','2026-10-16 14:00:00+00');

-- community_memberships (6): real FK edges across users+communities, enum roles
INSERT INTO community_memberships (user_id, community_id, role, joined_at) VALUES
(1,1,'admin','2026-07-24 15:00:00+00'),
(1,4,'member','2026-08-01 15:00:00+00'),
(2,2,'moderator','2026-08-02 15:00:00+00'),
(3,1,'member','2026-08-16 15:00:00+00'),
(4,3,'member','2026-09-01 15:00:00+00'),
(2,4,'member','2026-09-05 15:00:00+00');

-- settings (10): includes a PROD-MODIFIED value + a key NOT in the seeder (must be preserved)
INSERT INTO settings (key, value, type, "group", is_public, updated_at) VALUES
('site_name','USAM Hub (prod-edited)','string','general',true,'2026-10-10 10:00:00+00'),
('maintenance_mode','false','boolean','system',false,'2026-10-10 10:00:00+00'),
('max_upload_mb','25','number','uploads',false,'2026-10-10 10:00:00+00'),
('custom_prod_key','prod-only-value','string','custom',false,'2026-10-11 10:00:00+00'),
('signups_open','true','boolean','auth',true,'2026-10-10 10:00:00+00'),
('default_lang','ar','string','i18n',true,'2026-10-10 10:00:00+00'),
('support_email','support@usamif.com','string','general',true,'2026-10-10 10:00:00+00'),
('theme','dark','string','ui',true,'2026-10-10 10:00:00+00'),
('points_per_post','10','number','gamification',false,'2026-10-10 10:00:00+00'),
('json_setting','{"nested": {"k": "v, with comma"}}','json','advanced',false,'2026-10-10 10:00:00+00');

-- feature_flags (7): booleans both values, NULL description
INSERT INTO feature_flags (name, is_enabled, description, updated_at) VALUES
('offers',true,'Offers & perks','2026-10-01 10:00:00+00'),
('organizations',true,'Org profiles','2026-10-01 10:00:00+00'),
('partnerships',false,NULL,'2026-10-01 10:00:00+00'),
('nomad_ai',true,'AI chat','2026-10-01 10:00:00+00'),
('messaging',true,NULL,'2026-10-01 10:00:00+00'),
('challenges',false,'Disabled in prod','2026-10-01 10:00:00+00'),
('leaderboard',true,'On','2026-10-01 10:00:00+00');

-- email_templates (4): HTML with quotes/commas/Unicode
INSERT INTO email_templates (name, subject, html_body, variables, updated_at) VALUES
('welcome','Welcome to USAM Hub','<h1>Welcome, {{name}}!</h1><p>It''s great, really.</p>','["name"]','2026-09-01 10:00:00+00'),
('verify','Verify your email','<p>Code: {{code}}</p>','["code"]','2026-09-01 10:00:00+00'),
('reset','Reset your password','<p>Reset link: {{link}}</p>','["link"]','2026-09-01 10:00:00+00'),
('ar_welcome','مرحبا بك','<h1>أهلاً {{name}}</h1>','["name"]','2026-09-01 10:00:00+00');

-- pricing_plans (3) — real schema (name, slug, price_monthly, price_yearly, features, limits, is_active, sort_order)
INSERT INTO pricing_plans (name, slug, price_monthly, price_yearly, features, limits, is_active, sort_order, created_at, updated_at) VALUES
('Free','free',0.00,0.00,'["basic"]','{"posts": 10}',true,0,'2026-07-24 14:00:00+00','2026-07-24 14:00:00+00'),
('Pro','pro',9.99,99.00,'["basic","pro"]','{"posts": 1000}',true,1,'2026-07-24 14:00:00+00','2026-07-24 14:00:00+00'),
('Team','team',29.99,299.00,'["basic","pro","team"]','{"posts": -1}',true,2,'2026-07-24 14:00:00+00','2026-07-24 14:00:00+00');
