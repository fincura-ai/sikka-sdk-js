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

/**
 * Request body for updating a claim's status and/or note.
 * Must contain at least one of `status` or `note`.
 */
export type SikkaClaimUpdateRequest = {
  /**
   * The generic ID of the claim to update.
   * Used as a URL path parameter: PATCH /v4/claims/{claim_sr_no}
   */
  claim_sr_no: string;

  /**
   * The unique identifier for the practice.
   * Retrieve this using the Practices API.
   */
  practice_id: string;

  /**
   * Claim status. Only values accepted by the practice management software are valid.
   * Get valid statuses from the practice_variables API where service_name='Claim Status'.
   */
  status?: string;

  /**
   * Claim note. At least one of `status` or `note` must be provided.
   */
  note?: string;

  /**
   * Internal note for the claim.
   */
  internal_note?: string;

  /**
   * Date the claim was sent (format: yyyy-mm-dd).
   */
  date_sent?: string;

  /**
   * User who performed the update. Defaults to 'Sikkauser' if not provided.
   */
  user?: string;

  /**
   * Date the claim was resent (format: yyyy-mm-dd).
   */
  date_resent?: string;

  /**
   * Custom tracking status for OpenDental PMS only.
   * Check PMS settings via pms_general_settings API with
   * setting_name=ClaimTrackingStatusExcludesNone to determine if mandatory.
   * Get values from writeback_details API with category=CustomTrackStatusType
   * and writeback_type=claim_status.
   */
  custom_track_status?: string;

  /**
   * SPU check flag.
   */
  check_spu?: string;
};

/**
 * Raw API response from updating a claim.
 */
export type SikkaClaimUpdateResponse = {
  error_code: string;
  http_code: string;
  http_code_desc: string;
  long_message: string;
  more_information: string;
  short_message: string;
};

/**
 * Enriched result from claims.update() that includes
 * the parsed writeback tracking ID extracted from long_message.
 */
export type SikkaClaimUpdateResult = SikkaClaimUpdateResponse & {
  writeback_id: string | null;
};

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

  // ---------------------------------------------------------------------------
  // Eaglesoft-specific fields
  //
  // The following fields are accepted only by the Eaglesoft writeback contract.
  // Sending them on other PMSs (Dentrix, Open Dental, Tracker) is unsupported.
  // Field names/accepted values are sourced from Sikka's developer portal and
  // are pending written confirmation from Sikka support; treat as provisional.

  /**
   * How the payment is booked in Eaglesoft. Required for Eaglesoft; when
   * omitted Eaglesoft defaults the writeback to `Adjustment` rather than a
   * collection. Likely values: `Collection` | `Adjustment`. Eaglesoft-only.
   */
  impacts?: string;

  /**
   * Whether this call finalizes the claim in Eaglesoft. Defaults to `true`
   * when omitted, which closes the claim after the first call — set `'false'`
   * on every call except the last when a claim is posted across multiple
   * provider groups. Eaglesoft-only.
   */
  is_final_payment?: 'false' | 'true';

  /**
   * Boolean to trigger a credit adjustment (write-off) write-back in Eaglesoft.
   * Eaglesoft uses this family instead of the Dentrix `write_off` /
   * `adjustment_type` fields. Eaglesoft-only.
   */
  is_credit_adjustment_writeback?: 'false' | 'true';

  /**
   * The credit adjustment (write-off) amount(s) for Eaglesoft (format: xx.xx).
   * Pipe-delimited when applied per procedure. Eaglesoft-only.
   */
  credit_adjustment_amount?: string;

  /**
   * Transaction ID(s) the Eaglesoft credit adjustment applies to.
   * Pipe-delimited when applied per procedure. Eaglesoft-only.
   */
  credit_adjustment_transaction_sr_no?: string;

  /**
   * The credit adjustment type ID for Eaglesoft.
   * Get from payment_types API with is_adjustment_type=true. Eaglesoft-only.
   */
  credit_adjustment_type?: string;

  /**
   * Boolean for procedure-level credit adjustments in Eaglesoft.
   * Set 'true' when credit_adjustment_* values are pipe-delimited per procedure.
   * Required by Eaglesoft whenever is_credit_adjustment_writeback is 'true'.
   * Symmetric to is_debit_adjustment_by_procedure. Eaglesoft-only.
   */
  is_credit_adjustment_by_procedure?: 'false' | 'true';

  /**
   * The PMS user the writeback is attributed to in Eaglesoft.
   * Get from the pms_users API. Eaglesoft-only.
   */
  user?: string;

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
 * Raw API response from posting a claim payment.
 * The Sikka API returns a 201 with writeback tracking fields rather than
 * the final PMS result, since the actual writeback is asynchronous.
 */
