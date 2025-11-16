# Vue Frontend Refactoring Instructions

## Áttekintés
A develop-baranysz branch frontend kódjában több strukturális probléma van, amelyek a kód karbantarthatóságát és újrafelhasználhatóságát csökkentik. Ez a dokumentum részletes utasításokat tartalmaz a refaktoráláshoz.

## Összefoglaló - Azonosított problémák

1. **Dátum formázó függvények** - 6+ komponensben ismétlődnek (formatDate, formatTime, stb.)
2. **FontAwesome importok** - 10+ komponensben feleslegesen importálva van, pedig globálisan elérhető
3. **Interface-ek és típusok** - DTO-k és modellek komponensekben vannak, kellene centralizálni
4. **Document/Action utility függvények** - getDocumentTypeBadgeClass, getActionLabel stb. ismétlődnek
5. **Clipboard utility** - copyToClipboard függvény csak 1 helyen van, de máshol is hasznos lenne
6. **Konstansok** - currencyOptions és más konstansok hardcoded vannak
7. **Pagination logic** - komplex visiblePages logika egy komponensben van
8. **Loading state** - sok ismétlődő loading state kezelés

## Azonosított problémák és megoldások

### 1. Dátum formázó függvények kiszervezése

**Probléma:**
- A `formatDate()` függvény többször meg van ismételve különböző komponensekben
- Ugyanazok a dátum formázási logikák újra és újra implementálva vannak
- Fájlok érintettek:
  - `src/components/features/DocumentsListPage.vue` (268. sor)
  - `src/components/features/HistoryTimeline.vue` (87. sor)
  - `src/components/features/DocumentDetailPage.vue`
  - `src/components/features/CommentsSection.vue`
  - `src/components/features/RelatedDocumentsList.vue`
  - `src/components/features/RelatedDocumentSearchModal.vue`

**Megoldás:**
Hozz létre egy `src/utils/date.utils.ts` fájlt az alábbi tartalommal:

```typescript
/**
 * Date formatting utilities
 */

/**
 * Format date to Hungarian locale with date and time
 * @param dateString - ISO date string
 * @returns Formatted date string (YYYY.MM.DD HH:mm) or '-' if invalid
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date to Hungarian locale with date only
 * @param dateString - ISO date string
 * @returns Formatted date string (YYYY.MM.DD) or '-' if invalid
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format date to Hungarian locale with short month name
 * @param dateString - ISO date string
 * @returns Formatted date string (YYYY. Month DD., HH:mm) or '-' if invalid
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time only
 * @param dateString - ISO date string
 * @returns Formatted time string (HH:mm) or '-' if invalid
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get relative time (e.g., "2 napja", "3 órája")
 * @param dateString - ISO date string
 * @returns Relative time string or '-' if invalid
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'most';
  if (diffMins < 60) return `${diffMins} perce`;
  if (diffHours < 24) return `${diffHours} órája`;
  if (diffDays < 30) return `${diffDays} napja`;

  return formatDate(dateString);
}
```

**Refactoring lépések:**
1. Hozd létre a `src/utils/date.utils.ts` fájlt a fenti tartalommal
2. Minden komponensben, ahol `formatDate`, `formatTime` vagy hasonló függvény van definiálva:
   - Töröld a helyi `formatDate()` függvényt
   - Importáld az új utility függvényt: `import { formatDateTime, formatDate, formatDateShort } from '@/utils/date.utils'`
   - Használd a megfelelő utility függvényt a formázáshoz
3. Ellenőrizd, hogy minden dátum formázás konzisztens-e az alkalmazásban

---

### 2. FontAwesome globális importálás

**Probléma:**
- A `FontAwesomeIcon` komponens és a típusok minden komponensben külön-külön importálva vannak
- Van egy központi `src/plugins/fontawesome.ts` fájl, de nem használják megfelelően
- Ez sok felesleges import sort jelent és növeli a bundle méretet
- Érintett fájlok (több mint 10 komponens):
  - `src/components/base/BaseModal.vue`
  - `src/components/base/BaseButton.vue`
  - `src/components/base/BaseTable.vue`
  - `src/components/base/ToastContainer.vue`
  - `src/components/base/StatusBadge.vue`
  - `src/components/base/FileUpload.vue`
  - `src/components/layout/SideNav.vue`
  - és további komponensek...

