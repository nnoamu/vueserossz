# Cursor Parancsok - Advanced Features

## Rövid Verzió (Gyors Implementálás)

```
Implementáld az advanced features-t az ADVANCED_FEATURES_IMPLEMENTATION.md útmutató alapján.

FELADATOK PRIORITÁSI SORRENDBEN:

1. WORKFLOW FINOMHANGOLÁS:
   - Hozd létre a ConfirmDialog komponenst (src/components/base/ConfirmDialog.vue)
   - Frissítsd a DocumentDetailPage workflow action metódusait confirmation dialógussal
   - Implementálj proper error handling és toast notifications-t

2. STÁTUSZ FILTER TABS:
   - Hozd létre a BaseTabs komponenst (src/components/base/BaseTabs.vue)
   - Add hozzá a status filter tabs-okat a DocumentsListPage-hez
   - Implementálj status-based filtering-et az API hívásokban

3. KERESÉS OLDAL:
   - Hozd létre a SearchPage komponenst (src/components/features/SearchPage.vue)
   - Implementálj search form-ot minden szűrővel (alap, dátum, összeg, szöveg, hozzárendelt)
   - Implementálj results table-t és bulk export funkciót (Excel, ZIP)
   - Add hozzá a /search route-ot

4. SZÁLLÍTÓ MANAGEMENT:
   - Hozd létre a SuppliersPage komponenst (src/components/features/SuppliersPage.vue)
   - Implementálj CRUD műveleteket (create, read, update, toggle active)
   - Implementálj modal form-ot a szállító adatok szerkesztéséhez

5. LOADING & SKELETONS:
   - Hozd létre a SkeletonLoader komponenst (src/components/base/SkeletonLoader.vue)
   - Integráld a BaseTable-be és más komponensekbe

6. ERROR BOUNDARY:
   - Hozd létre az ErrorBoundary komponenst (src/components/base/ErrorBoundary.vue)
   - Wrap-eld az App.vue-ban

FONTOS:
- Használd a meglévő komponenseket (BaseButton, BaseInput, BaseSelect, BaseModal, BaseTable, stb.)
- Követi a projekt coding standards-ét
- API endpoints már léteznek a backend-en
- Minden komponenshez TypeScript típusok használata kötelező
- Error handling és loading states minden API híváshoz

Részletes specifikáció: ADVANCED_FEATURES_IMPLEMENTATION.md
```

---

## Részletes Verzió Feladatonként

### 1. Workflow Finomhangolás

```
FELADAT: Workflow gombok finomhangolása confirmation dialógusokkal és proper error handling-gel.

LÉPÉSEK:

1. Hozd létre a ConfirmDialog komponenst (src/components/base/ConfirmDialog.vue):
   - Props: modelValue, title, message, confirmText, cancelText, variant, loading
   - Emits: update:modelValue, confirm, cancel
   - Használj BaseModal wrapper-t
   - Footer: két gomb (cancel, confirm)

2. Frissítsd a DocumentDetailPage.vue-t:
   - Importáld a ConfirmDialog-ot
   - Add hozzá state: showConfirmDialog, confirmDialogConfig, performingAction
   - Implementálj showWorkflowConfirmation() helper függvényt
   - Frissítsd handleWorkflowAction() confirmation-nel
   - Frissítsd handleFinalize() confirmation-nel
   - Template-ben add hozzá a ConfirmDialog komponenst

API ENDPOINTS:
- POST /api/documents/{id}/workflow/advance - Body: { comment?: string }
- POST /api/documents/{id}/workflow/reject - Body: { reason: string }
- POST /api/documents/{id}/workflow/delegate - Body: { targetUserId: number, comment?: string }

ERROR HANDLING:
- try/catch minden API híváshoz
- Toast error üzenet ha sikertelen
- Toast success üzenet ha sikeres
- Loading state a műveletek során
- Dialog automatikus bezárás siker után

REFERENCIA: ADVANCED_FEATURES_IMPLEMENTATION.md, Section 1
```

