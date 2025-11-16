# Implementációs Útmutatók - Összefoglaló

Ez a dokumentum áttekintést nyújt az összes elérhető implementációs útmutatóról a projekt frontend fejlesztéséhez.

---

## 📚 Elérhető Útmutatók

### 1. REFACTOR_INSTRUCTIONS.md
**Státusz:** ✅ KÉSZ (már refaktorálva lett)

**Tartalom:** Részletes refactoring útmutató a frontend kód tisztításához és strukturálásához.

**Főbb témák:**
- Dátum formázó függvények centralizálása (`date.utils.ts`)
- FontAwesome importok optimalizálása
- Interface-ek és típusok kiszervezése (`document.types.ts`, `user.types.ts`, `supplier.types.ts`)
- Document type és action utility függvények
- Clipboard utility
- Konstansok centralizálása (`app.constants.ts`)
- Pagination logic composable (`usePagination.ts`)
- Loading state composable (`useLoading.ts`)

**Eredmény:** A refactoring sikeresen végrehajtva lett az upstream/develop branch-en (commit: 179007e).

---

### 2. DASHBOARD_IMPLEMENTATION.md + CURSOR_COMMAND.md
**Státusz:** 📝 Implementálandó

**Tartalom:** Dashboard oldal implementációs útmutató.

**Főbb komponensek:**
- **DashboardPage.vue**: Fő dashboard komponens
- **Aktuális Ügyeim widget**: Első 5 dokumentum táblázat formában
- **Új dokumentum iktatása gomb**: Navigáció upload oldalra
- **Statisztikák (opcionális)**: Vázlat/Jóváhagyásra vár/Kész count

**API Integráció:**
- `GET /api/documents/my-tasks?page=1&pageSize=5`

**Routing:**
- Frissíteni: `src/router/index.ts` (LandingPage → DashboardPage)

**Cursor Parancsok:**
- Rövid verzió: Gyors implementáláshoz
- Részletes verzió: Több kontextussal
- Lépésről-lépésre verzió: Fokozatos implementáláshoz

---

### 3. ADVANCED_FEATURES_IMPLEMENTATION.md + ADVANCED_FEATURES_CURSOR.md
**Státusz:** 📝 Implementálandó

**Tartalom:** Fejlett funkciók implementációs útmutató.

#### 3.1 Workflow Gombok Finomhangolás
**Komponensek:**
- `ConfirmDialog.vue` (új base komponens)
- `DocumentDetailPage.vue` (frissítés)

**Funkciók:**
- Confirmation dialógusok workflow műveletekhez
- Error handling és toast notifications
- Loading states

**API Endpoints:**
- `POST /api/documents/{id}/workflow/advance`
- `POST /api/documents/{id}/workflow/reject`
- `POST /api/documents/{id}/workflow/delegate`

#### 3.2 Státusz Filter Tabs
**Komponensek:**
- `BaseTabs.vue` (új base komponens)
- `DocumentsListPage.vue` (frissítés)

**Funkciók:**
- Tab-alapú státusz szűrés (Összes, Vázlat, Jóváhagyásra vár, Kész)
- Real-time lista frissítés

**API:**
- `GET /api/documents/my-tasks?status=Draft`

#### 3.3 Keresés Oldal
**Komponensek:**
- `SearchPage.vue` (új feature komponens)

**Funkciók:**
- Komplex keresési form:
  - Alap szűrők (Cég, Dokumentumtípus, Státusz)
  - Dátum szűrők (Létrehozva, Kiállítás, Fizetési határidő)
  - Összeg szűrők (Bruttó min/max, Deviza)
  - Szöveg keresés (Iktatószám, Számlaszám, Szállító, Megjegyzés)
  - Hozzárendelt felhasználó
- Találati lista táblázat
- Pagination
- Bulk export (Excel, ZIP)

**API Endpoints:**
- `GET /api/documents/search?params...`
- `POST /api/documents/export/excel`
- `POST /api/documents/export/pdf-zip`

#### 3.4 Szállító Management Oldal
**Komponensek:**
- `SuppliersPage.vue` (új feature komponens)

**Funkciók:**
- Szállítók lista táblázat
- CRUD műveletek (Create, Read, Update, Delete)
- Aktív/Inaktív toggle
- Modal form szállító szerkesztéshez

**API Endpoints:**
- `GET /api/suppliers`
- `GET /api/suppliers/{id}`
- `POST /api/suppliers`
- `PUT /api/suppliers/{id}`

