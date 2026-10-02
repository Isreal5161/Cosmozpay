/// <reference types="vite/client" />

export interface AdminLoginCredentials {
  identifier: string;
  password: string;
}

export interface AdminProfile {
  id: string;
  email?: string;
  username?: string;
  role: string;
  status: string;
  is_active: boolean;
  [key: string]: unknown;
}

interface AdminTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export type AdminLoginResult =
  | { requiresMfa: true; referenceId: string }
  | { requiresMfa: false };

export class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

let inMemoryTokens: AdminTokens | null = null;
let refreshInFlight: Promise<void> | null = null;
let sessionInvalidationHandler: (() => void) | null = null;

function apiUrl(path: string): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configuredBase) {
    throw new AdminAuthError('The authentication service is not configured.');
  }

  const base = configuredBase.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${base}/${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSafeMessage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const message = value.trim();
  return Boolean(
    message &&
    message.length <= 240 &&
    !/\b(password|token|secret|authorization|sql|database|traceback|stack trace|api.?key|smtp)\b/i.test(message),
  );
}

function validationMessage(errors: unknown): string | null {
  if (!Array.isArray(errors)) return null;
  const messages = errors
    .map((item) => (isRecord(item) && isSafeMessage(item.msg) ? item.msg.trim() : null))
    .filter((item): item is string => item !== null);
  return messages.length ? messages.join(' ') : null;
}

function normalizeErrorMessage(
  response: Response,
  body: unknown,
  fallback: string,
): string {
  if (response.status === 401 || response.status === 403) return fallback;
  if (response.status >= 500) return 'Unable to connect to the server. Please try again.';

  if (isRecord(body)) {
    const detail = body.detail;
    const errors = validationMessage(body.errors) ?? validationMessage(detail);
    if (errors) return errors;
    if (isSafeMessage(body.message)) return body.message.trim();
    if (isSafeMessage(detail)) return detail.trim();
  }
  return fallback;
}

async function sendJson(
  path: string,
  body: unknown,
  options: {
    accessToken?: string;
    fallback: string;
  },
): Promise<{ response: Response; body: unknown }> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new AdminAuthError('Unable to connect to the server. Please try again.');
  }

  const responseBody = await readJson(response);
  if (!response.ok) {
    throw new AdminAuthError(
      normalizeErrorMessage(response, responseBody, options.fallback),
      response.status,
    );
  }
  return { response, body: responseBody };
}

async function sendGet(
  path: string,
  accessToken: string,
  fallback: string,
): Promise<{ response: Response; body: unknown }> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new AdminAuthError('Unable to connect to the server. Please try again.');
  }

  const responseBody = await readJson(response);
  if (!response.ok) {
    throw new AdminAuthError(
      normalizeErrorMessage(response, responseBody, fallback),
      response.status,
    );
  }
  return { response, body: responseBody };
}

function envelopeData<T>(body: unknown, fallback: string): T {
  if (!isRecord(body) || body.success !== true || !Object.prototype.hasOwnProperty.call(body, 'data')) {
    throw new AdminAuthError(fallback);
  }
  return body.data as T;
}

function updateTokens(data: TokenResponse): void {
  if (
    typeof data.access_token !== 'string' ||
    !data.access_token ||
    typeof data.refresh_token !== 'string' ||
    !data.refresh_token ||
    typeof data.token_type !== 'string' ||
    data.token_type.toLowerCase() !== 'bearer'
  ) {
    throw new AdminAuthError('The server returned an invalid authentication response.');
  }

  inMemoryTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:
      typeof data.expires_in === 'number' && Number.isFinite(data.expires_in)
        ? Date.now() + data.expires_in * 1000
        : null,
  };
}

function notifySessionInvalidated(): void {
  clearAdminSession();
  sessionInvalidationHandler?.();
}

export function hasAdminSession(): boolean {
  return inMemoryTokens !== null;
}

export function clearAdminSession(): void {
  inMemoryTokens = null;
}

export function registerSessionInvalidationHandler(handler: (() => void) | null): void {
  sessionInvalidationHandler = handler;
}

export async function loginAdmin(
  credentials: AdminLoginCredentials,
): Promise<AdminLoginResult> {
  clearAdminSession();
  const { body } = await sendJson('/auth/admin/login', {
    login_identifier: credentials.identifier.trim(),
    password: credentials.password,
  }, { fallback: 'Invalid admin credentials.' });
  const data = envelopeData<Record<string, unknown> & Partial<TokenResponse>>(
    body,
    'The server returned an invalid login response.',
  );

  if (data.requires_mfa === true) {
    if (typeof data.reference_id !== 'string' || !data.reference_id) {
      throw new AdminAuthError('The server returned an invalid verification challenge.');
    }
    return { requiresMfa: true, referenceId: data.reference_id };
  }

  updateTokens(data as TokenResponse);
  return { requiresMfa: false };
}

export async function verifyAdminMfa(
  referenceId: string,
  otpCode: string,
): Promise<void> {
  const { body } = await sendJson('/auth/admin/verify-mfa', {
    reference_id: referenceId,
    otp_code: otpCode,
  }, { fallback: 'The verification code is invalid or expired.' });
  const data = envelopeData<Partial<TokenResponse>>(
    body,
    'The server returned an invalid verification response.',
  );
  updateTokens(data as TokenResponse);
}

