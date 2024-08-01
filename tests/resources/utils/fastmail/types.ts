export type SessionData = {
  apiUrl: string;
  primaryAccounts: {
    "urn:ietf:params:jmap:mail": string;
  };
};

export type EmailQueryResponse<T = any> = {
  sessionState: string;
  methodResponses: T[];
};

export type Email = {
  id: string;
  subject: string;
  receivedAt: string;
  bodyValues: {
    [key: string]: {
      value: string;
    };
  };
  from: {
    email: string;
    name: string;
  }[];
};

export type MailboxQueryArgs = {
  apiUrl: string;
  accountId: string;
  inboxId: string;
  to: string;
  subject: string;
  from: string;
};

export type FetchEmailArgs = {
  to: string;
  subject: string;
  from: string;
};
