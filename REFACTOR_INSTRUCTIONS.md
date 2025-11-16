# Vue Frontend Refactoring Instructions

## Áttekintés
A develop-baranysz branch frontend kódjában több strukturális probléma van, amelyek a kód karbantarthatóságát és újrafelhasználhatóságát csökkentik. Ez a dokumentum részletes utasításokat tartalmaz a refaktoráláshoz.

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

## Ellenőrző lista (Checklist)

Miután végigmentél a refaktoráláson, ellenőrizd:

- [ ] Létrehoztad a `src/utils/date.utils.ts` fájlt
- [ ] Minden dátum formázás a centralizált utility függvényeket használja
- [ ] Eltávolítottad a `FontAwesomeIcon` felesleges importjait a komponensekből
- [ ] Ha szükséges, létrehoztad a `fontawesome.types.ts` fájlt a típusoknak
- [ ] Bővítetted a `document.types.ts` fájlt az új interface-ekkel
- [ ] Létrehoztad a `user.types.ts` fájlt
- [ ] Létrehoztad a `supplier.types.ts` fájlt
- [ ] Minden komponens a központi types fájlokat használja
- [ ] Az alkalmazás hiba nélkül fordul (`npm run build`)
- [ ] Nincs TypeScript hiba (`npm run type-check` vagy `vue-tsc --noEmit`)
- [ ] Az alkalmazás tesztelése dev módban (`npm run dev`)
- [ ] Minden funkció továbbra is működik (dátumok formázása, ikonok megjelenítése, stb.)

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
