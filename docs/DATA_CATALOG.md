# Data Catalog — KedataForm (MySQL)

Database: `formcraft_studio` (MySQL 8, InnoDB, utf8mb4). Skema dibuat/diperluas otomatis saat server start (`server/schema.ts`, idempoten).

| Tabel | PK | FK / Index | Kolom penting |
|-------|----|-----------|----------------|
| `users` | `id` | `email` UNIQUE, `google_id` UNIQUE | name, avatar_url, plan (`free/pro/business`), max_free_responses, is_admin, migrated_at, created_at, updated_at, password_hash (nullable) |
| `sessions` | `token` (CHAR 64) | `user_id`→users (cascade), idx expires_at | created_at, expires_at, user_agent |
| `folders` | `id` | `user_id`→users (cascade) | name, color, icon, description, created_at |
| `forms` | `id` | `user_id`→users (cascade), idx folder_id/updated_at | title, description, cover_image, folder_id/name, icon_type, accent_color, accent_bg, theme(JSON), schedule(JSON), quiz_config(JSON), collaboration(JSON), is_template, status(`draft/published/closed`), last_opened, created_at, updated_at |
| `questions` | (`form_id`,`id`) | `form_id`→forms (cascade) | position, type, title, description, required, options(JSON), scale_min/max(+label), placeholder, icon, image_url/caption, points, correct_answer(JSON), explanation |
| `submissions` | `id` | `form_id`→forms (cascade), idx submitted_at | submitted_at, answers(JSON), score, total_possible_score, is_passed, respondent_ip |
| `system_settings` | `user_id` | →users (cascade) | settings(JSON), updated_at |
| `ai_chat_sessions` | `id` | `user_id`→users (cascade) | title, messages(JSON), generated_form(JSON), created_at, updated_at |
| `templates` | `id` | idx category | name, description, category, badge, icon_type, accent_color, accent_bg, header_cover_url, form(JSON) |

## Catatan

- **JSON columns**: `theme`, `schedule`, `quiz_config`, `collaboration`, `options`, `correct_answer`, `answers`, `settings`, `messages`, `generated_form`, `form`.
- **templates** di-seed dari `src/data/formTemplates.ts` (`FORM_TEMPLATES`) hanya bila tabel kosong.
- Kolom `status` menyimpan siklus form; default `draft`.
- Gambar (cover/logo/avatar) disimpan sebagai base64 di kolom TEXT/JSON (rencana pindah ke object storage: V2).
- Menghapus user → cascade ke folders, forms (→ questions, submissions), settings, chat.