**Megoldás:**

**A) Ellenőrizd a main.ts-t:**
Győződj meg róla, hogy a FontAwesome plugin globálisan regisztrálva van a `src/main.ts`-ben:

```typescript
import { FontAwesomeIcon } from './plugins/fontawesome'

app.component('font-awesome-icon', FontAwesomeIcon)
```

**B) Távolítsd el a felesleges importokat:**
Minden komponensből, ahol a FontAwesomeIcon importálva van:

**Előtte:**
```vue
<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition, IconProp } from '@fortawesome/fontawesome-svg-core';
// ...
</script>
```

**Utána:**
```vue
<script setup lang="ts">
// FontAwesomeIcon komponens már globálisan regisztrálva van - nincs szükség importra
// ...
</script>
```

**C) Ha típusokra van szükség (BaseButton, SideNav, stb.):**
Hozz létre egy `src/types/fontawesome.types.ts` fájlt:

```typescript
import type { IconDefinition, IconProp } from '@fortawesome/fontawesome-svg-core';

export type { IconDefinition, IconProp };
```

Majd importáld csak a típusokat ahol szükséges:
```typescript
import type { IconDefinition, IconProp } from '@/types/fontawesome.types';
```

**Refactoring lépések:**
1. Ellenőrizd a `main.ts`-ben a globális regisztrációt
2. Keress rá minden `import.*FontAwesomeIcon.*from '@fortawesome/vue-fontawesome'` sorra
3. Töröld ezeket az importokat
4. Ha típusokra van szükség, hozd létre a `fontawesome.types.ts`-t és importáld onnan
5. Teszteld, hogy minden FontAwesome ikon továbbra is megjelenik

---

### 3. Interface-ek és típusok kiszervezése

**Probléma:**
- Sok komponens saját interface-eket definiál, amelyek lehetnek közösek vagy API-hoz kapcsolódnak
- Ezeket a típusokat érdemes lenne központosítani a `src/types/` mappába
- Érintett fájlok és interface-ek:
  - `src/components/features/HistoryTimeline.vue`: `DocumentHistoryDto`
  - `src/components/features/DocumentDetailPage.vue`: `DocumentDetailDto`, `DocumentHistoryDto`, `UserDto`
  - `src/components/features/RelatedDocumentsList.vue`: `DocumentRelation`
  - `src/components/features/CommentsSection.vue`: Comment típusok
  - `src/components/features/SupplierAutocomplete.vue`: Supplier típusok
  - `src/components/features/RejectModal.vue`: Rejection típusok
  - `src/components/features/DelegateModal.vue`: Delegate típusok

**Megoldás:**

**A) Bővítsd ki a document.types.ts fájlt:**

Adj hozzá a következő interface-eket a `src/types/document.types.ts`-hez:

```typescript
/**
 * Document history entry DTO
 */
export interface DocumentHistoryDto {
  id: number;
  userId: number;
  userName: string;
  action: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  comment?: string | null;
  createdAt: string;
}

/**
 * Document detail DTO with full information
 */
export interface DocumentDetailDto {
  id: number;
  archiveNumber: string;
  originalFileName: string;
  status: string;
  invoiceNumber?: string | null;
  issueDate?: string | null;
  performanceDate?: string | null;
  paymentDeadline?: string | null;
  grossAmount?: number | null;
  netAmount?: number | null;
  taxAmount?: number | null;
  currency?: string | null;
  companyId: number;
  companyName: string;
  documentTypeId: number;
  documentTypeName: string;
  documentTypeCode: string;
  supplierId?: number | null;
  supplierName?: string | null;
  createdByUserId: number;
  createdByName: string;
  assignedToUserId?: number | null;
  assignedToName?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
  customFields?: Record<string, any>;
}

/**
 * Document relation DTO
 */
export interface DocumentRelationDto {
  id: number;
  documentId: number;
  relatedDocumentId: number;
  relatedDocumentArchiveNumber: string;
  relatedDocumentTypeName: string;
  relationType: string;
  createdAt: string;
  createdByName: string;
}

/**
 * Document comment DTO
 */
export interface DocumentCommentDto {
  id: number;
  documentId: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
  modifiedAt?: string | null;
}
```

