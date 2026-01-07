import { createSikkaClient, SikkaClient } from '../../src/lib/client.js';
import {
  type SikkaClaimListResponse,
  type SikkaPatientListResponse,
  type SikkaRequestKeyResponse,
  type SikkaTransactionListResponse,
} from '../../src/lib/types.js';

jest.mock('../../src/lib/logger', () => ({
  getLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }),
}));

const testBaseUrl = 'https://api.sikkasoft.com';

const mockCredentials = {
  appId: 'test-app-id',
  appKey: 'test-app-key',
  officeId: 'test-office-id',
  secretKey: 'test-secret-key',
};

/**
 * Create a mock request key response.
 */
const createRequestKeyResponse = (
  expiresInHours = 24,
): SikkaRequestKeyResponse => {
  const now = new Date();
  const endTime = new Date(now.getTime() + expiresInHours * 60 * 60 * 1_000);
  return {
    domain: 'test-domain',
    end_time: endTime.toISOString(),
    expires_in: String(expiresInHours * 60 * 60),
    href: 'https://api.sikkasoft.com/v4/request_key',
    issued_to: mockCredentials.officeId,
    refresh_key: 'test-refresh-key',
    request_count: '0',
    request_key: 'test-request-key',
    scope: 'full',
    start_time: now.toISOString(),
    status: 'active',
  };
};

