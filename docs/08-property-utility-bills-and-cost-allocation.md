# 08. Property Utility Bills, Operating Expenses & Cost Allocation

This guide covers the systematic recording of utility bills and operational costs at the **Property** and **Unit** level in Localea, statutory cost allocation keys (Verteilerschlüssel), heating cost apportionment (HeizkostenV 30/70 split), and the generation of annual operating cost settlements (Betriebskostenabrechnung).

---

## 1. Aggregating Expenses at Property & Unit Level

Operating expenses should never be logged as disconnected individual items. Localea organizes all operational expenditures under specific **Properties**, **Buildings**, and rentable **Units**:

```
[Property: Riverside Residences]
   │
   ├── Shared Property-Level Invoices (Aggregated for apportionment)
   │     ├── Municipal Water & Sewage Bill (Quarterly)
   │     ├── Central Gas / District Heating Invoice (Annual)
   │     ├── Building Fire & Liability Insurance (Annual)
   │     ├── Municipal Waste Management & Garbage Fees
   │     └── Landscaping & Common Stairwell Cleaning
   │
   └── Unit-Specific Direct Invoices (Direct booking)
         ├── Individual Unit Sub-meter Heating Repair (Apt 4B)
         └── Direct Commercial Sewer Charge (Ground Floor Retail)
```

### Apportionable vs. Non-Apportionable Costs

Under the German Operating Costs Ordinance (Betriebskostenverordnung - BetrKV) and international leasing standards:

| Cost Type | Definition | Included in Tenant Statement? |
| :--- | :--- | :--- |
| **Apportionable (Umlagefähig - BetrKV §§ 1–2)** | Regular recurring costs required for the ongoing operation of the building (water, heating, waste, insurance, janitor, elevator maintenance, property tax). | **Yes** — Apportioned across tenants according to contractual allocation keys. |
| **Non-Apportionable (Nicht umlagefähig)** | Capital expenditures, administrative management fees (Verwalterhonorar), structural building repairs, and reserve fund allocations (Instandhaltungsrücklage). | **No** — Bore exclusively by the property owner / landlord. |

---

## 2. Logging a Utility or Operating Expense

1. Navigate to **Finances** (`/finances`) or open the **Property Detail Page** (`/properties/[id]`) → **Costs / Expenses** tab.
2. Click **Log Cost / Expense** (`newCostItem`).
3. Complete the invoice details:
   - **Property**: Target property estate.
   - **Building / Unit Scope**: Select the whole property for shared utilities, or target a specific building/unit for direct costs.
   - **Cost Category**:
     - `HEIZUNG_WARMWASSER`: Central heating, gas, district heating, fuel oil delivery.
     - `WASSER_ABWASSER`: Potable water supply, rainwater drainage, municipal sewage.
     - `MUELLABFUHR`: Municipal waste disposal, recycling collection containers.
     - `VERSICHERUNG`: Building comprehensive insurance, liability insurance, storm damage coverage.
     - `HAUSMEISTER_REINIGUNG`: Facility janitorial services, window washing, winter gritting service.
     - `GRUNDSTEUER`: Municipal property tax assessment.
     - `AUFZUG`: Elevator service, emergency telephone line, TÜV safety certification.
     - `GARTENPFLEGE`: Grounds keeping, lawn mowing, tree trimming.
     - `SONSTIGES`: Other legally permissible operating expenses.
   - **Accounting Period**: The billing period covered by the invoice (e.g. `01/01/2026 – 31/12/2026`).
   - **Total Net & Gross Amount**: Total cost invoiced by the utility provider.
   - **Allocation Key (`Verteilerschlüssel`)**: Determines how the total cost will be split among tenants.
   - **Attachment**: Upload the PDF utility bill for compliance archiving.

---

## 3. Statutory Cost Allocation Keys (Verteilerschlüssel)

Localea calculates each tenant's proportionate share based on 5 mathematical allocation methods:

### 1. By Usable Floor Area ($m^2$ - Wohnfläche / Gewerbefläche)
The statutory standard default under § 556a Abs. 1 BGB:
$$\text{Cost}_{\text{Unit}} = \text{Total Cost} \times \left(\frac{\text{Area}_{\text{Unit}}}{\sum \text{Total Property Area}}\right)$$

### 2. By Unit Count (Anzahl Einheiten)
Used for costs that accrue equally per unit regardless of size (e.g. door intercom maintenance, cable TV base fees):
$$\text{Cost}_{\text{Unit}} = \frac{\text{Total Cost}}{\text{Total Count of Units}}$$

### 3. By Occupant Count (Personenmonate)
Used for trash or municipal water where sub-meters are absent:
$$\text{Cost}_{\text{Unit}} = \text{Total Cost} \times \left(\frac{\text{Occupants}_{\text{Unit}} \times \text{Occupied Months}}{\sum \text{Total Person-Months}}\right)$$

### 4. By Co-Ownership MEA Shares (Miteigentumsanteile / 1000)
Used for WEG condominium associations where costs are shared according to the property's registered declaration of division (Teilungserklärung).

### 5. By Meter Consumption (Zählerverbrauch)
Used when units have calibrated sub-meters (water meters, electricity meters, heat cost allocators).

---

## 4. Heating Cost Ordinance Split (Heizkostenverordnung - HeizkostenV)

Central heating cannot be apportioned 100% on area or 100% on consumption. Statutory law mandates a **hybrid split**:

$$\text{Total Heating Cost} = \text{Base Area Share (30% to 50%)} + \text{Consumption Share (70% to 50%) }$$

In Localea:
1. In the property heating cost settings, select the ratio (e.g. **30% Area / 70% Consumption**).
2. The engine calculates:
   - **Fixed Base Cost**: 30% of total heating expenditure divided strictly by unit floor area ($m^2$).
   - **Variable Consumption Cost**: 70% of total heating expenditure divided strictly by recorded meter units (Verbrauchseinheiten) from radiator heat cost allocators or heat meters.
3. If an individual tenant's meter was defective or inaccessible, the system provides statutory estimation (§ 9a HeizkostenV) based on comparable previous periods or building average.

---

## 5. Annual Operating Cost Settlement (Betriebskostenabrechnung)

At the conclusion of the 12-month billing period:

1. Navigate to **Statements** (`/statements`).
2. Click **Create Annual Settlement**:
   - Select the **Property** and **Period** (e.g. `2026`).
3. The engine aggregates:
   - **All logged property utility bills** for the period.
   - **All tenant leases** active during that period, factoring in exact mid-year move-in or move-out dates on a daily pro-rata basis ($x/365$ days).
   - **All monthly prepayments (`NEBENKOSTEN` and `HEIZKOSTEN`)** actually paid or billed to each tenant.
4. **Result Calculation**:
   $$\text{Final Balance} = \text{Actual Allocated Costs} - \text{Total Prepayments Billed}$$
   - **If Balance $> 0$ (Nachzahlung)**: The tenant owes an additional payment. Localea generates a settlement charge with a 30-day payment deadline.
   - **If Balance $< 0$ (Guthaben / Refund)**: The tenant has overpaid. Localea credits their tenant ledger account, reducing their next month's rent or scheduling a bank refund transfer.
5. Click **Generate PDF Statements**: produces individualized, statutory-compliant statements ready for mailing or 1-click delivery to tenant portals.
