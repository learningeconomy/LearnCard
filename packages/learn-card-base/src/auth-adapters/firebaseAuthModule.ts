let firebaseAuthModule: Promise<typeof import('firebase/auth')> | undefined;

export const loadFirebaseAuth = (): Promise<typeof import('firebase/auth')> =>
    (firebaseAuthModule ??= import('firebase/auth'));
