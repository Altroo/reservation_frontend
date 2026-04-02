import { getTranslations } from '@/utils/getTranslations';

export const INPUT_REQUIRED = () => getTranslations().validation.required;
export const SHORT_INPUT_REQUIRED = () => getTranslations().validation.shortRequired;
export const INPUT_MIN = (char: number) => getTranslations().validation.minLength(char);
export const INPUT_MAX = (char: number) => getTranslations().validation.maxLength(char);
export const MINI_INPUT_EMAIL = () => getTranslations().validation.emailInvalid;
export const INPUT_PASSWORD_MIN = (char: number) => getTranslations().validation.passwordMinLength(char);
