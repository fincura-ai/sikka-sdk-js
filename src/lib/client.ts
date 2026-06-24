import { getLogger } from './logger.js';
import {
  type SikkaApiError,
  type SikkaAuthorizedPractice,
  type SikkaAuthorizedPracticeListParams,
  type SikkaAuthorizedPracticeListResponse,
  type SikkaClaim,
  type SikkaClaimListParams,
  type SikkaClaimListResponse,
  type SikkaClaimPaymentRequest,
  type SikkaClaimPaymentResponse,
  type SikkaClaimPaymentResult,
  type SikkaClaimUpdateRequest,
  type SikkaClaimUpdateResponse,
  type SikkaClaimUpdateResult,
  type SikkaClientConfig,
  type SikkaClientCredentials,
  type SikkaInsuranceCompanyDetail,
  type SikkaInsuranceCompanyDetailListParams,
  type SikkaInsuranceCompanyDetailListResponse,
  type SikkaPatient,
  type SikkaPatientListParams,
  type SikkaPatientListResponse,
  type SikkaPaymentType,
  type SikkaPaymentTypeListParams,
  type SikkaPaymentTypeListResponse,
  type SikkaPracticeVariable,
  type SikkaPracticeVariableListParams,
  type SikkaPracticeVariableListResponse,
  type SikkaRequestKeyRequest,
  type SikkaRequestKeyResponse,
  type SikkaSubscriber,
  type SikkaSubscriberListParams,
  type SikkaSubscriberListResponse,
  type SikkaTransaction,
  type SikkaTransactionListParams,
  type SikkaTransactionListResponse,
  type SikkaWritebackStatusItem,
  type SikkaWritebackStatusResponse,
} from './types.js';

const SIKKA_BASE_URL = 'https://api.sikkasoft.com';

const WRITEBACK_ID_PATTERN = /^Id:(\d+)$/u;

/**
 * Page size used when auto-paginating the authorized_practices endpoint.
 */
const AUTHORIZED_PRACTICES_PAGE_SIZE = 500;

/**
 * Extract the numeric writeback tracking ID from the long_message field.
 * Expected format: "Id:3809955"
 */
