import { getLogger } from './logger.js';
import {
  type SikkaApiError,
  type SikkaClaim,
  type SikkaClaimListParams,
  type SikkaClaimListResponse,
  type SikkaClaimPaymentRequest,
  type SikkaClaimPaymentResponse,
  type SikkaClientConfig,
  type SikkaClientCredentials,
  type SikkaPatient,
  type SikkaPatientListParams,
  type SikkaPatientListResponse,
  type SikkaPaymentType,
  type SikkaPaymentTypeListParams,
  type SikkaPaymentTypeListResponse,
  type SikkaRequestKeyRequest,
  type SikkaRequestKeyResponse,
  type SikkaTransaction,
  type SikkaTransactionListParams,
  type SikkaTransactionListResponse,
} from './types.js';

const SIKKA_BASE_URL = 'https://api.sikkasoft.com';

/**
 * Sikka API Client
 *
 * Provides authenticated access to Sikka's ONE API for a specific practice/office.
 *
 * @example
 * ```typescript
 * const client = new SikkaClient({
 *   credentials: {
 *     appId: 'your-app-id',
 *     appKey: 'your-app-key',
 *     officeId: 'practice-office-id',
 *     secretKey: 'practice-secret-key',
 *   },
 * });
 *
 * await client.authenticate();
 *
 * const patients = await client.patients.list({ firstname: 'John' });
 * ```
 */
export class SikkaClient {
  /**
   * Claim payment endpoints.
   */
  public readonly claimPayment = {
    /**
     * Post a payment to a claim.
     *
     * @param request - Payment details
     * @returns Payment response
     *
     * @example
     * ```typescript
     * const result = await client.claimPayment.post({
     *   claim_sr_no: '123456',
     *   practice_id: 'practice-id',
     *   payment_amount: '100.00|50.00', // Pipe-delimited for multiple line items
     *   transaction_sr_no: '789|790',   // Corresponding transaction IDs
     *   write_off: '0.00|0.00',
     *   claim_payment_date: '2024-01-15',
     *   payment_mode: 'EFT',
     *   cheque_no: 'CHK123',
     *   is_payment_by_procedure_code: 'false',
     *   note: 'Insurance payment',
     * });
     * ```
     */
    post: async (
      request: SikkaClaimPaymentRequest,
    ): Promise<SikkaClaimPaymentResponse> => {
      const response = await this.post<SikkaClaimPaymentResponse>(
        '/v4/claim_payment',
        request as unknown as Record<string, unknown>,
      );
      return response;
    },
  };

  /**
   * Claims management endpoints.
   */
  public readonly claims = {
    /**
     * List claims matching the given criteria.
     *
     * @param params - Search parameters
     * @returns List of matching claims
     *
     * @example
     * ```typescript
     * const claims = await client.claims.list({
     *   patient_id: '12345',
     *   status: 'Pending',
     *   start_date: '2024-01-01',
     *   end_date: '2024-12-31',
     * });
     * ```
     */
    list: async (params: SikkaClaimListParams): Promise<SikkaClaim[]> => {
      const queryParams: Record<string, string> = {};
      if (params.patient_id) {
        queryParams.patient_id = params.patient_id;
      }

      if (params.claim_id) {
        queryParams.claim_id = params.claim_id;
      }

      if (params.status) {
        queryParams.status = params.status;
      }

      if (params.start_date) {
        queryParams.start_date = params.start_date;
      }

      if (params.end_date) {
        queryParams.end_date = params.end_date;
      }

      if (params.limit) {
        queryParams.limit = String(params.limit);
      }

      if (params.offset) {
        queryParams.offset = String(params.offset);
      }

      const response = await this.get<SikkaClaimListResponse>(
        '/v4/claims',
        queryParams,
      );
      return response.items;
    },
  };

  /**
   * Patient management endpoints.
   */
  public readonly patients = {
    /**
     * List patients matching the given criteria.
     *
     * @param params - Search parameters
     * @returns List of matching patients
     *
     * @example
     * ```typescript
     * const patients = await client.patients.list({
     *   firstname: 'John',
     *   lastname: 'Doe',
     * });
     * ```
     */
    list: async (params: SikkaPatientListParams): Promise<SikkaPatient[]> => {
      const queryParams: Record<string, string> = {};
      if (params.firstname) {
        queryParams.firstname = params.firstname;
      }

      if (params.lastname) {
        queryParams.lastname = params.lastname;
      }

      if (params.birthdate) {
        queryParams.birthdate = params.birthdate;
      }

      if (params.patient_id) {
        queryParams.patient_id = params.patient_id;
      }

      if (params.limit) {
        queryParams.limit = String(params.limit);
      }

      if (params.offset) {
        queryParams.offset = String(params.offset);
      }

      const response = await this.get<SikkaPatientListResponse>(
        '/v4/patients',
        queryParams,
      );
      return response.items;
    },
  };