#### 3.5 Loading States & Skeletons
**Komponensek:**
- `SkeletonLoader.vue` (új base komponens)

**Funkciók:**
- Skeleton patterns: table, card, list, custom
- Integráció BaseTable-be és más komponensekbe
- Animate-pulse animáció

#### 3.6 Error Boundaries
**Komponensek:**
- `ErrorBoundary.vue` (új base komponens)

**Funkciók:**
- Global error catching
- Error UI (icon, message, reload/home gombok)
- onErrorCaptured() Vue lifecycle használata
- App.vue wrapper

---

## 🎯 Implementálási Sorrend (Ajánlott)

### Prioritás 1: Alapok
1. ✅ **Refactoring** (már kész)
2. 📝 **Dashboard oldal** - Alapvető navigációs pont
3. 📝 **SkeletonLoader** - Javítja a UX-et minden listánál
4. 📝 **ErrorBoundary** - Stabilitás és error handling

### Prioritás 2: Workflow Fejlesztések
5. 📝 **ConfirmDialog** - Biztonságosabb műveletek
6. 📝 **Workflow finomhangolás** - DocumentDetailPage frissítése
7. 📝 **Státusz filter tabs** - Jobb dokumentum szűrés

### Prioritás 3: Fejlett Funkciók
8. 📝 **Keresés oldal** - Komplex keresési képességek
9. 📝 **Szállító management** - Szállító adatok kezelése

---

## 📋 Komponens Struktúra

### Jelenlegi Komponensek (Használhatók)

**Base Komponensek:**
- ✅ `BaseButton.vue`
- ✅ `BaseCard.vue`
- ✅ `BaseInput.vue`
- ✅ `BaseModal.vue`
- ✅ `BaseSelect.vue`
- ✅ `BaseTable.vue`
- ✅ `DateRangePicker.vue`
- ✅ `FileUpload.vue`
- ✅ `StatusBadge.vue`
- ✅ `ToastContainer.vue`

**Layout Komponensek:**
- ✅ `AppLayout.vue`
- ✅ `SideNav.vue`
- ✅ `TopBar.vue`

**Feature Komponensek:**
- ✅ `LoginPage.vue`
- ✅ `LandingPage.vue` (placeholder, lecserélendő DashboardPage-re)
- ✅ `DocumentsListPage.vue`
- ✅ `DocumentDetailPage.vue`
- ✅ `DocumentUploadPage.vue`
- ✅ `HistoryTimeline.vue`
- ✅ `CommentsSection.vue`
- ✅ `DelegateModal.vue`
- ✅ `RejectModal.vue`
- ✅ `SupplierAutocomplete.vue`
- ✅ `RelatedDocumentsList.vue`
- ✅ `RelatedDocumentSearchModal.vue`
- ✅ `FullscreenPdfModal.vue`

### Létrehozandó Komponensek

**Base Komponensek:**
- 📝 `ConfirmDialog.vue`
- 📝 `BaseTabs.vue`
- 📝 `SkeletonLoader.vue`
- 📝 `ErrorBoundary.vue`

**Feature Komponensek:**
- 📝 `DashboardPage.vue`
- 📝 `SearchPage.vue`
- 📝 `SuppliersPage.vue`

---

## 🛠️ Utility Függvények és Típusok

### Utilities (src/utils/)
- ✅ `date.utils.ts` - Dátum formázó függvények
- ✅ `clipboard.utils.ts` - Vágólap műveletek

### Types (src/types/)
- ✅ `document.types.ts` - Document, DocumentResponseDto, PaginatedResult, utility függvények
- ✅ `user.types.ts` - UserDto, UserWithCompanyDto, UserListItemDto
- ✅ `supplier.types.ts` - SupplierDto, SupplierListItemDto
- ✅ `auth.types.ts` - Authentication típusok
- ✅ `fontawesome.types.ts` - FontAwesome típusok re-export

### Constants (src/constants/)
- ✅ `app.constants.ts` - CURRENCY_OPTIONS, DOCUMENT_TYPE_CODES, PAGINATION_DEFAULTS

### Composables (src/composables/)
- ✅ `useToast.ts` - Toast notification kezelés
- ✅ `useLoading.ts` - Loading state kezelés
- ✅ `usePagination.ts` - Pagination logika
- ✅ `useDocuments.ts` - Document műveletek

### Stores (src/stores/)
- ✅ `authStore.ts` - Authentication state
- ✅ `documentStore.ts` - Document state és műveletek
- ✅ `uiStore.ts` - UI state

---

