# 03. Leasing & Tenancy Management Guide

This guide covers the complete lease lifecycle, rental components, stepped & index rent adjustments, co-tenants, and prospective tenant matching.

---

## 1. Creating a Lease Contract

A lease contract connects a rentable `Unit` with one or more `Persons` (tenants).

1. Navigate to **Leases** (`/leases`) and click **New Lease**.
2. Complete contract parameters:
   - **Unit**: Select the target unit from your portfolio.
   - **Primary Tenant**: Select the person from your address book.
   - **Start Date**: Date when occupancy begins and rent becomes due.
   - **End Date**: Leave blank for indefinite standard contracts (unbefristet), or specify a termination date for fixed-term leases (befristet).
   - **Base Cold Rent (Kaltmiete)**: Base rent excluding utilities and heating (e.g. KES 65,000.00).
   - **Occupant Count (Personen)**: Number of residents (used for per-capita utility cost apportioning).
   - **Notice Period (Kündigungsfrist)**: Standard statutory period in months (typically 3 months).

---

## 2. Configuring Rent Components (Mietbestandteile)

Modern rental agreements typically comprise base cold rent plus recurring monthly prepayments or surcharges:

$$\text{Gross Rent (Warmmiete)} = \text{Base Cold Rent} + \sum \text{Rent Components}$$

1. Open the Lease detail page (`/leases/[id]`).
2. Under **Rent Components**, click **Add Component**:
   - `NEBENKOSTEN`: Operating service charge prepayment (water, waste, cleaning, insurance).
   - `HEIZKOSTEN`: Heating and hot water service charge prepayment.
   - `STELLPLATZ`: Dedicated garage or parking spot fee.
   - `MODERNISIERUNG`: Statutory modernization surcharge.
   - `SONSTIGES`: Any bespoke recurring charges (storage surcharge, furnished premium).
3. The system calculates the monthly total gross rent (`warmRent`), which serves as the base amount for automated monthly charge generation.

---

## 3. Rent Adjustments: Stepped (Staffel) & Index Rent

Localea supports legally compliant rent escalation models:

### A. Stepped Rent (Staffelmiete)
- Pre-agreed contractual increases that take effect on specific calendar dates.
- Add an adjustment with type `STAFFEL`, specify the `effectiveDate` and the `newRentCold`.
- When the effective date arrives, click **Apply** (`applyAdjustment`) to update the lease's active cold rent.

### B. Index-Linked Rent (Indexmiete)
- Rent escalations tied to the official Consumer Price Index (Verbraucherpreisindex - VPI).
- Configure type `INDEX`, input the base index point value (`indexBase`) and the newly published index value (`indexNew`).
- The system computes the allowable percentage change:
  $$\Delta \% = \left(\frac{\text{Index}_{\text{new}} - \text{Index}_{\text{base}}}{\text{Index}_{\text{base}}}\right) \times 100$$
- Review and apply the new base cold rent.

---

## 4. Multi-Tenant Tenancies (Co-Tenants)

Lease agreements frequently involve multiple signatories (couples, roommates, commercial partners) who are jointly and severally liable:

1. On the Lease detail page, locate the **Tenants (Mieter)** card.
2. Click **Add Tenant** to associate additional persons from your address book.
3. All linked tenants appear on statements, dunning notices, and portal authorization lists.

---

## 5. Leasing & Vacancy Matchmaking

To minimize vacancy rates, Localea provides a dedicated **Leasing Matchmaker** (`/leasing`):

1. The system automatically scans for:
   - Units currently vacant (no active lease).
   - Leases expiring within 90 days.
   - Free commercial sub-areas.
2. It matches these spaces against prospective tenants in your address book (contacts categorized under the `INTERESSENT` group).
3. Managers can inspect space criteria, review candidate notes, and convert prospects directly into active tenants with one click.
