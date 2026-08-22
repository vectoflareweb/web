DELETE FROM feedback;
DELETE FROM "user";
INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, role) VALUES
  ('seed-user-a', 'Seed A', 'a@example.com', 1, 0, 0, 'admin'),
  ('seed-user-b', 'Seed B', 'b@example.com', 1, 0, 0, 'user');
INSERT INTO feedback (id, user_id, title, body, status, created_at, updated_at) VALUES
  ('fb-seed-1', 'seed-user-b', 'Add dark mode to the docs', 'The docs are bright at night.', 'open', 0, 0),
  ('fb-seed-2', 'seed-user-b', 'Webhooks retry dashboard', '', 'planned', 0, 0),
  ('fb-seed-3', 'seed-user-a', 'Deploy button for Railway', '', 'closed', 0, 0);
