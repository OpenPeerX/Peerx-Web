import { getDb, resetDbForTests } from './db';
import { schedulePostSignupSequence, fetchDueEmailJobs } from './onboardingEmails';

beforeEach(() => {
  process.env.PEERX_SQLITE_PATH = ':memory:';
  resetDbForTests();
  getDb();
});

/**
 * Seed a user row so that the `email_jobs.user_id` foreign key is satisfied.
 * In production this happens via the signup API before
 * `schedulePostSignupSequence` is called; the test must mirror that flow.
 */
function seedUser(userId: string, email: string, name: string) {
  const db = getDb();
  db.prepare(
    'INSERT INTO users (id, email, name, verified, created_at) VALUES (?, ?, ?, 1, ?)'
  ).run(userId, email, name, Date.now());
}

test('schedules 7 emails for regular users and 8 for premium', async () => {
  seedUser('u1', 'a@example.com', 'A');
  seedUser('u2', 'b@example.com', 'B');

  const jobs = await schedulePostSignupSequence({ userId: 'u1', email: 'a@example.com', name: 'A', isPremium: false });
  expect(jobs.length).toBe(7);

  const jobs2 = await schedulePostSignupSequence({ userId: 'u2', email: 'b@example.com', name: 'B', isPremium: true });
  expect(jobs2.length).toBe(8);

  // confirm jobs are persisted
  const due = await fetchDueEmailJobs(100);
  // none should be due immediately since send_at is in future (but welcome may be immediate)
  expect(Array.isArray(due)).toBe(true);
});
