# 05. Security Deposits Management Guide

This guide details the end-to-end administration of tenant security deposits (Mietkaution) in Localea: deposit structures, fiduciary escrow accounts, statutory compound interest calculations, receipt logging, and move-out refund/withholding settlement workflows.

---

## 1. Security Deposit Fundamentals

Under residential and commercial leasing regulations (e.g. § 551 BGB in Germany, or standard statutory lease agreements globally), a landlord or property manager can require a security deposit—typically equivalent to 1 to 3 months of base cold rent (`nettoKaltmiete`).

### Supported Deposit Types

| Deposit Type (`DepositType`) | Description | Handling in Localea |
| :--- | :--- | :--- |
| **`BAR` (Cash / Bank Transfer)** | Tenant pays the deposit into the manager's dedicated escrow bank account. | Logged as direct deposit payments; interest accrues on account. |
| **`BUERGSCHAFT` (Bank or Corporate Guarantee)** | Financial institution or guarantor issues a surety certificate (Mietkautionsbürgschaft). | Certificate number, issuing guarantor, and guarantee sum recorded without cash flow. |
| **`SPARBUCH` (Pledged Savings Account)** | Tenant pledges a personal savings account passbook to the landlord (verpfändetes Sparbuch). | Pledged account IBAN and blocking notice recorded; interest accrues with the bank. |
| **`TREUHAND` (Fiduciary Escrow Account)** | Separate fiduciary trust account managed strictly segregated from operational funds. | Linked to a dedicated `DepositAccount` record. |

---

## 2. Setting Up a Lease Deposit

When creating or editing a lease (`/leases/[id]`):

1. Scroll to the **Deposit (Kaution)** card.
2. Specify the agreed parameters:
   - **Agreed Amount (`depositAgreed`)**: Contractual total deposit amount (e.g. KES 150,000.00).
   - **Deposit Type**: Select `BAR`, `BUERGSCHAFT`, `SPARBUCH`, or `TREUHAND`.
   - **Deposit Account**: Select the designated escrow account (Treuhandsammelkonto or individual deposit sub-account).
   - **Bank / Provider Details**: For bank guarantees or pledged passbooks, enter the institution name and guarantee reference number.
3. Save the configuration. The lease summary displays the deposit status:
   - **`PENDING`**: Deposit agreed but no funds or certificate received.
   - **`PARTIAL`**: Partial installment received (tenants are legally entitled to pay cash deposits in 3 equal monthly installments).
   - **`PAID`**: Full deposit received and secured.
   - **`REFUNDED`**: Deposit refunded following tenancy termination.

---

## 3. Recording Deposit Payments

When the tenant transfers funds for their security deposit:

1. On the Lease detail page (`/leases/[id]`), click **Record Deposit Payment** (`addDepositPayment`).
2. Input the receipt details:
   - **Amount**: Installment or full amount received (e.g. KES 50,000.00 for installment 1 of 3).
   - **Receipt Date**: Value date when funds credited the escrow account.
   - **Target Escrow Account**: Select the fiduciary bank account.
   - **Reference / Notes**: Bank transaction memo (e.g. "Kaution 1. Rate - Apt 4B").
3. Submit the payment:
   - The lease's cumulative deposit balance is updated.
   - The transaction is logged in the deposit ledger, kept completely segregated from regular rental operating income.

---

## 4. Compound Interest Calculation

For cash deposits held in escrow, statutory law requires landlords to invest deposits at standard three-month savings rates and credit interest to the tenant:

$$A = P \times \left(1 + \frac{r}{100}\right)^t$$

Where:
- $P$ = Principal deposit amount
- $r$ = Annual interest rate percentage
- $t$ = Duration in years

Localea includes an automated **Deposit Interest Calculator**:
1. In the Deposit card, enter the applied annual interest rate (e.g. `1.25%`).
2. Click **Calculate Accrued Interest**:
   - The system computes compound interest accrued from the deposit receipt date to the current date or scheduled move-out date.
   - Generates an itemized interest summary ready for export or attachment to the refund statement.

---

## 5. Move-Out Settlement & Return Protocol

Following tenant departure and physical handover inspection (Wohnungsabnahme):

1. **Inspection Protocol Review**:
   - Verify damage logs from the handover protocol.
   - If tenant repairs are required, create a maintenance ticket or repair charge.
2. **Withholding for Outstanding Operating Costs (Sicherungseinbehalt)**:
   - Property managers may withhold an appropriate portion of the deposit (e.g. 2 to 3 months' utility prepayments) until the final annual utility cost settlement (Betriebskostenabrechnung) is calculated.
3. **Executing the Deposit Return**:
   - Navigate to the Lease detail page → **Deposit Settlement**.
   - Input total withholdings:
     - Unpaid rent arrears or open charges.
     - Documented damage repair invoices.
     - Withheld utility reserve.
   - Localea calculates the net returnable amount:
     $$\text{Refund Amount} = (\text{Deposit Balance} + \text{Accrued Interest}) - \text{Total Deductions}$$
   - Click **Record Refund**: creates the disbursement record and marks the deposit status as `REFUNDED`.
   - Print or email the official **Deposit Return Settlement (Kautionsabrechnung)** to the tenant.