### 2. Státusz Filter Tabs

```
FELADAT: Státusz filter tabs implementálása az Aktuális Ügyeim oldalon.

LÉPÉSEK:

1. Hozd létre a BaseTabs komponenst (src/components/base/BaseTabs.vue):
   - Props: modelValue (string), tabs (Tab[])
   - Tab interface: { value: string, label: string, icon?: [string, string], count?: number }
   - Emits: update:modelValue
   - Tailwind styling: active tab kék, inactive szürke
   - Icon support, count badge support

2. Frissítsd a DocumentsListPage.vue-t:
   - Importáld BaseTabs
   - State: statusFilter ref<string>('all')
   - statusTabs definíció: Összes, Vázlat, Jóváhagyásra vár, Kész
   - loadDocuments() módosítása status paraméterrel
   - watch(statusFilter) -> reload documents
   - Template-ben add hozzá BaseTabs a header és table közé

API HÍVÁS:
GET /api/documents/my-tasks?page=1&pageSize=20&status=Draft

REFERENCIA: ADVANCED_FEATURES_IMPLEMENTATION.md, Section 2
```

### 3. Keresés Oldal

```
FELADAT: Dokumentum keresés oldal létrehozása advanced search form-mal és results table-lel.

LÉPÉSEK:

1. Add hozzá a route-ot (src/router/index.ts):
   {
     path: '/search',
     name: 'search',
     component: () => import('@/components/features/SearchPage.vue'),
     meta: { requiresAuth: true, title: 'Dokumentum keresés' }
   }

2. Hozd létre a SearchPage komponenst (src/components/features/SearchPage.vue):

   STATE:
   - searchForm (alap szűrők, dátum szűrők, összeg szűrők, szöveg keresés, hozzárendelt)
   - searchResults, searchPagination
   - selectedDocuments (bulk export-hoz)
   - isSearching, hasSearched, exporting

   FORM STRUCTURE:
   - Accordion sections: Alap szűrők, Dátum szűrők, Összeg szűrők, Szöveg keresés, Hozzárendelt
   - Alap: Cég, Dokumentumtípus, Státusz (multi-select)
   - Dátum: Létrehozva, Kiállítás, Fizetési határidő (DateRangePicker)
   - Összeg: Bruttó min/max, Deviza
   - Szöveg: Iktatószám, Számlaszám, Szállító, Megjegyzés
   - Hozzárendelt: Felhasználó dropdown
   - Action buttons: Törlés, Keresés

   RESULTS TABLE:
   - Columns: Checkbox, Iktatószám, Cég, Szállító, Számlaszám, Státusz, Összeg, Létrehozva, Műveletek
   - Selectable rows
   - Bulk actions: Excel exportálás, ZIP exportálás
   - Pagination
   - Empty state

   METHODS:
   - performSearch() - GET /api/documents/search?params...
   - buildSearchParams() - form -> query params konverzió
   - resetForm()
   - handleSelect()
   - exportToExcel() - POST /api/documents/export/excel { documentIds }
   - exportToPdfZip() - POST /api/documents/export/pdf-zip { documentIds }

API ENDPOINTS:
- GET /api/documents/search?companyId=&documentTypeId=&status=&createdFrom=&createdTo=...
- POST /api/documents/export/excel - Body: { documentIds: number[] } - Response: Blob
- POST /api/documents/export/pdf-zip - Body: { documentIds: number[] } - Response: Blob

FILE DOWNLOAD:
- Blob response -> window.URL.createObjectURL()
- createElement('a'), href = url, download = filename, click()
- window.URL.revokeObjectURL(url)

REFERENCIA: ADVANCED_FEATURES_IMPLEMENTATION.md, Section 3
```

### 4. Szállító Management