const parseWritebackId = (longMessage: string | undefined): string | null => {
  if (!longMessage) {
    return null;
  }

  const match = WRITEBACK_ID_PATTERN.exec(longMessage);
  return match?.[1] ?? null;
};

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
   * Authorized practices endpoints.
   * Returns your authorized practices with the Sikka practice utility last
   * refresh and data insert times.
   */
  public readonly authorizedPractices = {
    /**
     * Get a single authorized practice by its office ID.
     *
     * This is the primary access pattern for resolving "what PMS does this
     * office run", since `office_id` (e.g. "D13303") is the unique identifier
     * for a practice/office. Matching is a case-sensitive exact match.
     *
     * Internally this lists all authorized practices (`show: 'all'`, with
     * auto-pagination) and returns the first record whose `office_id` matches.
     *
     * @param officeId - The unique office ID to look up
     * @returns The matching authorized practice, or `null` if none matches
     *
     * @example
     * ```typescript
     * const practice = await client.authorizedPractices.getByOfficeId('D13303');
     * if (practice) {
     *   console.log(practice.practice_management_system);
     * }
     * ```
     */
    getByOfficeId: async (
      officeId: string,
    ): Promise<SikkaAuthorizedPractice | null> => {
      const practices = await this.authorizedPractices.list({ show: 'all' });
      return (
        practices.find((practice) => practice.office_id === officeId) ?? null
      );
    },

    /**
     * List your authorized practices, auto-paginating to completion.
     *
     * By default the API returns only practice id 1. Pass `show: 'all'` to
     * retrieve every authorized office. This method follows the response
     * pagination (offset/limit + `pagination.next`) and accumulates all pages,
     * so the returned array contains every matching record.
     *
     * Items are returned RAW: no normalization, filtering, or coercion is
     * applied. In particular, `practice_management_system` values are
     * inconsistent in case/spelling across records — callers should normalize
     * themselves.
     *
     * WARNING: `practice_id` is NOT unique across offices — the live API can
     * return the same `practice_id` (e.g. "1") for every authorized office. Key
     * off `office_id` (e.g. "D13303") instead. See `getByOfficeId()`.
     *
     * @param params - Optional filter, sort, and pagination parameters. A
     *   caller-supplied `offset`/`limit` controls the starting page and page
     *   size; pagination then continues from there until all items are fetched.
     * @returns List of all authorized practices across every page
     *
     * @example
     * ```typescript
     * // Get the default practice
     * const practices = await client.authorizedPractices.list();
     *
     * // Get all authorized practices (across all pages)
     * const allPractices = await client.authorizedPractices.list({
     *   show: 'all',
     * });
     * ```
     */
    list: async (
      params: SikkaAuthorizedPracticeListParams = {},
    ): Promise<SikkaAuthorizedPractice[]> => {
      const items: SikkaAuthorizedPractice[] = [];

      // Sikka's `offset` is a 0-indexed PAGE NUMBER (not a record offset): the
      // next page is `offset + 1` with `limit` held constant. To stay correct
      // regardless of those semantics, we never compute the next offset
      // ourselves — we follow the `pagination.next` URL's query params verbatim.
      let offset: number | string = params.offset ?? 0;
      let limit: number | string =
        params.limit ?? AUTHORIZED_PRACTICES_PAGE_SIZE;

      for (;;) {
        const response: SikkaAuthorizedPracticeListResponse =
          await this.get<SikkaAuthorizedPracticeListResponse>(
            '/v4/authorized_practices',
            { ...params, limit, offset },
          );

        const pageItems = response.items ?? [];
        items.push(...pageItems);

        const totalCount = Number.parseInt(response.total_count, 10);
        const pageSize = Number.parseInt(String(limit), 10);
        const nextUrl = response.pagination?.next;

        // Stop when the page came back empty, we've reached the reported
        // total, the API reported no next page, or the page was not full
        // (a reliable "last page" signal that guards against infinite loops).
        if (
          pageItems.length === 0 ||
          (!Number.isNaN(totalCount) && items.length >= totalCount) ||
          !nextUrl ||
          (!Number.isNaN(pageSize) && pageItems.length < pageSize)
        ) {
          break;
        }

        // Advance strictly by what the API tells us, rather than doing
        // `offset += limit` arithmetic (which would be wrong for page-number
        // semantics).
        const nextSearch = new URL(nextUrl).searchParams;
        offset = nextSearch.get('offset') ?? offset;
        limit = nextSearch.get('limit') ?? limit;
      }

      return items;
    },
  };

  /**
   * Claim payment endpoints.
   */
  public readonly claimPayment = {
    /**
     * Post a payment to a claim.
     *
     * The Sikka API accepts the request (201) but the actual PMS writeback
     * is asynchronous. The returned `writeback_id` can be used with
     * `writebackStatus.get()` to poll for completion.
     *
     * @param request - Payment details
     * @returns Payment response with parsed writeback tracking ID
     *
     * @example
     * ```typescript
     * const result = await client.claimPayment.post({
     *   claim_sr_no: '123456',
     *   practice_id: 'practice-id',
     *   payment_amount: '100.00|50.00',
     *   transaction_sr_no: '789|790',
     *   deductible: '0.00|0.00',
     *   write_off: '0.00|0.00',
     *   claim_payment_date: '2024-01-15',
     *   payment_mode: 'EFT',
     *   is_payment_by_procedure_code: 'true',
     *   note: 'Insurance payment',
     * });
     *
     * if (result.writeback_id) {
     *   const status = await client.writebackStatus.get(result.writeback_id);
     * }
     * ```
     */
    post: async (
      request: SikkaClaimPaymentRequest,
    ): Promise<SikkaClaimPaymentResult> => {
      const response = await this.post<SikkaClaimPaymentResponse>(
        '/v4/claim_payment',
        request as unknown as Record<string, unknown>,
      );
      const writebackId = parseWritebackId(response.long_message);
      return { ...response, writeback_id: writebackId };
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
      const response = await this.get<SikkaClaimListResponse>(
        '/v4/claims',
        params,
      );
      return response.items;
    },

    /**
     * Update a claim's status and/or note.
     *
     * The Sikka API accepts the request but the actual PMS writeback
     * is asynchronous. The returned `writeback_id` can be used with
     * `writebackStatus.get()` to poll for completion.
     *
     * At least one of `status` or `note` must be provided.
     *
     * @param request - Claim update details including claim_sr_no
     * @returns Update response with parsed writeback tracking ID
     *
     * @example
     * ```typescript
     * const result = await client.claims.update({
     *   claim_sr_no: '123456',
     *   practice_id: 'practice-id',
     *   status: 'Received',
     *   note: 'Claim received and under review',
     * });
     *
     * if (result.writeback_id) {
     *   const status = await client.writebackStatus.get(result.writeback_id);
     * }
     * ```
     */
    update: async (
      request: SikkaClaimUpdateRequest,
    ): Promise<SikkaClaimUpdateResult> => {
      const { claim_sr_no: claimSrNo, ...body } = request;
      const response = await this.patch<SikkaClaimUpdateResponse>(
        `/v4/claims/${claimSrNo}`,
        body as unknown as Record<string, unknown>,
      );
      const writebackId = parseWritebackId(response.long_message);
      return { ...response, writeback_id: writebackId };
    },
  };

  /**
   * Insurance company details endpoints.
   * Returns insurance company information associated with practices.
   */
  public readonly insuranceCompanyDetails = {
    /**
     * List insurance company details, optionally filtered by practice or company.
     *
     * @param params - Optional filter, sort, and pagination parameters
     * @returns List of insurance company details
     *
     * @example
     * ```typescript
     * // Get all insurance companies
     * const companies = await client.insuranceCompanyDetails.list();
     *
     * // Get insurance companies for a specific practice
     * const practiceCompanies = await client.insuranceCompanyDetails.list({
     *   practice_id: '1',
     * });
     * ```
     */
    list: async (
      params: SikkaInsuranceCompanyDetailListParams = {},
    ): Promise<SikkaInsuranceCompanyDetail[]> => {
      const response = await this.get<SikkaInsuranceCompanyDetailListResponse>(
        '/v4/insurance_company_details',
        params,
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
      const response = await this.get<SikkaPatientListResponse>(
        '/v4/patients',
        params,
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
      const response = await this.get<SikkaPaymentTypeListResponse>(
        '/v4/payment_types',
        params,
      );
      return response.items;
    },
  };

  /**
   * Practice variables endpoints.
   * Returns configurable values from the practice management system such as
   * appointment statuses, claim statuses, and patient statuses.
   */
  public readonly practiceVariables = {
    /**
     * List practice variables, optionally filtered by service name.
     *
     * @param params - Optional filter and pagination parameters
     * @returns List of practice variables
     *
     * @example
     * ```typescript
     * // Get all claim statuses
     * const claimStatuses = await client.practiceVariables.list({
     *   service_name: 'Claim Status',
     * });
     *
     * // Use the value field for claims.update()
     * const validStatuses = claimStatuses.map(v => v.value);
     * ```
     */
    list: async (
      params: SikkaPracticeVariableListParams = {},
    ): Promise<SikkaPracticeVariable[]> => {
      const response = await this.get<SikkaPracticeVariableListResponse>(
        '/v4/practice_variables',
        params,
      );
      return response.items;
    },
  };

  /**
   * Subscribers endpoints.
   * Returns insurance subscriber data associated with patients in practices.
   */
  public readonly subscribers = {
    /**
     * List subscribers, optionally filtered by patient, practice, or subscriber ID.
     *
     * @param params - Optional filter, sort, and pagination parameters
     * @returns List of subscribers
     *
     * @example
     * ```typescript
     * // Get all subscribers
     * const subscribers = await client.subscribers.list();
     *
     * // Get subscribers for a specific patient
     * const patientSubscribers = await client.subscribers.list({
     *   patient_id: '994',
     * });
     * ```
     */
    list: async (
      params: SikkaSubscriberListParams = {},
    ): Promise<SikkaSubscriber[]> => {
      const response = await this.get<SikkaSubscriberListResponse>(
        '/v4/subscribers',
        params,
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
      const response = await this.get<SikkaTransactionListResponse>(
        '/v4/transactions',
        params,
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

  /**
   * Writeback status endpoints.
   * Used to poll for the result of asynchronous PMS writeback operations
   * (e.g., after posting a claim payment).
   */
  public readonly writebackStatus = {
    /**
     * Get the status of a writeback operation.
     *
     * @param id - The writeback tracking ID (returned from claimPayment.post as writeback_id)
     * @returns The writeback status record
     *
     * @example
     * ```typescript
     * const result = await client.claimPayment.post({ ... });
     * if (result.writeback_id) {
     *   const status = await client.writebackStatus.get(result.writeback_id);
     *   console.log(status.status, status.is_completed);
     * }
     * ```
     */
    get: async (id: string): Promise<SikkaWritebackStatusItem> => {
      const response = await this.get<SikkaWritebackStatusResponse>(
        '/v4/writeback_status',
        { id },
      );
      const item = response.items[0];
      if (!item) {
        throw new Error(`No writeback status found for id: ${id}`);
      }

      return item;
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
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const log = getLogger();

    await this.ensureAuthenticated();

    const requestKey = this.getRequestKey();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('request_key', requestKey);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          url.searchParams.set(key, String(value));
        }
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
   * Make an authenticated PATCH request to the Sikka API.
   */
  async patch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const log = getLogger();

    await this.ensureAuthenticated();

    const requestKey = this.getRequestKey();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('request_key', requestKey);

    log.debug('Sikka API PATCH request', { body, endpoint });

    const response = await fetch(url.toString(), {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Request-Key': requestKey,
      },
      method: 'PATCH',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Sikka API PATCH ${endpoint} failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    const data = (await response.json()) as T;

    log.debug('Sikka API PATCH response', {
      endpoint,
      status: response.status,
    });

    return data;
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