async function performRefresh(): Promise<void> {
  const refreshToken = inMemoryTokens?.refreshToken;
  if (!refreshToken) {
    notifySessionInvalidated();
    throw new AdminAuthError('Your session has expired. Please sign in again.');
  }

  try {
    const { body } = await sendJson(
      '/auth/admin/refresh',
      { refresh_token: refreshToken },
      { fallback: 'Your session has expired. Please sign in again.' },
    );
    const data = envelopeData<Partial<TokenResponse>>(
      body,
      'Your session has expired. Please sign in again.',
    );
    updateTokens(data as TokenResponse);
  } catch {
    notifySessionInvalidated();
    throw new AdminAuthError('Your session has expired. Please sign in again.');
  }
}

export async function refreshAdminSession(): Promise<void> {
  if (!refreshInFlight) {
    const refresh = performRefresh();
    refreshInFlight = refresh;
  }
  const activeRefresh = refreshInFlight;
  try {
    await activeRefresh;
  } finally {
    if (refreshInFlight === activeRefresh) refreshInFlight = null;
  }
}

async function accessTokenAfterUnauthorized(usedAccessToken: string): Promise<string> {
  if (!inMemoryTokens) {
    throw new AdminAuthError('Your session has expired. Please sign in again.', 401);
  }

  if (inMemoryTokens.accessToken === usedAccessToken) {
    await refreshAdminSession();
  }

  const currentAccessToken = inMemoryTokens?.accessToken;
  if (!currentAccessToken) {
    throw new AdminAuthError('Your session has expired. Please sign in again.', 401);
  }
  return currentAccessToken;
}

async function authenticatedGet(
  path: string,
  fallback: string,
): Promise<unknown> {
  if (!inMemoryTokens) {
    throw new AdminAuthError('Your session has expired. Please sign in again.', 401);
  }

  if (inMemoryTokens.expiresAt !== null && Date.now() >= inMemoryTokens.expiresAt) {
    await refreshAdminSession();
  }

  const accessToken = inMemoryTokens?.accessToken;
  if (!accessToken) {
    throw new AdminAuthError('Your session has expired. Please sign in again.', 401);
  }

  let result: { response: Response; body: unknown };
  try {
    result = await sendGet(path, accessToken, fallback);
  } catch (error) {
    if (!(error instanceof AdminAuthError) || error.status !== 401) throw error;
    const retryAccessToken = await accessTokenAfterUnauthorized(accessToken);
    try {
      result = await sendGet(path, retryAccessToken, fallback);
    } catch (retryError) {
      if (retryError instanceof AdminAuthError && retryError.status === 401) {
        notifySessionInvalidated();
      }
      throw retryError;
    }
  }

  return envelopeData(result.body, fallback);
}

export async function getCurrentAdmin(): Promise<AdminProfile> {
  try {
    const data = await authenticatedGet(
      '/admin/me',
      'Your Admin session is no longer valid. Please sign in again.',
    );
    const normalizedRole = isRecord(data) && typeof data.role === 'string'
      ? data.role.trim().toLowerCase().replace(/ /g, '_')
      : '';
    if (
      !isRecord(data) ||
      typeof data.id !== 'string' ||
      !data.id.trim() ||
      !['admin', 'super_admin'].includes(normalizedRole) ||
      typeof data.status !== 'string' ||
      data.is_active !== true ||
      data.status.trim().toLowerCase() !== 'active'
    ) {
      throw new AdminAuthError('Your Admin session is no longer valid. Please sign in again.', 403);
    }
    return data as AdminProfile;
  } catch (error) {
    if (error instanceof AdminAuthError && (error.status === 401 || error.status === 403)) {
      notifySessionInvalidated();
    }
    throw error;
  }
}

export async function requestAdminApi(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!inMemoryTokens) {
    throw new AdminAuthError('Your session has expired. Please sign in again.', 401);
  }

  if (inMemoryTokens.expiresAt !== null && Date.now() >= inMemoryTokens.expiresAt) {
    await refreshAdminSession();
  }

  const request = async (accessToken: string) => {
    try {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);
      return await fetch(apiUrl(path), {
        ...init,
        headers,
      });
    } catch {
      throw new AdminAuthError('Unable to connect to the server. Please try again.');
    }
  };

  const accessToken = inMemoryTokens?.accessToken;
  if (!accessToken) {
    throw new AdminAuthError('Your session has expired. Please sign in again.', 401);
  }
  let response = await request(accessToken);
  if (response.status === 401) {
    const retryAccessToken = await accessTokenAfterUnauthorized(accessToken);
    response = await request(retryAccessToken);
  }

  const body = await readJson(response);
  if (!response.ok) {
    if (response.status === 401) notifySessionInvalidated();
    throw new AdminAuthError(
      normalizeErrorMessage(response, body, 'The request could not be completed.'),
      response.status,
    );
  }
  if (!isRecord(body) || body.success !== true || !Object.prototype.hasOwnProperty.call(body, 'data')) {
    throw new AdminAuthError('The server returned an invalid response.');
  }
  return body.data;
}

export async function logoutAdmin(): Promise<void> {
  const tokens = inMemoryTokens;
  if (!tokens) {
    clearAdminSession();
    return;
  }

  try {
    await sendJson(
      '/auth/admin/logout',
      { refresh_token: tokens.refreshToken },
      {
        fallback: 'Unable to complete sign out.',
        accessToken: tokens.accessToken,
      },
    );
  } finally {
    clearAdminSession();
  }
}
