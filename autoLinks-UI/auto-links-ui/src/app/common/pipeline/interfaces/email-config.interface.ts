export interface IEmailConfig {
  to: string;
  subject?: string;
  from?: string;
  cc?: string;
  bcc?: string;
  text?: string;
  html?: string;
  category?: string;
}