```
FELADAT: Szállítók kezelése oldal (lista, create, edit, toggle active).

LÉPÉSEK:

1. Add hozzá a route-ot (src/router/index.ts):
   {
     path: '/suppliers',
     name: 'suppliers',
     component: () => import('@/components/features/SuppliersPage.vue'),
     meta: { requiresAuth: true, title: 'Szállítók' }
   }

2. Hozd létre a SuppliersPage komponenst (src/components/features/SuppliersPage.vue):

   STATE:
   - suppliers (array)
   - isLoading, saving
   - showCreateModal, editingSupplier
   - supplierForm, errors

   TABLE:
   - Columns: Név, Adószám, Kapcsolattartó, Email, Státusz (Aktív/Inaktív), Műveletek
   - Actions: Szerkesztés, Inaktiválás/Aktiválás gombok

   MODAL FORM:
   - Title: "Új szállító" vagy "Szállító szerkesztése"
   - Fields: Név (required), Adószám, Cím, Kapcsolattartó, Email, Telefon
   - Footer: Mégse, Mentés gombok
   - Validation

   METHODS:
   - loadSuppliers() - GET /api/suppliers
   - createSupplier() - POST /api/suppliers
   - editSupplier() - PUT /api/suppliers/{id}
   - toggleSupplierStatus() - PUT /api/suppliers/{id} { isActive: !current }
   - saveSupplier() - create vagy update logic
   - cancelEdit()

API ENDPOINTS:
- GET /api/suppliers - Return: SupplierDto[]
- GET /api/suppliers/{id} - Return: SupplierDto
- POST /api/suppliers - Body: CreateSupplierDto
- PUT /api/suppliers/{id} - Body: UpdateSupplierDto

TYPES (supplier.types.ts):
export interface SupplierDto {
  id: number;
  name: string;
  taxNumber?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
}

REFERENCIA: ADVANCED_FEATURES_IMPLEMENTATION.md, Section 4
```

### 5. Loading States & Skeletons

```
FELADAT: SkeletonLoader komponens létrehozása és integrálása.

LÉPÉSEK:

1. Hozd létre a SkeletonLoader komponenst (src/components/base/SkeletonLoader.vue):
   - Props: type ('table' | 'card' | 'list' | 'custom'), rows (number)
   - Tailwind animate-pulse használata
   - Skeleton patterns:
     - table: header + rows
     - card: title + content lines
     - list: list items
     - custom: slot

2. Integráld a BaseTable-be:
   - v-if="loading" -> SkeletonLoader type="table"
   - v-else -> actual table

3. Használd más komponensekben is:
   - DocumentsListPage
   - SearchPage
   - SuppliersPage
   - DashboardPage (optional)

PÉLDA:
<SkeletonLoader v-if="loading" type="table" :rows="5" />
<table v-else>...</table>

REFERENCIA: ADVANCED_FEATURES_IMPLEMENTATION.md, Section 5
```

### 6. Error Boundary

```
FELADAT: Global error boundary komponens létrehozása.

LÉPÉSEK:

1. Hozd létre az ErrorBoundary komponenst (src/components/base/ErrorBoundary.vue):
   - onErrorCaptured() használata
   - State: hasError, errorMessage
   - Error UI: nagy piros warning icon, error message, reload button, home button
   - Methods: reload() -> window.location.reload(), goHome() -> router.push('/dashboard')
   - Return false az error propagation megállításához

2. Wrap-eld az App.vue-ban:
   <ErrorBoundary>
     <router-view />
     <ToastContainer />
   </ErrorBoundary>

3. Test: throw new Error('Test error') valahol a kódban

REFERENCIA: ADVANCED_FEATURES_IMPLEMENTATION.md, Section 6
```

---

## Lépésről-Lépésre Verzió

