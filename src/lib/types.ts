/**
 * Sikka SDK Types
 *
 * Types for interacting with the Sikka API (https://api.sikkasoft.com)
 */

/**
 * Grant type for authentication
 */
export type SikkaGrantType = 'refresh_key' | 'request_key';

/**
 * Request body for obtaining a request key
 */
export type SikkaRequestKeyRequest = {
  app_id: string;
  app_key: string;
  grant_type: SikkaGrantType;
  office_id?: string;
  refresh_key?: string;
  secret_key?: string;
};

/**
 * Response from the request_key endpoint
 */
export type SikkaRequestKeyResponse = {
  domain: string;
  end_time: string;
  expires_in: string;
  href: string;
  issued_to: string;
  refresh_key: string;
  request_count: string;
  request_key: string;
  scope: string;
  start_time: string;
  status: string;
};

/**
 * Sikka API error response
 */
export type SikkaApiError = {
  error?: string;
  error_description?: string;
  message?: string;
};

/**
 * An authorized practice from the authorized_practices endpoint
 */
export type SikkaAuthorizedPractice = {
  address: string;
  city: string;
  data_insert_date: string;
  data_synchronization_date: string;
  domain: string;
  email: string;
  href: string;
  office_id: string;
  practice_id: string;
  practice_management_system: string;
  practice_management_system_refresh_date: string;
  practice_management_system_version: string;
  practice_name: string;
  secret_key: string;
  state: string;
  zip: string;
};

/**
 * Response from the authorized_practices endpoint
 */
export type SikkaAuthorizedPracticesResponse = {
  execution_time: string;
  items: SikkaAuthorizedPractice[];
  limit: string;
  offset: string;
  pagination: {
    current: string;
    first: string;
    last: string;
    next: string;
    previous: string;
  };
  total_count: string;
};

/**
 * App-level credentials (from env vars)
 */
export type SikkaAppCredentials = {
  appId: string;
  appKey: string;
};

/**
 * Credentials required to initialize the Sikka client for a specific office
 */
export type SikkaClientCredentials = {
  appId: string;
  appKey: string;
  officeId: string;
  secretKey: string;
};

/**
 * Configuration for the Sikka client
 */
export type SikkaClientConfig = {
  baseUrl?: string;
  credentials: SikkaClientCredentials;
};

// -----------------------------------------------------------------------------
// Paginated Response Types

/**
 * Generic paginated response from Sikka API
 */
export type SikkaPaginatedResponse<T> = {
  execution_time: string;
  items: T[];
  limit: string;
  offset: string;
  pagination: {
    current: string;
    first: string;
    last: string;
    next: string;
    previous: string;
  };
  total_count: string;
};

// -----------------------------------------------------------------------------
// Patient Types

/**
 * Sikka patient record
 */
export type SikkaPatient = {
  address_line1: string;
  address_line2: string;
  appointment_href: string;
  birthdate: string;
  cell: string;
  city: string;
  created_date: string;
  email: string;
  fee_no: string;
  first_visit: string;
  firstname: string;
  guarantor_first_name: string;
  guarantor_href: string;
  guarantor_id: string;
  guarantor_last_name: string;
  href: string;
  last_visit: string;
  lastname: string;
  middlename: string;
  other_referral: string;
  patient_id: string;
  patient_referral: string;
  practice_href: string;
  practice_id: string;
  preferred_communication_method: string;
  preferred_contact: string;
  preferred_name: string;
  primary_insurance_company_href: string;
  primary_insurance_company_id: string;
  primary_medical_insurance: string;
  primary_medical_insurance_id: string;
  primary_medical_relationship: string;
  primary_medical_subscriber_id: string;
  primary_relationship: string;
  provider_href: string;
  provider_id: string;
  referred_out: string;
  salutation: string;
  state: string;
  status: string;
  subscriber_id: string;
  zipcode: string;
};

/**
 * Parameters for listing patients
 */
export type SikkaPatientListParams = {
  birthdate?: string;
  firstname?: string;
  lastname?: string;
  limit?: number;
  offset?: number;
  patient_id?: string;
};

/**
 * Response from the patients endpoint
 */
export type SikkaPatientListResponse = SikkaPaginatedResponse<SikkaPatient>;

// -----------------------------------------------------------------------------
// Claim Types

/**
 * Sikka claim record
 */
