// src/app/constants/validators.ts

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`~]).{10,}$/;