```
LÉPÉS 1: ConfirmDialog komponens
- Hozd létre src/components/base/ConfirmDialog.vue
- Implement BaseModal wrapper, props, emits
- Test: használd DocumentDetailPage-ben egy workflow gombhoz

LÉPÉS 2: Workflow actions confirmation
- Frissítsd DocumentDetailPage handleWorkflowAction()
- Add hozzá showWorkflowConfirmation() helper
- Add hozzá ConfirmDialog a template-ben
- Test: kattints "Továbbküldés" gombra

LÉPÉS 3: BaseTabs komponens
- Hozd létre src/components/base/BaseTabs.vue
- Implement tabs rendering, active state, click handling
- Test: standalone használat

LÉPÉS 4: Status filter tabs
- Add hozzá BaseTabs-ot DocumentsListPage-hez
- Implement statusFilter state és watch
- Update loadDocuments() status paraméterrel
- Test: váltsd a tab-okat

LÉPÉS 5: SearchPage routing
- Add hozzá route-ot router/index.ts
- Hozd létre SearchPage.vue placeholder-rel
- Test: navigálj /search-re

LÉPÉS 6: SearchPage form
- Implement search form minden mezővel
- Add hozzá performSearch() és resetForm()
- Test: form submission

LÉPÉS 7: SearchPage results
- Implement results table
- Add hozzá bulk export buttons
- Implement exportToExcel() és exportToPdfZip()
- Test: search és export

LÉPÉS 8: SuppliersPage routing
- Add hozzá route-ot
- Hozd létre SuppliersPage.vue
- Test: navigálj /suppliers-re

LÉPÉS 9: SuppliersPage table és CRUD
- Implement suppliers table
- Add hozzá modal form
- Implement create, edit, toggle methods
- Test: minden CRUD művelet

LÉPÉS 10: SkeletonLoader
- Hozd létre SkeletonLoader.vue
- Integráld BaseTable-be
- Add hozzá más komponensekhez
- Test: loading states

LÉPÉS 11: ErrorBoundary
- Hozd létre ErrorBoundary.vue
- Wrap-eld App.vue-ban
- Test: throw error valahol

LÉPÉS 12: Final testing
- Test minden funkció
- TypeScript type check
- Build
```

---

## API Referencia

### Workflow
```
POST /api/documents/{id}/workflow/advance
Body: { comment?: string, assignToUserId?: number }
Response: { success: boolean, message: string, newStatus: string }

POST /api/documents/{id}/workflow/reject
Body: { reason: string }
Response: { success: boolean, message: string }

POST /api/documents/{id}/workflow/delegate
Body: { targetUserId: number, comment?: string }
Response: { success: boolean, message: string }
```

### Documents
```
GET /api/documents/my-tasks?page=1&pageSize=20&status=Draft
Response: PaginatedResult<DocumentResponseDto>

GET /api/documents/search?companyId=&status=&archiveNumber=&...
Response: PaginatedResult<DocumentResponseDto>
```

### Export
```
POST /api/documents/export/excel
Body: { documentIds: number[] }
Response: Blob (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

POST /api/documents/export/pdf-zip
Body: { documentIds: number[] }
Response: Blob (application/zip)
```

### Suppliers
```
GET /api/suppliers
Response: SupplierDto[]

GET /api/suppliers/{id}
Response: SupplierDto

POST /api/suppliers
Body: CreateSupplierDto
Response: SupplierDto

PUT /api/suppliers/{id}
Body: UpdateSupplierDto
Response: SupplierDto
```

---

## Tesztelési Checklist

- [ ] Workflow confirmation dialogs működnek
- [ ] Workflow actions success/error toast-ok
- [ ] Status filter tabs működnek és frissítik a listát
- [ ] Search form minden mező működik
- [ ] Search results megjelennek
- [ ] Bulk export (Excel, ZIP) működik és letölti a fájlt
- [ ] Suppliers CRUD műveletek működnek
- [ ] Supplier aktív/inaktív toggle működik
- [ ] Loading states (skeleton loader) minden táblázatnál
- [ ] Error boundary elkapja a hibákat
- [ ] Nincs TypeScript hiba
- [ ] Build sikeres
- [ ] Responsive design működik