export type SikkaClaimPaymentResponse = {
  error_code: string;
  http_code: string;
  http_code_desc: string;
  long_message: string;
  more_information: string;
  short_message: string;
};

/**
 * Enriched result from claimPayment.post() that includes
 * the parsed writeback tracking ID extracted from long_message.
 */
export type SikkaClaimPaymentResult = SikkaClaimPaymentResponse & {
  writeback_id: string | null;
};

// -----------------------------------------------------------------------------
// Writeback Status Types

/**
 * A single writeback status record returned by the writeback_status endpoint.
 * Represents the state of an asynchronous PMS writeback operation.
 */
export type SikkaWritebackStatusItem = {
  completed_time: string;
  current_status: string;
  has_error: string;
  id: string;
  is_completed: string;
  request_time: string;
  result: string;
  status: string;
};

/**
 * Response from GET /v4/writeback_status
 */
export type SikkaWritebackStatusResponse = {
  items: SikkaWritebackStatusItem[];
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

// -----------------------------------------------------------------------------
// PMS User Types
//
// Provisional: surfaced to support the Eaglesoft-only `user` field on
// SikkaClaimPaymentRequest. The `/v4/pms_users` endpoint path is confirmed and
// uses the standard Sikka paginated envelope, but the per-item field set is
// pending written confirmation from Sikka support; treat as provisional.

/**
 * Sikka PMS user record.
 * Represents a user configured in the practice management system. Used to
 * resolve a valid value for the Eaglesoft-only `user` writeback field.
 *
 * Provisional shape: additional fields may be returned by the live API
 * (use `fields=get_all` on the endpoint to enumerate them).
 */
export type SikkaPmsUser = {
  first_name: string;
  href: string;
  last_name: string;
  practice_href: string;
  practice_id: string;
  status: string;
  user_id: string;
  user_name: string;
};

/**
 * Parameters for listing PMS users
 */
export type SikkaPmsUserListParams = {
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
  /**
   * Filter by PMS user ID
   */
  user_id?: string;
};

/**
 * Response from the pms_users endpoint
 */
export type SikkaPmsUserListResponse = SikkaPaginatedResponse<SikkaPmsUser>;

// -----------------------------------------------------------------------------
// Practice Variable Types

/**
 * Sikka practice variable record.
 * Represents configurable values like appointment statuses, claim statuses,
 * and patient statuses from the practice management system.
 */
export type SikkaPracticeVariable = {
  description: string;
  href: string;
  practice_href: string;
  practice_id: string;
  service_name: string;
  value: string;
};

/**
 * Parameters for listing practice variables
 */
export type SikkaPracticeVariableListParams = {
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
  /**
   * Service item as per the response
   */
  service_item?: string;
  /**
   * Service name filter (e.g. "Claim Status", "Appointment Status")
   */
  service_name?: string;
};

/**
 * Response from the practice_variables endpoint
 */
export type SikkaPracticeVariableListResponse =
  SikkaPaginatedResponse<SikkaPracticeVariable>;

// -----------------------------------------------------------------------------
// Insurance Company Details
// -----------------------------------------------------------------------------

/**
 * Sikka insurance company detail record.
 * Represents an insurance company associated with a practice.
 */
export type SikkaInsuranceCompanyDetail = {
  address_line1: string;
  beeper: string;
  cell: string;
  city: string;
  contact: string;
  default_plan: string;
  email1: string;
  email2: string;
  era_capable: string;
  ext1: string;
  ext2: string;
  ext3: string;
  fax1: string;
  fax2: string;
  href: string;
  insurance_company_id: string;
  insurance_company_name: string;
  notes: string;
  payer_id: string;
  payer_type: string;
  phone1: string;
  phone2: string;
  phone3: string;
  practice_href: string;
  practice_id: string;
  provider_practice_id: string;
  state: string;
  trojan_id: string;
  web_link: string;
  zipcode: string;
};

/**
 * Parameters for listing insurance company details
 */
export type SikkaInsuranceCompanyDetailListParams = {
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
  /**
   * Insurance company ID in practice management system
   */
  insurance_company_id?: string;
  /**
   * Sort order for results
   */
  sort_by?: 'insurance_company_id' | 'insurance_company_name' | 'practice_id';
};

/**
 * Response from the insurance_company_details endpoint
 */
export type SikkaInsuranceCompanyDetailListResponse =
  SikkaPaginatedResponse<SikkaInsuranceCompanyDetail>;

// -----------------------------------------------------------------------------
// Subscribers
// -----------------------------------------------------------------------------

/**
 * Sikka subscriber record.
 * Represents insurance subscriber data associated with a patient in a practice.
 */
export type SikkaSubscriber = {
  address_line1: string;
  address_line2: string;
  birthdate: string;
  city: string;
  employer_name: string;
  family_deductible_reamining: string;
  firstname: string;
  gender: string;
  href: string;
  identification_type: string;
  individual_deductible_remaining: string;
  individual_used: string;
  individual_used_treatment_plan: string;
  insurance_company_href: string;
  insurance_company_id: string;
  insurance_effective_date: string;
  lastname: string;
  middlename: string;
  ortho_used: string;
  ortho_used_treatment_plan: string;
  patient_href: string;
  patient_id: string;
  patient_relation: string;
  practice_href: string;
  practice_id: string;
  salutation: string;
  state: string;
  subscriber_id: string;
  type: string;
  zipcode: string;
};

/**
 * Parameters for listing subscribers
 */
export type SikkaSubscriberListParams = {
  /**
   * Results per page
   */
  limit?: number;
  /**
   * Pagination offset
   */
  offset?: number;
  /**
   * Patient ID from practice
   */
  patient_id?: string;
  /**
   * Practice ID of office
   */
  practice_id?: string;
  /**
   * Subscriber ID of office
   */
  subscriber_id?: string;
  /**
   * Sort order for results
   */
  sort_by?: 'patient_id' | 'practice_id';
};

/**
 * Response from the subscribers endpoint
 */
export type SikkaSubscriberListResponse =
  SikkaPaginatedResponse<SikkaSubscriber>;

// -----------------------------------------------------------------------------
// Authorized Practices
// -----------------------------------------------------------------------------

/**
 * Sikka authorized practice record.
 * Represents a practice authorized for your app, including the Sikka practice
 * utility last refresh and data insert times.
 *
 * IMPORTANT: `practice_id` is NOT unique across offices — the live API can
 * return the same `practice_id` (e.g. "1") for every authorized office. Use
 * `office_id` (e.g. "D13303") as the unique identifier for a practice/office.
 *
 * Values such as `practice_management_system` are returned RAW from the
 * provider and are inconsistent in case/spelling across records (e.g.
 * "Opendental" vs "OpenDental"). The SDK does not normalize them; callers are
 * responsible for any normalization.
 */
export type SikkaAuthorizedPractice = {
  address: string;
  city: string;
  data_insert_date: string;
  data_synchronization_date: string;
  /**
   * Difference in minutes between the last PMS refresh and data insert.
   * May be absent on some records.
   */
  difference_in_minutes?: string;
  domain: string;
  /**
   * Email associated with the office. May be absent on some records.
   */
  email?: string;
  /**
   * Financial system name. May be absent for practices without a financial
   * system integration.
   */
  financial_system?: string;
  financial_system_refresh_date?: string;
  financial_system_version?: string;
  href: string;
  /**
   * Unique identifier for the office (e.g. "D13303"). Prefer this over
   * `practice_id`, which is NOT unique across offices.
   */
  office_id: string;
  partner_id?: string;
  /**
   * NOT unique across offices — the live API can return the same value (e.g.
   * "1") for multiple offices. Use `office_id` as the unique identifier.
   */
  practice_id: string;
  /**
   * Raw practice management system name from the provider. Inconsistent in
   * case/spelling (e.g. "Opendental" vs "OpenDental"); not normalized.
   */
  practice_management_system: string;
  practice_management_system_refresh_date: string;
  practice_management_system_refresh_date_time_zone?: string;
  practice_management_system_refresh_date_time_zone_utc_offset?: string;
  practice_management_system_version: string;
  practice_name: string;
  secret_key: string;
  state: string;
  zip: string;
};

/**
 * Parameters for listing authorized practices
 */
export type SikkaAuthorizedPracticeListParams = {
  /**
   * Financial system
   */
  financial_system?: string;
  /**
   * Financial system version
   */
  financial_system_version?: string;
  /**
   * Results per page
   */
  limit?: number;
  /**
   * Pagination offset
   */
  offset?: number;
  /**
   * Practice ID
   */
  practice_id?: string;
  /**
   * Practice management system
   */
  practice_management_system?: string;
  /**
   * Practice management system refresh date time zone
   */
  practice_management_system_refresh_date_time_zone?: string;
  /**
   * Practice management system version
   */
  practice_management_system_version?: string;
  /**
   * Practice name
   */
  practice_name?: string;
  /**
   * value should be 'all'. API returns by default practice id 1.
   * Use this parameter to get all practices.
   */
  show?: 'all';
  /**
   * Sort order for results
   */
  sort_by?: 'office_id' | 'practice_id';
};

/**
 * Response from the authorized_practices endpoint
 */
export type SikkaAuthorizedPracticeListResponse =
  SikkaPaginatedResponse<SikkaAuthorizedPractice>;