**B) Hozz létre egy user.types.ts fájlt:**

`src/types/user.types.ts`:

```typescript
/**
 * User types and interfaces
 */

/**
 * Basic user DTO
 */
export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role?: string;
  companyId?: number;
  companyName?: string;
}

/**
 * User with company information
 */
export interface UserWithCompanyDto extends UserDto {
  companyId: number;
  companyName: string;
}

/**
 * User list item for dropdowns/autocomplete
 */
export interface UserListItemDto {
  id: number;
  name: string;
  email: string;
}
```

**C) Hozz létre egy supplier.types.ts fájlt:**

`src/types/supplier.types.ts`:

```typescript
/**
 * Supplier types and interfaces
 */

/**
 * Supplier DTO
 */
export interface SupplierDto {
  id: number;
  name: string;
  taxNumber?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Supplier list item for autocomplete
 */
export interface SupplierListItemDto {
  id: number;
  name: string;
  taxNumber?: string | null;
}
```

**D) Komponens interface-ek (Props interface-ek) maradhatnak a komponensekben:**
- A komponens Props interface-ek (pl. `BaseModalProps`, `ButtonProps`) maradhatnak a komponensekben
- Csak az **API/domain típusokat** (DTO-k, modellek) kell kiszervezni

**Refactoring lépések:**
1. Bővítsd a `document.types.ts` fájlt a fenti interface-ekkel
2. Hozd létre a `user.types.ts` fájlt
3. Hozd létre a `supplier.types.ts` fájlt
4. Minden komponensben, ahol ezek az interface-ek lokálisan vannak definiálva:
   - Töröld a helyi interface definíciót
   - Importáld a megfelelő típust: `import type { DocumentHistoryDto, DocumentDetailDto } from '@/types/document.types'`
5. Ellenőrizd, hogy nincs-e duplikált típus definíció
6. Futtasd a TypeScript type checkert: `npm run type-check` vagy `vue-tsc --noEmit`

---

### 4. Document Type és Action utility függvények centralizálása

**Probléma:**
- A `getDocumentTypeBadgeClass()` függvény legalább 2 komponensben ismétlődik
- A `getActionLabel()`, `getActionIcon()`, `getActionBadgeClass()` függvények a HistoryTimeline komponensben vannak, de máshol is hasznosak lennének
- Ezek a függvények domain-specifikus logikát tartalmaznak, amelyet érdemes centralizálni
- Érintett fájlok:
  - `src/components/features/DocumentDetailPage.vue`: `getDocumentTypeBadgeClass()`
  - `src/components/features/RelatedDocumentsList.vue`: `getDocumentTypeBadgeClass()`
  - `src/components/features/HistoryTimeline.vue`: `getActionLabel()`, `getActionIcon()`, `getActionBadgeClass()`

**Megoldás:**

**A) Bővítsd ki a document.types.ts fájlt:**

Adj hozzá a következő utility függvényeket a `src/types/document.types.ts`-hez (a már meglévő `getStatusColor`, `getStatusDisplayName`, `getStatusIcon` függvények mellé):

