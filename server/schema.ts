import { q } from './db';
import { FORM_TEMPLATES } from '../src/data/formTemplates';

async function hasColumn(table: string, column: string): Promise<boolean> {
  const rows = await q<{ c: number }[]>(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return Number(rows[0]?.c || 0) > 0;
}

async function addColumn(table: string, column: string, ddl: string): Promise<void> {
  if (!(await hasColumn(table, column))) {
    await q(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  }
}

export async function ensureSchema(): Promise<void> {
  await q(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    google_id VARCHAR(128) NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    plan ENUM('free','pro','business') NOT NULL DEFAULT 'free',
    max_free_responses INT NOT NULL DEFAULT 100,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    migrated_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await addColumn('users', 'google_id', 'google_id VARCHAR(128) NULL UNIQUE');
  await addColumn('users', 'is_admin', 'is_admin TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('users', 'migrated_at', 'migrated_at DATETIME NULL');
  await addColumn('users', 'updated_at', 'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await q(`ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL`);
  await q(`ALTER TABLE users MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await q(`CREATE TABLE IF NOT EXISTS sessions (
    token CHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    user_agent VARCHAR(255) NULL,
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_expires (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await addColumn('sessions', 'expires_at', 'expires_at DATETIME NULL');
  await addColumn('sessions', 'user_agent', 'user_agent VARCHAR(255) NULL');
  await q(`ALTER TABLE sessions MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await q(`CREATE TABLE IF NOT EXISTS payments (
    order_id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    plan ENUM('free','pro','business') NOT NULL DEFAULT 'pro',
    billing_cycle ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
    amount INT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    snap_token VARCHAR(255) NULL,
    redirect_url TEXT NULL,
    raw_response LONGTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_payments_user (user_id),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await q(`CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(32) NULL,
    icon VARCHAR(64) NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_folders_user (user_id),
    CONSTRAINT fk_folders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await q(`CREATE TABLE IF NOT EXISTS forms (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    cover_image TEXT NULL,
    folder_id VARCHAR(64) NULL,
    folder_name VARCHAR(255) NULL,
    icon_type VARCHAR(32) NULL,
    accent_color VARCHAR(32) NULL,
    accent_bg VARCHAR(32) NULL,
    theme JSON NULL,
    schedule JSON NULL,
    quiz_config JSON NULL,
    collaboration JSON NULL,
    is_template TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
    last_opened DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_forms_user (user_id),
    KEY idx_forms_folder (folder_id),
    KEY idx_forms_updated (updated_at),
    CONSTRAINT fk_forms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await addColumn('forms', 'is_template', 'is_template TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('forms', 'status', "status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft'");
  await addColumn('forms', 'name', 'name VARCHAR(255) NULL');
  await q(`ALTER TABLE forms MODIFY last_opened DATETIME NULL`);
  await q(`ALTER TABLE forms MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await q(`ALTER TABLE forms MODIFY updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);

  await q(`CREATE TABLE IF NOT EXISTS form_collaborators (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    form_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('editor','viewer') NOT NULL DEFAULT 'editor',
    status ENUM('pending','active','removed') NOT NULL DEFAULT 'pending',
    user_id VARCHAR(64) NULL,
    invited_by VARCHAR(64) NULL,
    accepted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_collab_form_email (form_id, email),
    KEY idx_collab_user (user_id),
    KEY idx_collab_email (email),
    CONSTRAINT fk_collab_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    CONSTRAINT fk_collab_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_collab_inviter FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await q(`CREATE TABLE IF NOT EXISTS questions (
    form_id VARCHAR(64) NOT NULL,
    id VARCHAR(64) NOT NULL,
    position INT NOT NULL,
    type VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NULL,
    required TINYINT(1) NOT NULL DEFAULT 0,
    options JSON NULL,
    scale_min INT NULL,
    scale_max INT NULL,
    scale_min_label VARCHAR(255) NULL,
    scale_max_label VARCHAR(255) NULL,
    placeholder TEXT NULL,
    icon VARCHAR(64) NULL,
    image_url TEXT NULL,
    image_caption TEXT NULL,
    points INT NULL,
    correct_answer JSON NULL,
    explanation TEXT NULL,
    PRIMARY KEY (form_id, id),
    CONSTRAINT fk_questions_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await addColumn('questions', 'secondary_type', 'secondary_type VARCHAR(32) NULL');

  await q(`CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    form_id VARCHAR(64) NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    answers JSON NOT NULL,
    score INT NULL,
    total_possible_score INT NULL,
    is_passed TINYINT(1) NULL,
    respondent_ip VARCHAR(45) NULL,
    KEY idx_submissions_form (form_id),
    KEY idx_submissions_time (submitted_at),
    CONSTRAINT fk_submissions_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await addColumn('submissions', 'respondent_ip', 'respondent_ip VARCHAR(45) NULL');
  await q(`ALTER TABLE submissions MODIFY submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await q(`CREATE TABLE IF NOT EXISTS system_settings (
    user_id VARCHAR(64) NOT NULL PRIMARY KEY,
    settings JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await q(`CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    messages JSON NOT NULL,
    generated_form JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_chat_user (user_id),
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await q(`CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(64) NULL,
    badge VARCHAR(64) NULL,
    icon_type VARCHAR(32) NULL,
    accent_color VARCHAR(32) NULL,
    accent_bg VARCHAR(32) NULL,
    header_cover_url TEXT NULL,
    form JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_templates_category (category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await q(`CREATE TABLE IF NOT EXISTS email_otps (
    email VARCHAR(255) NOT NULL PRIMARY KEY,
    code_hash VARCHAR(255) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_email_otps_expires (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await seedTemplates();
}

export async function seedTemplates(): Promise<void> {
  const existing = await q<{ c: number }[]>(`SELECT COUNT(*) AS c FROM templates`);
  if (Number(existing[0]?.c || 0) > 0) return;

  for (const t of FORM_TEMPLATES) {
    await q(
      `INSERT INTO templates (id, name, description, category, badge, icon_type, accent_color, accent_bg, header_cover_url, form)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), form = VALUES(form)`,
      [
        t.id,
        t.name,
        t.description || null,
        t.category || null,
        t.badge || null,
        t.iconType || null,
        t.accentColor || null,
        t.accentBg || null,
        t.headerCoverUrl || null,
        JSON.stringify(t.form),
      ]
    );
  }
}
