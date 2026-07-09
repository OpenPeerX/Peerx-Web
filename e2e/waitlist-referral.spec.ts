import { test, expect } from '@playwright/test';

/**
 * Sanity-check that the Next.js server boots and renders the landing page
 * without depending on captcha or CSRF secrets. This is the only test that
 * runs unconditionally — it acts as a guardrail for the build pipeline.
 */
test('homepage boots and renders successfully', async ({ page }) => {
  await page.goto('/');
  // The landing page must render without throwing; checking the email
  // input is present proves the React tree mounted and the waitlist
  // form loaded its client bundle.
  await expect(page.getByLabel('Email address')).toBeVisible();
});

test.describe('Waitlist Flow (skipped in CI: requires Turnstile + CSRF env vars)', () => {
  test.skip(!!process.env.CI, 'Skipped in CI: requires Turnstile captcha bypass token and live CSRF cookie store');

  test('user can join waitlist (smoke)', async ({ page }) => {
    await page.goto('/');

    const email = `user_${Date.now()}@example.com`;
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Join Waitlist' }).click();

    await expect(page.getByRole('alert')).toContainText("You're on the list!");
  });

  test('referral flow awards 1 point after verify', async ({ page, request }) => {
    const csrfRes = await request.get('/api/csrf');
    expect(csrfRes.ok()).toBeTruthy();
    const csrfJson = (await csrfRes.json()) as { token: string };
    const setCookie = csrfRes.headers()['set-cookie'];
    expect(setCookie).toBeTruthy();
    const cookie = setCookie.split(';')[0];

    const referrerEmail = `ref_${Date.now()}@example.com`;
    const referrerRes = await request.post('/api/waitlist', {
      headers: {
        origin: 'http://127.0.0.1:3000',
        'content-type': 'application/json',
        'x-csrf-token': csrfJson.token,
        cookie,
      },
      data: { email: referrerEmail },
    });
    expect(referrerRes.ok()).toBeTruthy();
    const referrerJson = (await referrerRes.json()) as { user: { id: string }; myReferralCode: string };

    await page.goto(`/?ref=${referrerJson.myReferralCode}`);
    const referredEmail = `referred_${Date.now()}@example.com`;

    const waitlistResponsePromise = page.waitForResponse((r) => r.url().includes('/api/waitlist') && r.request().method() === 'POST');
    await page.getByLabel('Email address').fill(referredEmail);
    await page.getByRole('button', { name: 'Join Waitlist' }).click();
    const waitlistResponse = await waitlistResponsePromise;
    expect(waitlistResponse.ok()).toBeTruthy();
    const waitlistJson = (await waitlistResponse.json()) as { user: { id: string } };

    const verifyCsrfRes = await request.get('/api/csrf');
    const verifyCsrfJson = (await verifyCsrfRes.json()) as { token: string };
    const verifyCookie = (verifyCsrfRes.headers()['set-cookie'] || '').split(';')[0];

    const verifyRes = await request.post('/api/waitlist/verify', {
      headers: {
        origin: 'http://127.0.0.1:3000',
        'content-type': 'application/json',
        'x-csrf-token': verifyCsrfJson.token,
        cookie: verifyCookie,
      },
      data: { userId: waitlistJson.user.id },
    });
    expect(verifyRes.ok()).toBeTruthy();

    const pointsRes = await request.get(`/api/users/${referrerJson.user.id}/points`);
    expect(pointsRes.ok()).toBeTruthy();
    const pointsJson = (await pointsRes.json()) as { points: number; successfulReferrals: number };
    expect(pointsJson.points).toBeGreaterThanOrEqual(1);
    expect(pointsJson.successfulReferrals).toBe(1);
  });
});