  /**
   * Payment types management endpoints.
   * Payment types represent the different methods a practice accepts for payments.
   */
  public readonly paymentTypes = {
    /**
     * List payment types for the practice.
     *
     * @param params - Optional filter and pagination parameters
     * @returns List of payment types
     *
     * @example
     * ```typescript
     * // Get all payment types
     * const types = await client.paymentTypes.list();
     *
     * // Get only insurance payment types
     * const insuranceTypes = await client.paymentTypes.list({
     *   is_insurance_type: true,
     * });
     * ```
     */
    list: async (
      params: SikkaPaymentTypeListParams = {},
    ): Promise<SikkaPaymentType[]> => {
      const queryParams: Record<string, string> = {};

      if (params.code) {
        queryParams.code = params.code;
      }

      if (params.customer_id) {
        queryParams.customer_id = params.customer_id;
      }

      if (params.practice_id) {
        queryParams.practice_id = params.practice_id;
      }

      if (params.is_adjustment_type) {
        queryParams.is_adjustment_type = 'true';
      }

      if (params.is_debit_adjustment_type) {
        queryParams.is_debit_adjustment_type = 'true';
      }

      if (params.is_insurance_type) {
        queryParams.is_insurance_type = 'true';
      }

      if (params.are_credit_card_details_required) {
        queryParams.are_credit_card_details_required = 'true';
      }

      if (params.limit) {
        queryParams.limit = String(params.limit);
      }

      if (params.offset) {
        queryParams.offset = String(params.offset);
      }

      const response = await this.get<SikkaPaymentTypeListResponse>(
        '/v4/payment_types',
        queryParams,
      );
      return response.items;
    },
  };

  /**
   * Transactions management endpoints.
   * Transactions include both procedures (service line items) and payments.
   */
  public readonly transactions = {
    /**
     * List transactions matching the given criteria.
     *
     * @param params - Search parameters
     * @returns List of matching transactions
     *
     * @example
     * ```typescript
     * const transactions = await client.transactions.list({
     *   claim_sr_no: '123456',
     * });
     * ```
     */
    list: async (
      params: SikkaTransactionListParams,
    ): Promise<SikkaTransaction[]> => {
      const queryParams: Record<string, string> = {};
      if (params.claim_sr_no) {
        queryParams.claim_sr_no = params.claim_sr_no;
      }

      if (params.patient_id) {
        queryParams.patient_id = params.patient_id;
      }

      if (params.transaction_type) {
        queryParams.transaction_type = params.transaction_type;
      }

      if (params.limit) {
        queryParams.limit = String(params.limit);
      }

      if (params.offset) {
        queryParams.offset = String(params.offset);
      }

      const response = await this.get<SikkaTransactionListResponse>(
        '/v4/transactions',
        queryParams,
      );
      return response.items;
    },

    /**
     * List only procedure transactions for a specific claim.
     *
     * @param claimSrNo - The claim serial number
     * @returns List of procedure transactions
     */
    listProcedures: async (claimSrNo: string): Promise<SikkaTransaction[]> => {
      const transactions = await this.transactions.list({
        claim_sr_no: claimSrNo,
      });
      return transactions.filter((txn) => txn.transaction_type === 'Procedure');
    },
  };

  private readonly baseUrl: string;

  private readonly credentials: SikkaClientCredentials;

  private refreshKey: string | null = null;

  private requestKey: string | null = null;

  private requestKeyExpiresAt: Date | null = null;

  constructor(config: SikkaClientConfig) {
    this.baseUrl = config.baseUrl ?? SIKKA_BASE_URL;
    this.credentials = config.credentials;
  }

  /**
   * Authenticate with the Sikka API.
   * Must be called before making any other API requests.
   * The request key is valid for 24 hours.
   */
  async authenticate(): Promise<void> {
    const log = getLogger();

    log.debug('Sikka API: Authenticating');

    const requestBody: SikkaRequestKeyRequest = {
      app_id: this.credentials.appId,
      app_key: this.credentials.appKey,
      grant_type: 'request_key',
      office_id: this.credentials.officeId,
      secret_key: this.credentials.secretKey,
    };

    const response = await this.requestNewKey(requestBody);
    this.requestKey = response.request_key;
    this.refreshKey = response.refresh_key;
    this.requestKeyExpiresAt = new Date(response.end_time);

    log.debug('Sikka API: Authenticated successfully', {
      expiresAt: this.requestKeyExpiresAt.toISOString(),
    });
  }