## 🚀 Cursor Parancsok Használata

### Gyors Implementálás
```
Implementáld a [FEATURE_NAME]-t az [IMPLEMENTATION_FILE].md alapján.
```

### Részletes Implementálás
```
Olvasd el a [IMPLEMENTATION_FILE].md fájlt és implementáld lépésről-lépésre.
```

### Lépésről-Lépésre
```
Implementáld a [FEATURE_NAME]-t az alábbi lépések szerint:
LÉPÉS 1: ...
LÉPÉS 2: ...
```

**Példák:**
- Dashboard: `CURSOR_COMMAND.md` fájlban
- Advanced features: `ADVANCED_FEATURES_CURSOR.md` fájlban

---

## 📊 API Endpoints Összefoglaló

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Documents
- `GET /api/documents/my-tasks`
- `GET /api/documents/search`
- `GET /api/documents/{id}`
- `POST /api/documents/upload`
- `PUT /api/documents/{id}`
- `DELETE /api/documents/{id}`

### Workflow
- `POST /api/documents/{id}/workflow/advance`
- `POST /api/documents/{id}/workflow/reject`
- `POST /api/documents/{id}/workflow/delegate`

### Export
- `POST /api/documents/export/excel`
- `POST /api/documents/export/pdf-zip`

### Suppliers
- `GET /api/suppliers`
- `GET /api/suppliers/search`
- `GET /api/suppliers/{id}`
- `POST /api/suppliers`
- `PUT /api/suppliers/{id}`

### Comments
- `GET /api/documents/{id}/comments`
- `POST /api/documents/{id}/comments`

### History
- `GET /api/documents/{id}/history`

---

## ✅ Kódolási Szabályok

### TypeScript
- Minden komponens TypeScript-ben
- Explicit típusok használata (interface, type)
- Strict mode

### Komponens Struktúra
```vue
<template>
  <!-- Template -->
</template>

<script setup lang="ts">
// 1. Imports (Vue, Router, Components, Stores, Types, Utils)
// 2. Router/Store instances
// 3. Props (defineProps)
// 4. Emits (defineEmits)
// 5. State (ref, reactive)
// 6. Computed
// 7. Methods
// 8. Lifecycle hooks (onMounted, watch)
</script>
```

### Import Sorrend
1. Vue core (`ref`, `computed`, `onMounted`)
2. Vue Router (`useRouter`)
3. Layout komponensek
4. Base komponensek
5. Feature komponensek
6. Stores
7. Types
8. Utils
9. Constants

### Stílus
- Tailwind CSS utility classes
- Responsive: `grid-cols-1 md:grid-cols-3`
- Színpaletta: `gray-900` (heading), `gray-600` (text)
- Spacing: `space-y-6`, `gap-4`

### Error Handling
- `try/catch` minden async műveletnél
- `console.error` hibáknál
- Toast notifications használata
- Loading states minden API híváshoz

### Ne használj
- `console.log` (csak console.error)
- Inline styles
- Hardcoded URL-ek
- Direct DOM manipulation

---

## 🧪 Tesztelés

### Type Check
```bash
npm run type-check
# vagy
npx vue-tsc --noEmit
```

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```

### Hasznos Parancsok
```bash
# Keresés a kódban
grep -rn "formatDate" src/components/

# Fájlok keresése
find src -name "*.vue"

# Git status
git status
```

---

## 📞 Kapcsolat és Support

Ha kérdésed van az implementációval kapcsolatban:
1. Olvasd el a releváns implementációs útmutatót
2. Ellenőrizd a meglévő komponenseket referenciának
3. Nézd meg a backend API dokumentációt
4. Használd a Cursor parancsokat fokozatos implementáláshoz

---

## 📝 Changelog

### 2025-11-16
- ✅ Refactoring útmutató (REFACTOR_INSTRUCTIONS.md)
- ✅ Dashboard implementációs útmutató (DASHBOARD_IMPLEMENTATION.md)
- ✅ Advanced features útmutató (ADVANCED_FEATURES_IMPLEMENTATION.md)
- ✅ Cursor parancsok minden feature-hez
- ✅ Index dokumentum (ez a fájl)

### 2025-11-16 (Upstream)
- ✅ Refactoring végrehajtva (commit: 179007e)
- ✅ Utility függvények és types létrehozva
- ✅ Composables implementálva
- ✅ Constants centralizálva

---

**Utolsó frissítés:** 2025-11-16
**Verzió:** 1.0.0
**Státusz:** Aktív fejlesztés alatt
