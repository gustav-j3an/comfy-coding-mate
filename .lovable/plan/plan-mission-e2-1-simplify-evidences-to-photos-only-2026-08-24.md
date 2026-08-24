# Plan - Mission E2.1: Simplify Evidences to Photos Only

Simplify the visit execution screen by removing video and PDF options, implementing a unified "Add Photos" button with a selection menu, and updating validation rules to focus on mandatory replacement photos per industry.

## User Interface Changes

### Visit Execution Screen (`src/routes/_authenticated/promoter/visit.$visitId.tsx`)
- Remove "Gravar Vídeo" and "Anexar PDF" buttons.
- Replace with a single "Adicionar Fotos" button.
- Implement a mobile-friendly menu (Bottom Sheet/Drawer) when clicking "Adicionar Fotos" with options:
    - "Tirar foto agora" (camera)
    - "Escolher da galeria" (gallery)
- After selecting a photo, show a type selection for the current industry context:
    - "Foto da reposição" (Mandatory)
    - "Foto do relatório" (Optional)
    - "Foto da ocorrência" (Optional)
- Update validation alert to only mention missing "Foto da reposição" per industry.
- Remove validation for textual report.
- Restrict file acceptance to `image/jpeg`, `image/png`, and `image/webp`.

### Stop Detail Drawer (`src/components/promoter/stop-detail-drawer.tsx`)
- Update the checklist display to remove "Registrar relatório" (textual).
- Clarify that only "Foto da reposição" is mandatory.

## Backend and Logic Changes

### Server Functions (`src/lib/execution.functions.ts`)
- Update `submitVisit` validation:
    - Remove "relatorio" (text/pdf) from mandatory requirements.
    - Ensure at least one "reposicao" photo exists for each industry in the visit.
    - Add strict image format validation.
    - Keep observations optional.

### Server Implementation (`src/lib/execution.functions.server.ts`)
- No major changes needed to `getPromoterVisitExecution` as it already provides industries.

## Technical Details

- **File Formats:** Enforcement of `image/*` in input tag and server-side MIME type check.
- **Data Model:** Continue using `visit_evidence` table; use `evidence_type` as 'reposicao', 'relatorio_foto', or 'ocorrencia'.
- **Backward Compatibility:** Historical PDF/Video files remain in Storage but new ones are blocked.
- **Offline Sync:** Existing draft logic will be preserved but adapted to photo-only flows.
