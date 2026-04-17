import { z } from 'zod';

const publicFirebaseEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().trim().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().trim().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().trim().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().trim().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().trim().min(1),
});

export type PublicFirebaseEnv = z.infer<typeof publicFirebaseEnvSchema>;

const loggedMessages = new Set<string>();

function sanitize(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function logOnce(message: string) {
  if (loggedMessages.has(message)) {
    return;
  }
  loggedMessages.add(message);
  console.warn(message);
}

export function getPublicFirebaseEnv(): PublicFirebaseEnv {
  const raw = {
    NEXT_PUBLIC_FIREBASE_API_KEY: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    NEXT_PUBLIC_FIREBASE_APP_ID: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };

  const result = publicFirebaseEnvSchema.safeParse(raw);

  if (result.success) {
    return result.data;
  }

  const missingKeys = Array.from(
    new Set(result.error.issues.map((issue) => issue.path[0]).filter((value): value is string => typeof value === 'string'))
  );
  const message = `[env:firebaseClient] Missing Firebase config: ${missingKeys.join(', ')}. Check your environment variables.`;
  logOnce(message);

  return raw as PublicFirebaseEnv;
}
