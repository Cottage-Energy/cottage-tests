import axios from "axios";
import { Config } from "sst/node/config";
import { FastmailError } from "utils/errors";
import { SessionData, MailboxQueryArgs, EmailQueryResponse, FetchEmailArgs, Email } from "../fastmail/types";

export class FastmailClient {
  private hostname: string;
  private authUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.hostname = "api.fastmail.com";
    this.authUrl = `https://${this.hostname}/.well-known/jmap`;
    this.headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Config.FASTMAIL_API_KEY}`,
    };
  }

  /**
   * Retrieves the session data from the Fastmail API.
   * @returns {Promise<SessionData>} The session data.
   */
  async getSession(): Promise<SessionData> {
    const { data } = await axios.get(this.authUrl, { headers: this.headers });
    return data;
  }

  /**
   * Queries the inbox ID from the Fastmail API.
   * @param {string} apiUrl - The API URL.
   * @param {string} accountId - The account ID.
   * @returns {Promise<string>} The inbox ID.
   */
  private async getInboxId(apiUrl: string, accountId: string): Promise<string> {
    const body = {
      using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
      methodCalls: [
        [
          "Mailbox/query",
          {
            accountId,
            filter: { role: "inbox", hasAnyRole: true },
          },
          "a",
        ],
      ],
    };

    const { data } = await axios.post(apiUrl, body, { headers: this.headers });
    const inboxId = data["methodResponses"][0][1]["ids"][0];

    if (!inboxId) {
      throw new FastmailError("Could not get an inbox.");
    }

    return inboxId;
  }

  /**
   * Queries the mailbox from the Fastmail API.
   * @param {MailboxQueryArgs} args - The parameters for the mailbox query.
   * @returns {Promise<EmailQueryResponse>} The mailbox data.
   */
  private async getMailbox(args: MailboxQueryArgs): Promise<EmailQueryResponse> {
    const { apiUrl, accountId, inboxId, to, subject, from } = args;
    const body = {
      using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
      methodCalls: [
        [
          "Email/query",
          {
            accountId,
            filter: { inMailbox: inboxId, subject, to, from },
            sort: [{ property: "receivedAt", isAscending: false }],
            limit: 10,
          },
          "1",
        ],
        [
          "Email/get",
          {
            accountId,
            // See other properties here https://www.rfc-editor.org/rfc/rfc8621.html#section-4.2
            properties: ["id", "subject", "receivedAt", "bodyValues", "from"],
            fetchHTMLBodyValues: true,
            // This resolves to an array of email IDs from the Email/query method
            "#ids": {
              resultOf: "1",
              name: "Email/query",
              path: "/ids/*",
            },
          },
          "2",
        ],
      ],
    };
    const { data } = await axios.post(apiUrl, body, { headers: this.headers });

    return data;
  }

  /**
   * Fetches emails from the Fastmail API.
   * @param {FetchEmailsArgs} args - The parameters for fetching emails.
   * @returns {Promise<Email[]>} The list of emails.
   */
  public async fetchEmails(args: FetchEmailArgs): Promise<Email[]> {
    const { to, subject, from } = args;
    const session = await this.getSession();
    const apiUrl = session.apiUrl;
    const accountId = session.primaryAccounts["urn:ietf:params:jmap:mail"];
    const inboxId = await this.getInboxId(apiUrl, accountId);
    const mailbox = await this.getMailbox({ apiUrl, accountId, inboxId, to, subject, from });

    return mailbox["methodResponses"][1][1]["list"];
  }

  /**
   * Fetches a single email from the Fastmail API.
   * @param {FetchEmailArgs} args - The parameters for fetching a single email.
   * @returns {Promise<Email>} The email.
   */
  public async fetchEmail(args: FetchEmailArgs): Promise<Email> {
    const emails = await this.fetchEmails(args);
    return emails[0];
  }
}

export default FastmailClient;