export type SikkaClaim = {
  bank_no: string;
  carrier_id: string;
  cheque_no: string;
  claim_channel: string;
  claim_description_href: string;
  claim_description_id: string;
  claim_payment_date: string;
  claim_sent_date: string;
  claim_sr_no: string;
  claim_status: string;
  creation_date: string;
  estimated_amount: string;
  guarantor_href: string;
  guarantor_id: string;
  href: string;
  insurance_company_href: string;
  insurance_company_id: string;
  insurance_company_name: string;
  note: string;
  on_hold_date: string;
  others: string;
  patient_href: string;
  patient_id: string;
  pay_to_provider: string;
  payer_id: string;
  payment_amount: string;
  practice_href: string;
  practice_id: string;
  preventive: string;
  primary_claim_id: string;
  primary_or_secondary: string;
  provider_href: string;
  provider_id: string;
  rendering_provider: string;
  resent_date: string;
  return_date: string;
  sent_claim_status: string;
  standard: string;
  total_billed_amount: string;
  total_paid_amount: string;
  tp: string;
  tracer: string;
};

/**
 * Parameters for listing claims
 */
export type SikkaClaimListParams = {
  claim_id?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  patient_id?: string;
  start_date?: string;
  status?: string;
};

/**
 * Response from the claims endpoint
 */
export type SikkaClaimListResponse = SikkaPaginatedResponse<SikkaClaim>;

// -----------------------------------------------------------------------------
// Transaction Types

/**
 * Transaction type in Sikka (Procedure = service line item, Payment = payment)
 */
export type SikkaTransactionType = 'Payment' | 'Procedure';

/**
 * Sikka transaction record (represents both procedures and payments)
 */
export type SikkaTransaction = {
  amount: string;
  claim_href: string;
  claim_sr_no: string;
  created_by: string;
  cust_id: string;
  estimated_insurance_payment: string;
  guarantor_href: string;
  guarantor_id: string;
  href: string;
  insurance_payment: string;
  last_updated_by: string;
  note: string;
  patient_href: string;
  patient_id: string;
  payment_type: string;
  practice_href: string;
  practice_id: string;
  primary_insurance_estimate: string;
  procedure_code: string;
  procedure_description: string;
  provider_href: string;
  provider_id: string;
  quantity: string;
  rowhash: string;
  surface: string;
  tooth_from: string;
  tooth_to: string;
  transaction_date: string;
  transaction_entry_date: string;
  transaction_sr_no: string;
  transaction_type: SikkaTransactionType;
};

/**
 * Parameters for listing transactions
 */
export type SikkaTransactionListParams = {
  claim_sr_no?: string;
  limit?: number;
  offset?: number;
  patient_id?: string;
  transaction_type?: SikkaTransactionType;
};

/**
 * Response from the transactions endpoint
 */
export type SikkaTransactionListResponse =
  SikkaPaginatedResponse<SikkaTransaction>;

// -----------------------------------------------------------------------------
// Claim Payment Types

/**
 * Payment mode for posting payments
 */
export type SikkaPaymentMode = 'Cash' | 'Check' | 'EFT';

/**
 * Request body for posting a claim payment.
 * Uses pipe-delimited values for line item amounts when is_payment_by_procedure_code=true.
 */
