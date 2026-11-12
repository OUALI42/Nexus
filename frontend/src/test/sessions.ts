const IDLE = { idle_timeout: 1800, idle_warning: 120 };

export const ANONYMOUS_SESSION = {
  authenticated: false,
  user: null,
  ...IDLE,
};

export function authenticatedSession(
  overrides: { needs_onboarding?: boolean } = {},
) {
  return {
    authenticated: true,
    user: {
      email: "ada@example.com",
      username: "ada",
      track: "mpsi",
      plan: { code: "basic", name: "Basique" },
      needs_onboarding: false,
      ...overrides,
    },
    ...IDLE,
  };
}