describe('SikkaClient', () => {
  let client: SikkaClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new SikkaClient({
      baseUrl: testBaseUrl,
      credentials: mockCredentials,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should store request key and mark client as authenticated on success', async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });

      await client.authenticate();

      expect(client.isAuthenticated()).toBe(true);
      expect(client.getRequestKey()).toBe('test-request-key');
    });

    it('should send correct credentials in request body', async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });

      await client.authenticate();

      expect(mockFetch).toHaveBeenCalledWith(
        `${testBaseUrl}/v4/request_key`,
        expect.objectContaining({
          body: JSON.stringify({
            app_id: mockCredentials.appId,
            app_key: mockCredentials.appKey,
            grant_type: 'request_key',
            office_id: mockCredentials.officeId,
            secret_key: mockCredentials.secretKey,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        }),
      );
    });

    it('should throw when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            error: 'invalid_credentials',
            error_description: 'Invalid secret key',
          }),
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.authenticate()).rejects.toThrow(
        'Sikka authentication failed: Invalid secret key',
      );
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshAuthentication', () => {
    it('should refresh token using refresh key', async () => {
      // First authenticate
      const initialResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(initialResponse),
        ok: true,
      });
      await client.authenticate();

      // Then refresh
      const refreshResponse = createRequestKeyResponse();
      refreshResponse.request_key = 'new-request-key';
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(refreshResponse),
        ok: true,
      });

      await client.refreshAuthentication();

      expect(client.getRequestKey()).toBe('new-request-key');
      expect(mockFetch).toHaveBeenLastCalledWith(
        `${testBaseUrl}/v4/request_key`,
        expect.objectContaining({
          body: expect.stringContaining('"grant_type":"refresh_key"'),
        }),
      );
    });

    it('should throw when no refresh key available', async () => {
      await expect(client.refreshAuthentication()).rejects.toThrow(
        'No refresh key available. Call authenticate() first.',
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when never authenticated', () => {
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', async () => {
      // Token that expired
      const expiredResponse = createRequestKeyResponse(-1);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(expiredResponse),
        ok: true,
      });

      await client.authenticate();

      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return true when token is valid', async () => {
      const validResponse = createRequestKeyResponse(24);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(validResponse),
        ok: true,
      });

      await client.authenticate();

      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('should clear authentication state', async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });

      await client.authenticate();
      expect(client.isAuthenticated()).toBe(true);

      client.clearAuth();

      expect(client.isAuthenticated()).toBe(false);
      expect(() => client.getRequestKey()).toThrow(
        'Not authenticated. Call authenticate() first.',
      );
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should throw when not authenticated', async () => {
      const unauthClient = new SikkaClient({
        baseUrl: testBaseUrl,
        credentials: mockCredentials,
      });

      await expect(unauthClient.get('/v4/patients')).rejects.toThrow(
        'Not authenticated. Call authenticate() first.',
      );
    });

    it('should include request_key in query params and header', async () => {
      const patientsResponse: SikkaPatientListResponse = {
        execution_time: '0.1s',
        items: [],
        limit: '100',
        offset: '0',
        pagination: {
          current: '1',
          first: '1',
          last: '1',
          next: '',
          previous: '',
        },
        total_count: '0',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(patientsResponse)),
      });

      await client.get('/v4/patients', { firstname: 'John' });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);

      expect(url.searchParams.get('request_key')).toBe('test-request-key');
      expect(url.searchParams.get('firstname')).toBe('John');
      expect(lastCall[1].headers['Request-Key']).toBe('test-request-key');
    });

    it('should return empty items for empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await client.get<SikkaPatientListResponse>('/v4/patients');

      expect(result).toEqual({ items: [] });
    });
  });

  describe('post', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should send JSON body with request key', async () => {
      const paymentResponse = {
        claim_sr_no: '123',
        message: 'Payment posted successfully',
        status: 'success',
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const body = {
        claim_sr_no: '123',
        payment_amount: '100.00',
      };
      await client.post('/v4/claim_payment', body);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[1].body).toBe(JSON.stringify(body));
      expect(lastCall[1].headers['Content-Type']).toBe('application/json');
    });
  });

  describe('patients.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of patients', async () => {
      const patientsResponse: SikkaPatientListResponse = {
        execution_time: '0.1s',
        items: [
          {
            address_line1: '123 Main St',
            address_line2: '',
            appointment_href: '',
            birthdate: '1990-01-01',
            cell: '555-1234',
            city: 'Test City',
            created_date: '2024-01-01',
            email: 'john@example.com',
            fee_no: '1',
            first_visit: '2024-01-01',
            firstname: 'John',
            guarantor_first_name: '',
            guarantor_href: '',
            guarantor_id: '',
            guarantor_last_name: '',
            href: 'https://api.sikkasoft.com/v4/patients/1',
            last_visit: '2024-01-01',
            lastname: 'Doe',
            middlename: '',
            other_referral: '',
            patient_id: '1',
            patient_referral: '',
            practice_href: '',
            practice_id: '1',
            preferred_communication_method: '',
            preferred_contact: '',
            preferred_name: '',
            primary_insurance_company_href: '',
            primary_insurance_company_id: '',
            primary_medical_insurance: '',
            primary_medical_insurance_id: '',
            primary_medical_relationship: '',
            primary_medical_subscriber_id: '',
            primary_relationship: '',
            provider_href: '',
            provider_id: '',
            referred_out: '',
            salutation: '',
            state: 'CA',
            status: 'active',
            subscriber_id: '',
            zipcode: '12345',
          },
        ],
        limit: '100',
        offset: '0',
        pagination: {
          current: '1',
          first: '1',
          last: '1',
          next: '',
          previous: '',
        },
        total_count: '1',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(patientsResponse)),
      });

      const patients = await client.patients.list({ firstname: 'John' });

      expect(patients).toHaveLength(1);
      expect(patients[0].firstname).toBe('John');
      expect(patients[0].lastname).toBe('Doe');
    });
  });

  describe('claims.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of claims', async () => {
      const claimsResponse: SikkaClaimListResponse = {
        execution_time: '0.1s',
        items: [
          {
            bank_no: '',
            carrier_id: '1',
            cheque_no: '',
            claim_channel: 'electronic',
            claim_description_href: '',
            claim_description_id: '',
            claim_payment_date: '',
            claim_sent_date: '2024-01-01',
            claim_sr_no: '123',
            claim_status: 'Pending',
            creation_date: '2024-01-01',
            estimated_amount: '100.00',
            guarantor_href: '',
            guarantor_id: '1',
            href: 'https://api.sikkasoft.com/v4/claims/123',
            insurance_company_href: '',
            insurance_company_id: '1',
            insurance_company_name: 'Test Insurance',
            note: '',
            on_hold_date: '',
            others: '',
            patient_href: '',
            patient_id: '1',
            pay_to_provider: '',
            payer_id: '',
            payment_amount: '0.00',
            practice_href: '',
            practice_id: '1',
            preventive: '',
            primary_claim_id: '',
            primary_or_secondary: 'primary',
            provider_href: '',
            provider_id: '1',
            rendering_provider: '',
            resent_date: '',
            return_date: '',
            sent_claim_status: '',
            standard: '',
            total_billed_amount: '100.00',
            total_paid_amount: '0.00',
            tp: '',
            tracer: '',
          },
        ],
        limit: '100',
        offset: '0',
        pagination: {
          current: '1',
          first: '1',
          last: '1',
          next: '',
          previous: '',
        },
        total_count: '1',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(claimsResponse)),
      });

      const claims = await client.claims.list({ patient_id: '1' });

      expect(claims).toHaveLength(1);
      expect(claims[0].claim_sr_no).toBe('123');
      expect(claims[0].claim_status).toBe('Pending');
    });
  });

  describe('transactions.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of transactions', async () => {
      const transactionsResponse: SikkaTransactionListResponse = {
        execution_time: '0.1s',
        items: [
          {
            amount: '100.00',
            claim_href: '',
            claim_sr_no: '123',
            created_by: '',
            cust_id: '',
            estimated_insurance_payment: '80.00',
            guarantor_href: '',
            guarantor_id: '1',
            href: 'https://api.sikkasoft.com/v4/transactions/1',
            insurance_payment: '0.00',
            last_updated_by: '',
            note: '',
            patient_href: '',
            patient_id: '1',
            payment_type: '',
            practice_href: '',
            practice_id: '1',
            primary_insurance_estimate: '',
            procedure_code: 'D0120',
            procedure_description: 'Periodic oral evaluation',
            provider_href: '',
            provider_id: '1',
            quantity: '1',
            rowhash: '',
            surface: '',
            tooth_from: '',
            tooth_to: '',
            transaction_date: '2024-01-01',
            transaction_entry_date: '2024-01-01',
            transaction_sr_no: '1',
            transaction_type: 'Procedure',
          },
        ],
        limit: '100',
        offset: '0',
        pagination: {
          current: '1',
          first: '1',
          last: '1',
          next: '',
          previous: '',
        },
        total_count: '1',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(transactionsResponse)),
      });

      const transactions = await client.transactions.list({
        claim_sr_no: '123',
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].procedure_code).toBe('D0120');
      expect(transactions[0].transaction_type).toBe('Procedure');
    });
  });

  describe('transactions.listProcedures', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should filter to only procedure transactions', async () => {
      const transactionsResponse: SikkaTransactionListResponse = {
        execution_time: '0.1s',
        items: [
          {
            amount: '100.00',
            claim_href: '',
            claim_sr_no: '123',
            created_by: '',
            cust_id: '',
            estimated_insurance_payment: '80.00',
            guarantor_href: '',
            guarantor_id: '1',
            href: '',
            insurance_payment: '0.00',
            last_updated_by: '',
            note: '',
            patient_href: '',
            patient_id: '1',
            payment_type: '',
            practice_href: '',
            practice_id: '1',
            primary_insurance_estimate: '',
            procedure_code: 'D0120',
            procedure_description: 'Periodic oral evaluation',
            provider_href: '',
            provider_id: '1',
            quantity: '1',
            rowhash: '',
            surface: '',
            tooth_from: '',
            tooth_to: '',
            transaction_date: '2024-01-01',
            transaction_entry_date: '2024-01-01',
            transaction_sr_no: '1',
            transaction_type: 'Procedure',
          },
          {
            amount: '-50.00',
            claim_href: '',
            claim_sr_no: '123',
            created_by: '',
            cust_id: '',
            estimated_insurance_payment: '',
            guarantor_href: '',
            guarantor_id: '1',
            href: '',
            insurance_payment: '',
            last_updated_by: '',
            note: '',
            patient_href: '',
            patient_id: '1',
            payment_type: 'Insurance',
            practice_href: '',
            practice_id: '1',
            primary_insurance_estimate: '',
            procedure_code: '',
            procedure_description: '',
            provider_href: '',
            provider_id: '1',
            quantity: '',
            rowhash: '',
            surface: '',
            tooth_from: '',
            tooth_to: '',
            transaction_date: '2024-01-15',
            transaction_entry_date: '2024-01-15',
            transaction_sr_no: '2',
            transaction_type: 'Payment',
          },
        ],
        limit: '100',
        offset: '0',
        pagination: {
          current: '1',
          first: '1',
          last: '1',
          next: '',
          previous: '',
        },
        total_count: '2',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(transactionsResponse)),
      });

      const procedures = await client.transactions.listProcedures('123');

      expect(procedures).toHaveLength(1);
      expect(procedures[0].transaction_type).toBe('Procedure');
    });
  });

  describe('client isolation', () => {
    it('should maintain separate state per client instance', async () => {
      const client1 = new SikkaClient({
        baseUrl: testBaseUrl,
        credentials: { ...mockCredentials, officeId: 'office-1' },
      });
      const client2 = new SikkaClient({
        baseUrl: testBaseUrl,
        credentials: { ...mockCredentials, officeId: 'office-2' },
      });

      const response1 = createRequestKeyResponse();
      response1.request_key = 'key-1';
      const response2 = createRequestKeyResponse();
      response2.request_key = 'key-2';

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(response1),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(response2),
          ok: true,
        });

      await client1.authenticate();
      await client2.authenticate();

      client1.clearAuth();

      expect(client1.isAuthenticated()).toBe(false);
      expect(client2.isAuthenticated()).toBe(true);
      expect(client2.getRequestKey()).toBe('key-2');
    });
  });
});

describe('createSikkaClient', () => {
  it('should create a SikkaClient instance', () => {
    const client = createSikkaClient(mockCredentials);

    expect(client).toBeInstanceOf(SikkaClient);
  });

  it('should accept custom base URL', () => {
    const customUrl = 'https://custom.sikkasoft.com';
    const client = createSikkaClient(mockCredentials, customUrl);

    expect(client).toBeInstanceOf(SikkaClient);
  });
});
