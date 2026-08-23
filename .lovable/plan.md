# Plan: MISSÃO IMPORTAÇÃO 1 — BASE SEGURA DE IMPORTAÇÃO OPERACIONAL

Create a new administrative module for importing Excel (.xlsx) files containing operational base data (promoters, stores, industries, and routes). This mission focuses on the UI, parsing, preview, and validation without writing to the database.

## User Review Required

> [!IMPORTANT]
> The "Confirmar Importação" button will be disabled as per requirements, with a message stating that recording will be implemented in the next mission.

- The route will be `/admin/import`.
- Parsing will be done on the client side using the `xlsx` library.

## Proposed Changes

### UI & Routing
- Create `src/routes/_authenticated/admin/import.tsx` for the import module.
- Add "Importar Base Operacional" to `src/components/admin/admin-sidebar.tsx` under the "Administração" section.

### Components
- `ImportModule`: Main component for file selection and state management.
- `ImportSummary`: Statistics display (counts of promoters, stores, etc.).
- `ValidationTab`: Displays errors and inconsistencies (missing fields, broken references, duplicates).
- `PreviewTab`: Shows normalized data in a tabular format.

### Logic & Processing
- **Excel Reader**: Implementation of `FileReader` and `xlsx` parsing.
- **Normalization Engine**:
  - `PROMOTORES`: Extract name, UF, city, contact, observation.
  - `LOJAS`: Extract network, store, UF.
  - `INDUSTRIA`: Extract industry name.
  - `ROTEIROS` (Tabs starting with `ROTEIRO `): Extract industry, store, UF, promoter, frequency, and weekly day markings (`✓`).
- **Validation Suite**:
  - Missing mandatory fields check.
  - Entity existence check (e.g., store in route must exist in LOJAS tab).
  - Duplicate detection (duplicate stops in same route).
  - Frequency and day marking validation.

## Technical Details
- **Dependency**: Use `xlsx` (already in `package.json`).
- **State Management**: React `useState` for storing parsed data, summary, and validation results.
- **Security**: Page is protected by the `/admin` layout which checks for the `admin` role.

## Validation Plan
1. Admin logs in and accesses `/admin/import`.
2. Upload a sample .xlsx file.
3. Verify summary counts match expected values.
4. Check if CONSULTA and FREQUÊNCIA INDÚSTRIA tabs are correctly ignored.
5. Verify inconsistencies are flagged (e.g., missing store).
6. Confirm "Confirmar Importação" is disabled.
7. Verify Promoters/Industries cannot access the route.
