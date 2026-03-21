type HttpSubscriper = {
  type: "http request";
  config: {
    url: string;
    method: string;
    headers?: Record<string, string>;
  };
};

type EmailSubscriper = {
  type: "email";
  config: {
    to: string;
    subject?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    text?: string;
    html?: string;
    category?: string;
  };
};

type SlackSubscriper = {
  type: "slack";
  config: {
    webhookUrl: string;
  };
};

type Subscriber = HttpSubscriper | EmailSubscriper | SlackSubscriper;