```typescript
/**
 * Get badge color classes for document type
 * @param code - Document type code
 * @returns TailwindCSS color class string
 */
export function getDocumentTypeBadgeClass(code: string): string {
  switch (code) {
    case 'SZLA': return 'bg-blue-100 text-blue-800';
    case 'TIG': return 'bg-green-100 text-green-800';
    case 'SZ': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get Hungarian label for document history action
 * @param action - Action code
 * @returns Hungarian translation of the action
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'Created': 'Létrehozva',
    'Updated': 'Módosítva',
    'StatusChanged': 'Státusz változás',
    'CommentAdded': 'Megjegyzés hozzáadva',
    'Forwarded': 'Továbbküldve',
    'Returned': 'Visszaküldve',
    'Rejected': 'Elutasítva',
    'Finalized': 'Lezárva',
    'Assigned': 'Hozzárendelve',
    'Delegated': 'Átadva',
  };
  return labels[action] || action;
}

/**
 * Get icon for document history action
 * @param action - Action code
 * @returns FontAwesome icon definition array [prefix, iconName]
 */
export function getActionIcon(action: string): [string, string] {
  const icons: Record<string, [string, string]> = {
    'Created': ['fas', 'plus'],
    'Updated': ['fas', 'edit'],
    'StatusChanged': ['fas', 'arrows-rotate'],
    'CommentAdded': ['fas', 'comment'],
    'Forwarded': ['fas', 'arrow-right'],
    'Returned': ['fas', 'arrow-left'],
    'Rejected': ['fas', 'times-circle'],
    'Finalized': ['fas', 'check-circle'],
    'Assigned': ['fas', 'user'],
    'Delegated': ['fas', 'user-plus'],
  };
  return icons[action] || ['fas', 'circle'];
}

/**
 * Get badge color classes for document history action
 * @param action - Action code
 * @returns TailwindCSS color class string
 */
export function getActionBadgeClass(action: string): string {
  switch (action) {
    case 'Created': return 'bg-green-500';
    case 'Updated': return 'bg-blue-500';
    case 'StatusChanged': return 'bg-indigo-500';
    case 'CommentAdded': return 'bg-purple-500';
    case 'Forwarded': return 'bg-cyan-500';
    case 'Returned': return 'bg-orange-500';
    case 'Rejected': return 'bg-red-500';
    case 'Finalized': return 'bg-emerald-500';
    case 'Assigned': return 'bg-blue-600';
    case 'Delegated': return 'bg-teal-500';
    default: return 'bg-gray-500';
  }
}
```

**Refactoring lépések:**
1. Add hozzá a fenti függvényeket a `document.types.ts` végéhez
2. Minden komponensben, ahol ezek a függvények lokálisan vannak definiálva:
   - Töröld a helyi függvény definíciót
   - Importáld a centralizált függvényt: `import { getDocumentTypeBadgeClass, getActionLabel, getActionIcon, getActionBadgeClass } from '@/types/document.types'`
3. Ellenőrizd, hogy a függvények ugyanúgy működnek

---

### 5. Clipboard utility függvény létrehozása

**Probléma:**
- A `copyToClipboard()` függvény jelenleg csak a DocumentDetailPage-ben van, de hasznos lenne más komponensekben is
- Ez egy gyakori funkció, amit érdemes centralizálni
- Érintett fájl:
  - `src/components/features/DocumentDetailPage.vue` (1155. sor)

**Megoldás:**

Hozz létre egy `src/utils/clipboard.utils.ts` fájlt:

```typescript
import { useToast } from '@/composables/useToast';

/**
 * Copy text to clipboard with toast notification
 * @param text - Text to copy to clipboard
 * @param successMessage - Optional success message (default: "Másolva a vágólapra")
 * @param errorMessage - Optional error message (default: "Nem sikerült másolni")
 */
export async function copyToClipboard(
  text: string,
  successMessage = 'Másolva a vágólapra',
  errorMessage = 'Nem sikerült másolni'
): Promise<void> {
  const { success, error } = useToast();

  try {
    await navigator.clipboard.writeText(text);
    success(successMessage);
  } catch (err) {
    error(errorMessage);
  }
}
```

**Refactoring lépések:**
1. Hozd létre a `src/utils/clipboard.utils.ts` fájlt a fenti tartalommal
2. A DocumentDetailPage-ben:
   - Töröld a helyi `copyToClipboard()` függvényt
   - Importáld: `import { copyToClipboard } from '@/utils/clipboard.utils'`
3. Ha más komponensekben is szükséges clipboard funkció, használd ezt a utility függvényt

---

### 6. Konstansok centralizálása

