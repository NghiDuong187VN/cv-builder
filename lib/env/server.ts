import 'server-only';

import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

const envSchemas = {
  gemini: z.object({
    GEMINI_API_KEY: nonEmptyString,
  }),
  firebaseAdmin: z.object({
    FIREBASE_PROJECT_ID: nonEmptyString,
    FIREBASE_CLIENT_EMAIL: nonEmptyString,
    FIREBASE_PRIVATE_KEY: nonEmptyString.transform(normalizePrivateKey),
  }),
  aiBackend: z.object({
    GEMINI_API_KEY: nonEmptyString,
    FIREBASE_PROJECT_ID: nonEmptyString,
    FIREBASE_CLIENT_EMAIL: nonEmptyString,
    FIREBASE_PRIVATE_KEY: nonEmptyString.transform(normalizePrivateKey),
  }),
} as const;

type EnvSchemaMap = typeof envSchemas;
type EnvTarget = keyof EnvSchemaMap;
type EnvPayload<T extends EnvTarget> = z.infer<EnvSchemaMap[T]>;

const envLabels: Record<EnvTarget, string> = {
  gemini: 'Gemini API',
  firebaseAdmin: 'Firebase Admin',
  aiBackend: 'AI backend',
};

const loggedMessages = new Set<string>();

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePrivateKey(value: string) {
  const unwrappedKey = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
  return unwrappedKey.replace(/\\n/g, '\n').trim();
}

function getRawEnv(target: EnvTarget) {
  switch (target) {
    case 'gemini':
      return {
        GEMINI_API_KEY: readEnv('GEMINI_API_KEY'),
      };
    case 'firebaseAdmin':
      return {
        FIREBASE_PROJECT_ID: readEnv('FIREBASE_PROJECT_ID'),
        FIREBASE_CLIENT_EMAIL: readEnv('FIREBASE_CLIENT_EMAIL'),
        FIREBASE_PRIVATE_KEY: readEnv('FIREBASE_PRIVATE_KEY'),
      };
    case 'aiBackend':
      return {
        GEMINI_API_KEY: readEnv('GEMINI_API_KEY'),
        FIREBASE_PROJECT_ID: readEnv('FIREBASE_PROJECT_ID'),
        FIREBASE_CLIENT_EMAIL: readEnv('FIREBASE_CLIENT_EMAIL'),
        FIREBASE_PRIVATE_KEY: readEnv('FIREBASE_PRIVATE_KEY'),
      };
  }
}

function logOnce(message: string) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (loggedMessages.has(message)) {
    return;
  }

  loggedMessages.add(message);
  console.error(message);
}

export class EnvValidationError extends Error {
  readonly code = 'ENV_VALIDATION_ERROR';
  readonly status = 500;

  constructor(
    readonly target: EnvTarget,
    readonly missingKeys: string[]
  ) {
    super(`[env:${target}] Missing or invalid required env vars: ${missingKeys.join(', ')}`);
    this.name = 'EnvValidationError';
  }

  toApiError() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      error: {
        code: this.code,
        message: isProduction
          ? `${envLabels[this.target]} is not configured correctly.`
          : this.message,
        ...(isProduction ? {} : { missingKeys: this.missingKeys }),
      },
    };
  }
}

export function validateEnv(target: 'gemini'): EnvPayload<'gemini'>;
export function validateEnv(target: 'firebaseAdmin'): EnvPayload<'firebaseAdmin'>;
export function validateEnv(target: 'aiBackend'): EnvPayload<'aiBackend'>;
export function validateEnv<T extends EnvTarget>(target: T): EnvPayload<T> {
  const schema = envSchemas[target];
  const result = schema.safeParse(getRawEnv(target));

  if (result.success) {
    return result.data as EnvPayload<T>;
  }

  const missingKeys = Array.from(
    new Set(result.error.issues.map((issue) => issue.path[0]).filter((value): value is string => typeof value === 'string'))
  );
  const error = new EnvValidationError(target, missingKeys);
  logOnce(error.message);
  throw error;
}

export function getGeminiApiKey() {
  return validateEnv('gemini').GEMINI_API_KEY;
}

export function getFirebaseAdminEnv() {
  return validateEnv('firebaseAdmin');
}
