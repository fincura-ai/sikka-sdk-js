import { createSikkaClient, SikkaClient } from '../../src/lib/client.js';
import {
  type SikkaClaimListResponse,
  type SikkaClaimPaymentRequest,
  type SikkaClaimPaymentResponse,
  type SikkaClaimUpdateRequest,
  type SikkaClaimUpdateResponse,
  type SikkaInsuranceCompanyDetailListResponse,
  type SikkaPatientListResponse,
  type SikkaPaymentTypeListResponse,
  type SikkaPracticeVariableListResponse,
  type SikkaRequestKeyResponse,
  type SikkaSubscriberListResponse,
  type SikkaTransactionListResponse,
  type SikkaWritebackStatusResponse,
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
        error_code: 'API2016',
        http_code: '201',
        http_code_desc: 'Created',
        long_message: 'Id:123',
        more_information:
          'https://api.sikkasoft.com/v4/writeback_status?id=123',
        short_message: 'New resource created successfully',
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

  describe('patch', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should send JSON body with PATCH method and request key', async () => {
      const patchResponse = {
        error_code: 'API2016',
        http_code: '200',
        http_code_desc: 'OK',
        long_message: 'Id:456',
        more_information:
          'https://api.sikkasoft.com/v4/writeback_status?id=456',
        short_message: 'Resource updated successfully',
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(patchResponse),
        ok: true,
      });

      const body = {
        practice_id: 'practice-1',
        status: 'Received',
      };
      await client.patch('/v4/claims/123', body);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[1].method).toBe('PATCH');
      expect(lastCall[1].body).toBe(JSON.stringify(body));
      expect(lastCall[1].headers['Content-Type']).toBe('application/json');
      expect(lastCall[1].headers['Request-Key']).toBe('test-request-key');
    });

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Claim not found'),
      });

      await expect(
        client.patch('/v4/claims/999', { practice_id: 'p1' }),
      ).rejects.toThrow(
        'Sikka API PATCH /v4/claims/999 failed: 404 Not Found - Claim not found',
      );
    });
  });

  describe('claimPayment.post', () => {
    const createClaimPaymentResponse = (
      writebackId = '3809955',
    ): SikkaClaimPaymentResponse => ({
      error_code: 'API2016',
      http_code: '201',
      http_code_desc: 'Created',
      long_message: `Id:${writebackId}`,
      more_information: `https://api.sikkasoft.com/v4/writeback_status?id=${writebackId}`,
      short_message: 'New resource created successfully',
    });

    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should post a claim payment with required fields', async () => {
      const paymentResponse = createClaimPaymentResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const request: SikkaClaimPaymentRequest = {
        claim_payment_date: '2024-01-15',
        claim_sr_no: '123456',
        deductible: '0',
        is_payment_by_procedure_code: 'false',
        payment_amount: '100.00',
        payment_mode: 'EFT',
        practice_id: 'practice-1',
        write_off: '0',
      };

      const result = await client.claimPayment.post(request);

      expect(result).toMatchObject(paymentResponse);
      expect(result.writeback_id).toBe('3809955');
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain('/v4/claim_payment');
      expect(lastCall[1].body).toBe(JSON.stringify(request));
    });

    it('should parse writeback_id from long_message', async () => {
      const paymentResponse = createClaimPaymentResponse('9999');
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const request: SikkaClaimPaymentRequest = {
        claim_payment_date: '2024-01-15',
        claim_sr_no: '123456',
        deductible: '0',
        is_payment_by_procedure_code: 'false',
        payment_amount: '50.00',
        payment_mode: 'Cash',
        practice_id: 'practice-1',
        write_off: '0',
      };

      const result = await client.claimPayment.post(request);

      expect(result.writeback_id).toBe('9999');
      expect(result.long_message).toBe('Id:9999');
    });

    it('should return null writeback_id when long_message has unexpected format', async () => {
      const paymentResponse: SikkaClaimPaymentResponse = {
        error_code: 'API2016',
        http_code: '201',
        http_code_desc: 'Created',
        long_message: 'Some unexpected message',
        more_information: '',
        short_message: 'New resource created successfully',
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const request: SikkaClaimPaymentRequest = {
        claim_payment_date: '2024-01-15',
        claim_sr_no: '123456',
        deductible: '0',
        is_payment_by_procedure_code: 'false',
        payment_amount: '50.00',
        payment_mode: 'Cash',
        practice_id: 'practice-1',
        write_off: '0',
      };

      const result = await client.claimPayment.post(request);

      expect(result.writeback_id).toBeNull();
    });

    it('should post a claim payment with procedure-level allocation', async () => {
      const paymentResponse = createClaimPaymentResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const request: SikkaClaimPaymentRequest = {
        cheque_no: 'CHK12345',
        claim_payment_date: '2024-01-15',
        claim_sr_no: '123456',
        deductible: '10.00|5.00|0.00',
        is_payment_by_procedure_code: 'true',
        note: 'Insurance payment for procedures',
        payment_amount: '50.00|30.00|20.00',
        payment_mode: 'Check',
        practice_id: 'practice-1',
        transaction_sr_no: '789|790|791',
        write_off: '5.00|2.50|0.00',
      };

      const result = await client.claimPayment.post(request);

      expect(result).toMatchObject(paymentResponse);
      expect(result.writeback_id).toBe('3809955');
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(JSON.parse(lastCall[1].body)).toMatchObject({
        is_payment_by_procedure_code: 'true',
        payment_amount: '50.00|30.00|20.00',
        transaction_sr_no: '789|790|791',
      });
    });

    it('should post a claim payment with debit adjustment fields', async () => {
      const paymentResponse = createClaimPaymentResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const request: SikkaClaimPaymentRequest = {
        claim_payment_date: '2024-01-15',
        claim_sr_no: '123456',
        debit_adjustment_amount: '25.00',
        debit_adjustment_date: '2024-01-15',
        debit_adjustment_note: 'Adjustment for overpayment',
        debit_adjustment_provider: 'PROV001',
        debit_adjustment_type: 'ADJ001',
        deductible: '0',
        is_debit_adjustment_writeback: 'true',
        is_payment_by_procedure_code: 'false',
        payment_amount: '100.00',
        payment_mode: 'EFT',
        practice_id: 'practice-1',
        write_off: '0',
      };

      const result = await client.claimPayment.post(request);

      expect(result).toMatchObject(paymentResponse);
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody.is_debit_adjustment_writeback).toBe('true');
      expect(sentBody.debit_adjustment_amount).toBe('25.00');
      expect(sentBody.debit_adjustment_provider).toBe('PROV001');
    });

    it('should include optional bank and provider fields', async () => {
      const paymentResponse = createClaimPaymentResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(paymentResponse),
        ok: true,
      });

      const request: SikkaClaimPaymentRequest = {
        bank_name: 'First National Bank',
        bank_no: 'BNK123',
        claim_payment_date: '2024-01-15',
        claim_sr_no: '123456',
        deductible: '0',
        direct_deposit_number: 'DD98765',
        is_payment_by_procedure_code: 'false',
        payment_amount: '100.00',
        payment_mode: 'EFT',
        practice_id: 'practice-1',
        provider_id: 'PROV001',
        write_off: '0',
      };

      const result = await client.claimPayment.post(request);

      expect(result).toMatchObject(paymentResponse);
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody.bank_no).toBe('BNK123');
      expect(sentBody.bank_name).toBe('First National Bank');
      expect(sentBody.direct_deposit_number).toBe('DD98765');
      expect(sentBody.provider_id).toBe('PROV001');
    });
  });

  describe('writebackStatus.get', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return the writeback status item for the given id', async () => {
      const statusResponse: SikkaWritebackStatusResponse = {
        items: [
          {
            completed_time: '',
            current_status: '2026-03-04 16:52:39 : Writeback request received',
            has_error: '',
            id: '3809955',
            is_completed: '',
            request_time: '2026-03-04T16:52:15',
            result: '',
            status: 'Pending',
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(statusResponse)),
      });

      const status = await client.writebackStatus.get('3809955');

      expect(status.id).toBe('3809955');
      expect(status.status).toBe('Pending');
      expect(status.is_completed).toBe('');
      expect(status.has_error).toBe('');

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);
      expect(url.pathname).toBe('/v4/writeback_status');
      expect(url.searchParams.get('id')).toBe('3809955');
    });

    it('should return a completed writeback status', async () => {
      const statusResponse: SikkaWritebackStatusResponse = {
        items: [
          {
            completed_time: '2026-03-04T16:53:00',
            current_status: '2026-03-04 16:53:00 : Payment posted successfully',
            has_error: 'false',
            id: '3809955',
            is_completed: 'true',
            request_time: '2026-03-04T16:52:15',
            result: 'Success',
            status: 'Completed',
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(statusResponse)),
      });

      const status = await client.writebackStatus.get('3809955');

      expect(status.status).toBe('Completed');
      expect(status.is_completed).toBe('true');
      expect(status.has_error).toBe('false');
      expect(status.result).toBe('Success');
    });

    it('should throw when no writeback status found', async () => {
      const statusResponse: SikkaWritebackStatusResponse = {
        items: [],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(statusResponse)),
      });

      await expect(client.writebackStatus.get('9999999')).rejects.toThrow(
        'No writeback status found for id: 9999999',
      );
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

  describe('paymentTypes.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of payment types', async () => {
      const paymentTypesResponse: SikkaPaymentTypeListResponse = {
        execution_time: '0.1s',
        items: [
          {
            code: '1',
            description: 'Cash Payment',
            href: 'https://api.sikkasoft.com/v4/practices/1/payment_types/1',
            practice_href: 'https://api.sikkasoft.com/v4/practices/1',
            practice_id: '1',
          },
          {
            code: '2',
            description: 'Insurance Payment',
            href: 'https://api.sikkasoft.com/v4/practices/1/payment_types/2',
            practice_href: 'https://api.sikkasoft.com/v4/practices/1',
            practice_id: '1',
          },
        ],
        limit: '500',
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
        text: () => Promise.resolve(JSON.stringify(paymentTypesResponse)),
      });

      const types = await client.paymentTypes.list();

      expect(types).toHaveLength(2);
      expect(types[0].code).toBe('1');
      expect(types[0].description).toBe('Cash Payment');
      expect(types[1].code).toBe('2');
      expect(types[1].description).toBe('Insurance Payment');
    });
  });

  describe('practiceVariables.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of practice variables', async () => {
      const practiceVariablesResponse: SikkaPracticeVariableListResponse = {
        execution_time: '0.1s',
        items: [
          {
            description: 'Sent',
            href: 'https://api.sikkasoft.com/v4/practices/1/practice_variables',
            practice_href: 'https://api.sikkasoft.com/v4/practices/1',
            practice_id: '1',
            service_name: 'Claim Status',
            value: 'Sent',
          },
          {
            description: 'Received',
            href: 'https://api.sikkasoft.com/v4/practices/1/practice_variables',
            practice_href: 'https://api.sikkasoft.com/v4/practices/1',
            practice_id: '1',
            service_name: 'Claim Status',
            value: 'Received',
          },
        ],
        limit: '500',
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
        text: () => Promise.resolve(JSON.stringify(practiceVariablesResponse)),
      });

      const variables = await client.practiceVariables.list({
        service_name: 'Claim Status',
      });

      expect(variables).toHaveLength(2);
      expect(variables[0].service_name).toBe('Claim Status');
      expect(variables[0].value).toBe('Sent');
      expect(variables[1].value).toBe('Received');

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);
      expect(url.pathname).toBe('/v4/practice_variables');
      expect(url.searchParams.get('service_name')).toBe('Claim Status');
    });
  });

  describe('insuranceCompanyDetails.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of insurance company details', async () => {
      const insuranceCompanyDetailsResponse: SikkaInsuranceCompanyDetailListResponse =
        {
          execution_time: '31',
          items: [
            {
              address_line1: 'P.O. Box 2940',
              beeper: '',
              cell: '',
              city: 'Clinton',
              contact: '',
              default_plan: '0',
              email1: '',
              email2: '',
              era_capable: 'No',
              ext1: '',
              ext2: '',
              ext3: '',
              fax1: '',
              fax2: '',
              href: 'https://api.sikkasoft.com/v4/practices/1/insurance_company_details/1677',
              insurance_company_id: '1677',
              insurance_company_name: 'Sun Life Financial',
              notes: '',
              payer_id: '70408',
              payer_type: 'Commercial',
              phone1: '8004427742',
              phone2: '',
              phone3: '',
              practice_href: 'https://api.sikkasoft.com/v4/practices/1',
              practice_id: '1',
              provider_practice_id: '0',
              state: 'IA',
              trojan_id: '',
              web_link: '0',
              zipcode: '52733',
            },
          ],
          limit: '500',
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
        text: () =>
          Promise.resolve(JSON.stringify(insuranceCompanyDetailsResponse)),
      });

      const companies = await client.insuranceCompanyDetails.list({
        practice_id: '1',
      });

      expect(companies).toHaveLength(1);
      expect(companies[0].insurance_company_id).toBe('1677');
      expect(companies[0].insurance_company_name).toBe('Sun Life Financial');
      expect(companies[0].payer_type).toBe('Commercial');

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);
      expect(url.pathname).toBe('/v4/insurance_company_details');
      expect(url.searchParams.get('practice_id')).toBe('1');
    });
  });

  describe('subscribers.list', () => {
    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should return array of subscribers', async () => {
      const subscribersResponse: SikkaSubscriberListResponse = {
        execution_time: '12',
        items: [
          {
            address_line1: '3 AVENUE',
            address_line2: '',
            birthdate: '1945-03-20T00:00:00',
            city: 'Miami',
            employer_name: 'ADVANCE AUTO PARTS',
            family_deductible_reamining: '',
            firstname: 'te',
            gender: 'M',
            href: 'https://api.sikkasoft.com/v4/practices/1/subscribers/994',
            identification_type: 'Pat_Insd',
            individual_deductible_remaining: '50.0000',
            individual_used: '1450.0000',
            individual_used_treatment_plan: '',
            insurance_company_href:
              'https://api.sikkasoft.com/v4/practices/1/insurance_companies/217',
            insurance_company_id: '217',
            insurance_effective_date: '',
            lastname: 'Sr',
            middlename: '',
            ortho_used: '',
            ortho_used_treatment_plan: '',
            patient_href:
              'https://api.sikkasoft.com/v4/practices/1/patients/994',
            patient_id: '994',
            patient_relation: 'Self',
            practice_href: 'https://api.sikkasoft.com/v4/practices/1',
            practice_id: '1',
            salutation: '',
            state: 'FL',
            subscriber_id: '217_35',
            type: 'Dental Primary',
            zipcode: '33155',
          },
        ],
        limit: '500',
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
        text: () => Promise.resolve(JSON.stringify(subscribersResponse)),
      });

      const subscribers = await client.subscribers.list({
        patient_id: '994',
      });

      expect(subscribers).toHaveLength(1);
      expect(subscribers[0].patient_id).toBe('994');
      expect(subscribers[0].subscriber_id).toBe('217_35');
      expect(subscribers[0].patient_relation).toBe('Self');

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);
      expect(url.pathname).toBe('/v4/subscribers');
      expect(url.searchParams.get('patient_id')).toBe('994');
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

  describe('claims.update', () => {
    const createClaimUpdateResponse = (
      writebackId = '5001',
    ): SikkaClaimUpdateResponse => ({
      error_code: 'API2016',
      http_code: '200',
      http_code_desc: 'OK',
      long_message: `Id:${writebackId}`,
      more_information: `https://api.sikkasoft.com/v4/writeback_status?id=${writebackId}`,
      short_message: 'Resource updated successfully',
    });

    beforeEach(async () => {
      const mockResponse = createRequestKeyResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      });
      await client.authenticate();
    });

    it('should send PATCH request to /v4/claims/{claim_sr_no} with body fields', async () => {
      const updateResponse = createClaimUpdateResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(updateResponse),
        ok: true,
      });

      const request: SikkaClaimUpdateRequest = {
        claim_sr_no: '123456',
        note: 'Claim received',
        practice_id: 'practice-1',
        status: 'Received',
      };

      const result = await client.claims.update(request);

      expect(result).toMatchObject(updateResponse);
      expect(result.writeback_id).toBe('5001');

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);
      expect(url.pathname).toBe('/v4/claims/123456');
      expect(lastCall[1].method).toBe('PATCH');

      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody.practice_id).toBe('practice-1');
      expect(sentBody.status).toBe('Received');
      expect(sentBody.note).toBe('Claim received');
      expect(sentBody.claim_sr_no).toBeUndefined();
    });

    it('should parse writeback_id from long_message', async () => {
      const updateResponse = createClaimUpdateResponse('7777');
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(updateResponse),
        ok: true,
      });

      const request: SikkaClaimUpdateRequest = {
        claim_sr_no: '123456',
        practice_id: 'practice-1',
        status: 'Sent',
      };

      const result = await client.claims.update(request);

      expect(result.writeback_id).toBe('7777');
      expect(result.long_message).toBe('Id:7777');
    });

    it('should return null writeback_id when long_message has unexpected format', async () => {
      const updateResponse: SikkaClaimUpdateResponse = {
        error_code: 'API2016',
        http_code: '200',
        http_code_desc: 'OK',
        long_message: 'Some unexpected message',
        more_information: '',
        short_message: 'Resource updated successfully',
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(updateResponse),
        ok: true,
      });

      const request: SikkaClaimUpdateRequest = {
        claim_sr_no: '123456',
        note: 'Updated note',
        practice_id: 'practice-1',
      };

      const result = await client.claims.update(request);

      expect(result.writeback_id).toBeNull();
    });

    it('should send all optional fields in body', async () => {
      const updateResponse = createClaimUpdateResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(updateResponse),
        ok: true,
      });

      const request: SikkaClaimUpdateRequest = {
        check_spu: 'true',
        claim_sr_no: '123456',
        custom_track_status: 'CustomStatus',
        date_resent: '2024-06-15',
        date_sent: '2024-06-01',
        internal_note: 'Internal tracking note',
        note: 'Claim note',
        practice_id: 'practice-1',
        status: 'Received',
        user: 'TestUser',
      };

      await client.claims.update(request);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody.practice_id).toBe('practice-1');
      expect(sentBody.status).toBe('Received');
      expect(sentBody.note).toBe('Claim note');
      expect(sentBody.internal_note).toBe('Internal tracking note');
      expect(sentBody.date_sent).toBe('2024-06-01');
      expect(sentBody.user).toBe('TestUser');
      expect(sentBody.date_resent).toBe('2024-06-15');
      expect(sentBody.custom_track_status).toBe('CustomStatus');
      expect(sentBody.check_spu).toBe('true');
      expect(sentBody.claim_sr_no).toBeUndefined();
    });

    it('should work with only required fields and note', async () => {
      const updateResponse = createClaimUpdateResponse();
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(updateResponse),
        ok: true,
      });

      const request: SikkaClaimUpdateRequest = {
        claim_sr_no: '999',
        note: 'Just a note update',
        practice_id: 'practice-2',
      };

      await client.claims.update(request);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = new URL(lastCall[0]);
      expect(url.pathname).toBe('/v4/claims/999');

      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody).toEqual({
        note: 'Just a note update',
        practice_id: 'practice-2',
      });
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