**Probléma:**
- A `currencyOptions` és más konstansok hardcoded módon vannak a komponensekben
- Ezeket a konstansokat érdemes lenne egy központi helyre tenni
- Érintett fájl:
  - `src/components/features/DocumentDetailPage.vue`: `currencyOptions`

**Megoldás:**

Hozz létre egy `src/constants/app.constants.ts` fájlt:

```typescript
/**
 * Application-wide constants
 */

/**
 * Currency options for select dropdowns
 */
export const CURRENCY_OPTIONS = [
  { label: 'HUF', value: 'HUF' },
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
] as const;

/**
 * Supported currency codes
 */
export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['value'];

/**
 * Document type codes
 */
export const DOCUMENT_TYPE_CODES = {
  INVOICE: 'SZLA',
  CONTRACT: 'SZ',
  REQUEST: 'TIG',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_VISIBLE_PAGES: 7,
} as const;
```

**Refactoring lépések:**
1. Hozd létre a `src/constants/app.constants.ts` fájlt
2. Minden komponensben, ahol ezek a konstansok hardcoded vannak:
   - Töröld a helyi konstans definíciót
   - Importáld: `import { CURRENCY_OPTIONS, DOCUMENT_TYPE_CODES } from '@/constants/app.constants'`
3. Cseréld le a hardcoded értékeket az importált konstansokra

---

### 7. Pagination logic composable-be helyezése

**Probléma:**
- A `visiblePages` computed property komplex logikát tartalmaz az oldalszámok megjelenítéséhez
- Ez a logika ismétlődhet más komponensekben is, ahol pagination van
- Jelenleg csak a DocumentsListPage-ben van, de előfordulhat máshol is
- Érintett fájl:
  - `src/components/features/DocumentsListPage.vue` (193-234. sor)

**Megoldás:**

Hozz létre egy `src/composables/usePagination.ts` fájlt:

```typescript
import { computed, type Ref } from 'vue';
import type { PaginatedResult } from '@/types/document.types';
import { PAGINATION_DEFAULTS } from '@/constants/app.constants';

/**
 * Composable for pagination logic
 */
export function usePagination<T>(paginationData: Ref<PaginatedResult<T> | null>) {
  /**
   * Calculate visible page numbers for pagination UI
   * Shows ellipsis (...) when there are many pages
   */
  const visiblePages = computed(() => {
    if (!paginationData.value) return [];

    const total = paginationData.value.totalPages;
    const current = paginationData.value.page;
    const pages: (number | string)[] = [];
    const maxVisible = PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES;

    if (total <= maxVisible) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current <= 4) {
        // Near the start
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        // Near the end
        pages.push('...');
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      }
    }

    return pages;
  });

  /**
   * Check if there's a previous page
   */
  const hasPrevious = computed(() => {
    return paginationData.value && paginationData.value.page > 1;
  });

  /**
   * Check if there's a next page
   */
  const hasNext = computed(() => {
    return paginationData.value && paginationData.value.page < paginationData.value.totalPages;
  });

  return {
    visiblePages,
    hasPrevious,
    hasNext,
  };
}
```

**Refactoring lépések:**
1. Hozd létre a `src/composables/usePagination.ts` fájlt
2. A DocumentsListPage-ben:
   - Importáld: `import { usePagination } from '@/composables/usePagination'`
   - Használd a composable-t: `const { visiblePages, hasPrevious, hasNext } = usePagination(pagination)`
   - Töröld a helyi `visiblePages` computed property-t
3. Ha máshol is van pagination, használd ezt a composable-t

---

### 8. Loading state composable létrehozása (opcionális)

**Probléma:**
- Sok komponensben van `loading`, `isLoading`, `loadingUsers`, `loadingBcData` stb. state
- Ezek kezelése ismétlődő kód
- Érintett fájlok: szinte minden feature komponens

**Megoldás:**

Hozz létre egy `src/composables/useLoading.ts` fájlt:

