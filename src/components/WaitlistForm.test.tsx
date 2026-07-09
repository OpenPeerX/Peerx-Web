import { render, screen, act, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import WaitlistForm from '@/components/WaitlistForm';

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

beforeEach(() => {
  // Pretend the CSRF endpoint always returns a token synchronously, so the
  // useEffect that sets csrfToken does not produce post-render warnings.
  // We override fetch globally; each test still uses a fresh WaitlistForm.
  global.fetch = jest.fn((url) => {
    if (typeof url === 'string' && url.includes('/api/csrf')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'test-csrf-token' }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }) as unknown as typeof fetch;
});

describe('WaitlistForm', () => {
  it('renders the form correctly', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<WaitlistForm />);
      container = result.container;
    });
    // Allow the CSRF useEffect to settle
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
    expect(container!.querySelector('input[type="email"]')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<WaitlistForm />);
      container = result.container;
    });
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