  /**
   * Clear the current authentication state.
   */
  clearAuth(): void {
    this.requestKey = null;
    this.refreshKey = null;
    this.requestKeyExpiresAt = null;
  }

  /**
   * Ensure the client is authenticated, refreshing if necessary.
   * Automatically refreshes if token expires within 1 hour.
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.requestKey) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1_000);
    if (this.requestKeyExpiresAt && this.requestKeyExpiresAt < oneHourFromNow) {
      await this.refreshAuthentication();
    }
  }

  /**
   * Make an authenticated GET request to the Sikka API.
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const log = getLogger();

    await this.ensureAuthenticated();

    const requestKey = this.getRequestKey();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('request_key', requestKey);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    log.debug('Sikka API GET request', { endpoint, params });

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'Request-Key': requestKey,
      },
      method: 'GET',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Sikka API GET ${endpoint} failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return { items: [] } as T;
    }

    const data = JSON.parse(text) as T;

    log.debug('Sikka API GET response', { endpoint, status: response.status });

    return data;
  }

  /**
   * Get the current request key.
   *
   * @throws Error if not authenticated
   */
  getRequestKey(): string {
    if (!this.requestKey) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    return this.requestKey;
  }

  // -------------------------------------------------------------------------
  // API Modules

  /**
   * Check if the client is currently authenticated with a valid token.
   */
  isAuthenticated(): boolean {
    if (!this.requestKey || !this.requestKeyExpiresAt) {
      return false;
    }

    return this.requestKeyExpiresAt > new Date();
  }

  /**
   * Make an authenticated POST request to the Sikka API.
   */
  async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const log = getLogger();

    await this.ensureAuthenticated();

    const requestKey = this.getRequestKey();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('request_key', requestKey);

    log.debug('Sikka API POST request', { body, endpoint });

    const response = await fetch(url.toString(), {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Request-Key': requestKey,
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Sikka API POST ${endpoint} failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    const data = (await response.json()) as T;

    log.debug('Sikka API POST response', { endpoint, status: response.status });

    return data;
  }

  /**
   * Refresh the authentication token using the refresh key.
   * Called automatically when token is near expiration.
   */
  async refreshAuthentication(): Promise<void> {
    const log = getLogger();

    if (!this.refreshKey) {
      throw new Error('No refresh key available. Call authenticate() first.');
    }

    log.debug('Sikka API: Refreshing authentication');

    const requestBody: SikkaRequestKeyRequest = {
      app_id: this.credentials.appId,
      app_key: this.credentials.appKey,
      grant_type: 'refresh_key',
      refresh_key: this.refreshKey,
    };

    const response = await this.requestNewKey(requestBody);
    this.requestKey = response.request_key;
    this.refreshKey = response.refresh_key;
    this.requestKeyExpiresAt = new Date(response.end_time);

    log.debug('Sikka API: Authentication refreshed', {
      expiresAt: this.requestKeyExpiresAt.toISOString(),
    });
  }

  private async requestNewKey(
    requestBody: SikkaRequestKeyRequest,
  ): Promise<SikkaRequestKeyResponse> {
    const response = await fetch(`${this.baseUrl}/v4/request_key`, {
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorBody = (await response.json()) as SikkaApiError;
        errorMessage =
          errorBody.error_description ??
          errorBody.error ??
          errorBody.message ??
          errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      throw new Error(`Sikka authentication failed: ${errorMessage}`);
    }

    return response.json() as Promise<SikkaRequestKeyResponse>;
  }
}

/**
 * Create a new Sikka client instance.
 *
 * @param credentials - Office-level credentials
 * @param baseUrl - Optional base URL override
 * @returns A new SikkaClient instance
 *
 * @example
 * ```typescript
 * const client = createSikkaClient({
 *   appId: 'your-app-id',
 *   appKey: 'your-app-key',
 *   officeId: 'practice-office-id',
 *   secretKey: 'practice-secret-key',
 * });
 *
 * await client.authenticate();
 * ```
 */
export const createSikkaClient = (
  credentials: SikkaClientCredentials,
  baseUrl?: string,
): SikkaClient => {
  return new SikkaClient({ baseUrl, credentials });
};
