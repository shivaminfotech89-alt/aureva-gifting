export {};

declare global {
  interface Window {
    recaptchaVerifier: any;
    __hideLoader?: () => void;
  }
}