```typescript
import { ref } from 'vue';

/**
 * Composable for managing loading states
 */
export function useLoading(initialState = false) {
  const isLoading = ref(initialState);

  /**
   * Set loading state to true
   */
  function startLoading() {
    isLoading.value = true;
  }

  /**
   * Set loading state to false
   */
  function stopLoading() {
    isLoading.value = false;
  }

  /**
   * Execute an async function with automatic loading state management
   * @param fn - Async function to execute
   * @returns Result of the async function
   */
  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    try {
      startLoading();
      return await fn();
    } finally {
      stopLoading();
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}
```

**Használat példa:**
```typescript
const { isLoading, withLoading } = useLoading();

async function loadData() {
  await withLoading(async () => {
    // Your async operation here
    const data = await api.get('/data');
    // ...
  });
}
```

**Refactoring lépések (opcionális):**
1. Hozd létre a `src/composables/useLoading.ts` fájlt
2. Komponensekben, ahol egyszerű loading state van:
   - Cseréld le a `ref(false)` loading state-et a `useLoading()` composable-re
   - Használd a `withLoading()` függvényt az async műveleteknél
3. Ez egy opcionális refactoring, csak ott alkalmazzuk, ahol egyszerűsíti a kódot

---

## Ellenőrző lista (Checklist)

Miután végigmentél a refaktoráláson, ellenőrizd:

### Alapvető refactoring (kötelező):
- [ ] Létrehoztad a `src/utils/date.utils.ts` fájlt
- [ ] Minden dátum formázás a centralizált utility függvényeket használja
- [ ] Eltávolítottad a `FontAwesomeIcon` felesleges importjait a komponensekből
- [ ] Ha szükséges, létrehoztad a `fontawesome.types.ts` fájlt a típusoknak
- [ ] Bővítetted a `document.types.ts` fájlt az új interface-ekkel
- [ ] Létrehoztad a `user.types.ts` fájlt
- [ ] Létrehoztad a `supplier.types.ts` fájlt
- [ ] Minden komponens a központi types fájlokat használja

### További refactoring (ajánlott):
- [ ] Bővítetted a `document.types.ts` fájlt a utility függvényekkel (getDocumentTypeBadgeClass, getActionLabel, stb.)
- [ ] Létrehoztad a `src/utils/clipboard.utils.ts` fájlt
- [ ] Létrehoztad a `src/constants/app.constants.ts` fájlt
- [ ] Létrehoztad a `src/composables/usePagination.ts` fájlt
- [ ] A pagination logic a composable-t használja
- [ ] (Opcionális) Létrehoztad a `src/composables/useLoading.ts` fájlt

### Tesztelés:
- [ ] Az alkalmazás hiba nélkül fordul (`npm run build`)
- [ ] Nincs TypeScript hiba (`npm run type-check` vagy `vue-tsc --noEmit`)
- [ ] Az alkalmazás tesztelése dev módban (`npm run dev`)
- [ ] Minden funkció továbbra is működik (dátumok formázása, ikonok megjelenítése, badge színek, stb.)
- [ ] Clipboard másolás működik
- [ ] Pagination működik

---

## Javasolt megközelítés

1. **Először**: Hozd létre az új utility és types fájlokat
2. **Másodszor**: Refaktorálj komponensenként, tesztelve minden változtatás után
3. **Végül**: Futtasd a type checkert és build-et a hibák ellenőrzésére

---

## Hasznos parancsok

```bash
# TypeScript type checking
npm run type-check
# vagy
npx vue-tsc --noEmit

# Build a projektnek
npm run build

# Dev szerver indítása
npm run dev

# Keresés az összes formatDate függvényre
grep -rn "function formatDate" src/components/

# Keresés az összes FontAwesome importra
grep -rn "import.*FontAwesomeIcon.*from '@fortawesome" src/components/

# Keresés interface definíciókra komponensekben
grep -rn "^interface.*Dto" src/components/
```

---

## Megjegyzések

- Ez a refactoring **nem törhet semmilyen meglévő funkcionalitást**
- Minden változtatás után tesztelj
- Ha találsz további ismétlődő kódot, jelezd és add hozzá ehhez a dokumentumhoz
- A komponens-specifikus Props interface-ek maradhatnak a komponensekben
- Csak a megosztott/API típusokat érdemes kiszervezni
