# 02. Properties, Buildings & Units Onboarding Guide

This guide covers the hierarchy of real estate assets in Localea, management configurations (Mietverwaltung vs. WEG), property tax parameters, meter logging, and bulk CSV ingestion.

---

## 1. Asset Hierarchy Architecture

In Localea, real estate assets are structured hierarchically:

$$\text{Property (Liegenschaft / Estate)} \;\longrightarrow\; \text{Building (Gebäude)} \;\longrightarrow\; \text{Unit (Einheit)}$$

- **Property (`Property`)**: The top-level legal entity or parcel (e.g. "Riverside Residences", "Parkview Commercial Center"). It defines the management model, Verwalterhonorar fee structure, and bank account links.
- **Building (`Building`)**: A distinct physical structure or house number located within the estate (e.g. "Haus A - Entrance West", "Haus B").
- **Unit (`Unit`)**: The rentable or owned space (Apartment, Retail shop, Office, Underground parking spot, Basement storage).

---

## 2. Setting Up a Property

1. Navigate to **Properties** (`/properties`) and click **New Property**.
2. Configure core fields:
   - **Name**: Official property designation.
   - **Address**: Street, ZIP code, City.
   - **Property Type**:
     - `WOHNEN`: Purely residential multi-family housing.
     - `GEWERBE`: Purely commercial or industrial asset.
     - `GEMISCHT`: Mixed-use asset (commercial ground floor with residential units above).
   - **Management Type**:
     - `MIET`: Rental property management (Mietverwaltung) acting on behalf of owners/landlords.
     - `WEG`: Condominium association (Wohnungseigentümergemeinschaft) with individual owners, reserve accounts, and HOA fees.
3. Configure **Management Fee (Verwalterhonorar)**:
   - `PAUSCHAL`: Fixed flat monthly fee (e.g. KES 50,000 / month).
   - `PRO_EINHEIT`: Fee calculated per unit (e.g. KES 3,500 per unit / month).
   - `PROZENT`: Percentage of gross collected or billed rent (e.g. 5.5%).

### German Property Tax (Grundsteuer Reform 2025)
For German properties governed by the 2025 property tax reform, configure the statutory valuation fields under the Property Tax tab:
- **Aktenzeichen**: Official fiscal reference number from the tax office.
- **Grundsteuerwert**: Assessed capital valuation.
- **Steuermessbetrag**: Statutory base multiplier amount.
- **Hebesatz**: Municipal multiplier percentage.
The system automatically calculates the annual property tax and allows booking it directly into the annual statement costs.

---

## 3. Creating Buildings and Units

1. On the Property detail page (`/properties/[id]`), click **New Building** to define structural divisions (e.g. "Building 1", "North Wing").
2. Inside each Building, click **New Unit**:
   - **Label**: Unit identifier (e.g. "Apt 101", "Office 2B", "Parking P-04").
   - **Type**:
     - `WOHNUNG`: Apartment.
     - `GEWERBE`: Commercial office or retail space.
     - `STELLPLATZ`: Dedicated parking spot or garage.
     - `KELLER`: Storage basement.
     - `SONSTIGES`: Other utility or communal spaces.
   - **Area ($m^2$)**: Living or usable floor area (used for area-based cost allocation and rent calculations).
   - **Rooms**: Number of habitable rooms.
   - **Co-Ownership Share (MEA - Miteigentumsanteil)**: Promille share (e.g. 125/1000) for WEG voting and reserve fund allocation.

---

## 4. Utility Meter Administration

Accurate utility statements require tracking physical meters:

1. Navigate to the Unit detail page (`/units/[id]`).
2. Click **New Meter**:
   - **Meter Type**: `STROM` (Electricity), `GAS` (Natural Gas), `WASSER_KALT` (Cold Water), `WASSER_WARM` (Hot Water), or `WAERME` (Heat Energy Meter).
   - **Serial Number**: Physical meter number stamped on the device casing.
3. Recording Meter Readings:
   - Click **New Reading** when tenant moves in, moves out, or during annual meter inspections.
   - Provide the inspection date and numeric reading value.
   - Localea calculates consumption intervals between readings for service charge statements (HeizkostenV & BetrKV).

---

## 5. Bulk CSV Ingestion

When importing an existing portfolio from legacy software or spreadsheets:

1. Click **Import CSV** in the top action bar of Properties, Units, or Persons.
2. Select your delimited file (`.csv` format with semicolon or comma separators).
3. Supported CSV schemas:
   - **Properties**: `name; street; zip; city; type; management`
   - **Units**: `property; building; label; type; area; rooms; mea`
   - **Persons**: `firstName; lastName; email; phone; type; note`
4. The system automatically creates matching building hierarchies and reports the count of imported vs skipped items.