export type SikkaClaimPaymentRequest = {
  /**
   * The generic ID of the claim for which you want to post the payment.
   */
  claim_sr_no: string;

  /**
   * The unique identifier for the practice.
   */
  practice_id: string;

  /**
   * The total payment amount (format: xx.xx).
   * If is_payment_by_procedure_code=true, use pipe-delimited values (e.g., "100.00|50.00").
   */
  payment_amount: string;

  /**
   * Boolean flag indicating if the payment is allocated by procedure code.
   * For Tracker, value should be true only as PMS does not support without procedure code.
   */
  is_payment_by_procedure_code: 'false' | 'true';

  /**
   * The date of the payment (format: yyyy-MM-dd).
   */
  claim_payment_date: string;

  /**
   * The method of payment.
   * Get valid modes from payment_types API with is_insurance_type=true.
   */
  payment_mode: SikkaPaymentMode;

  /**
   * The deductible amount (format: xx.xx). Pass "0" if no amount.
   * PMS-specific formats:
   * - Dentrix Enterprise/G6: pipe-delimited "standard|preventive|others" (e.g., "0|0|0")
   * - Dentrix Ascend: pipe-delimited "major|preventive|basic|ortho" (e.g., "0|0|0|0")
   * - Tracker: Not supported
   */
  deductible: string;

  /**
   * The write-off amount (format: xx.xx). Pass "0" if no amount.
   * If is_payment_by_procedure_code=true, use pipe-delimited values.
   * - Dentrix Ascend: write_off not allowed for is_payment_by_procedure_code=false, pass "0"
   * - Tracker: Not supported
   */
  write_off: string;

  /**
   * The specific transaction ID(s) associated with the payment.
   * Required only if is_payment_by_procedure_code=true.
   * For multiple procedures, use pipe-delimited values (e.g., "123|124|125").
   */
  transaction_sr_no?: string;

  /**
   * Payment notes/remarks.
   * Should not contain special characters (<, >, &, ,).
   */
  note?: string;

  /**
   * The credit adjustment type ID.
   * Get from payment_types API with is_adjustment_type=true.
   * Supported only for Dentrix Enterprise, Dentrix Ascend, and Dentrix G6+.
   * Required if write_off value is negative in Dentrix Enterprise/Ascend.
   */
  adjustment_type?: string;

  /**
   * The provider ID for the credit adjustment.
   * Supported only for Dentrix G6+.
   * Must match count of write_off values (pipe-delimited).
   */
  credit_adjustment_provider?: string;

  /**
   * Boolean to trigger a debit adjustment write-back.
   * Not supported for Tracker.
   */
  is_debit_adjustment_writeback?: 'false' | 'true';

  /**
   * The amount for the debit adjustment (format: xx.xx).
   * Required only if performing debit adjustment write-back.
   * Must be positive (Dentrix G6+ allows 0).
   */
  debit_adjustment_amount?: string;

  /**
   * Date of the debit adjustment (format: yyyy-MM-dd).
   * Required for Open Dental PMS if performing debit adjustment write-back.
   * Not supported for Dentrix Ascend.
   */
  debit_adjustment_date?: string;

  /**
   * The debit adjustment type ID.
   * Get from payment_types API with is_debit_adjustment_type=true.
   * Required for Open Dental and Dentrix Ascend if performing debit adjustment write-back.
   */
  debit_adjustment_type?: string;

  /**
   * Notes for the debit adjustment.
   * Must not contain special characters (<, >, &, ,).
   * Not supported for Dentrix Ascend.
   */
  debit_adjustment_note?: string;

  /**
   * Boolean for procedure-level debit adjustments.
   * Supported for Open Dental only.
   * If true, debit_adjustment_amount, debit_adjustment_transaction_sr_no,
   * debit_adjustment_provider, and debit_adjustment_type must have matching counts (pipe-delimited).
   */
  is_debit_adjustment_by_procedure?: 'false' | 'true';

  /**
   * Transaction ID(s) for the debit adjustment.
   * Required if is_debit_adjustment_by_procedure=true.
   * Supported for Open Dental only.
   */
  debit_adjustment_transaction_sr_no?: string;

  /**
   * The provider ID for the debit adjustment.
   * Required for Open Dental if performing debit adjustment write-back.
   * For Dentrix G6+, must match count of debit_adjustment_amount (pipe-delimited).
   */
  debit_adjustment_provider?: string;

  /**
   * The cheque number.
   * Mandatory if payment mode is Cheque for Tracker.
   */
  cheque_no?: string;

  /**
   * The bank number.
   */
  bank_no?: string;

  /**
   * The name of the bank.
   * Mandatory for Tracker.
   * Get using writeback_details API with category=bank name and writeback_type=claim_payment.
   */
  bank_name?: string;

  /**
   * The direct deposit reference number.
   * Mandatory if payment mode is Direct Deposit for Tracker.
   */
  direct_deposit_number?: string;

  /**
   * The provider ID.
   * Get using providers API.
   * Supported only for Tracker and Dentrix PMS.
   */
  provider_id?: string;
};

/**
 * Response from posting a claim payment
 */
export type SikkaClaimPaymentResponse = {
  claim_sr_no: string;
  message: string;
  status: string;
};

// -----------------------------------------------------------------------------
// Payment Type Types

/**
 * Sikka payment type record
 */
export type SikkaPaymentType = {
  code: string;
  description: string;
  href: string;
  practice_href: string;
  practice_id: string;
};

/**
 * Parameters for listing payment types
 */
export type SikkaPaymentTypeListParams = {
  /**
   * Filter by payment type code in practice management system
   */
  code?: string;
  /**
   * Customer ID of office
   */
  customer_id?: string;
  /**
   * If true, returns Credit Adjustment Types only
   */
  is_adjustment_type?: boolean;
  /**
   * If true, returns Payment Types which require credit card details
   * for POST transaction (Planet DDS PMS only)
   */
  are_credit_card_details_required?: boolean;
  /**
   * If true, returns Debit Adjustment Types only
   */
  is_debit_adjustment_type?: boolean;
  /**
   * If true, returns Insurance Payment Types only
   */
  is_insurance_type?: boolean;
  /**
   * Results per page
   */
  limit?: number;
  /**
   * Pagination offset
   */
  offset?: number;
  /**
   * Practice ID of office
   */
  practice_id?: string;
};

/**
 * Response from the payment_types endpoint
 */
export type SikkaPaymentTypeListResponse =
  SikkaPaginatedResponse<SikkaPaymentType>;
