export type Subscriper =
  | {
      type: "http request";
      config: {
        url: string;
        method: string;
        headers?: Record<string, string>;
      };
    }
  | {
      type: "email";
      config: {
        to: string;
        subject?: string;
        from?: string;
        cc?: string | string[];
        bcc?: string | string[];
        text?: string;
        html?: string;
      };
    }
  | {
      type: "slack";
      config: {
        webhookUrl: string;
      };
    };

export type PiplineRequest = {
  name: string;
  description: string;
  subscribers: Subscriper[];
};
