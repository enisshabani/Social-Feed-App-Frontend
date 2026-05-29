import { sendEmailVerification, type User } from 'firebase/auth';

export const sendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-email`,
      handleCodeInApp: false,
    });
  } catch (err: any) {
    if (err?.code !== 'auth/unauthorized-continue-uri') {
      throw err;
    }

    await sendEmailVerification(user);
  }
};

export const getFirebaseErrorMessage = (err: any, fallback: string) => {
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.code) return `${fallback} (${err.code})`;
  return fallback;
};
