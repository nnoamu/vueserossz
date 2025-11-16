# Dashboard Oldal Implementálási Útmutató

## Áttekintés
Készíts egy professzionális Dashboard oldalt, amely megfelel a projekt architektúrájának és követi a meglévő kódolási stílusokat.

## Meglévő Komponensek és Struktúra

### Routing (src/router/index.ts)
```typescript
{
  path: '/dashboard',
  name: 'dashboard',
  component: LandingPage, // <- EZT KELL LECSERÉLNI DashboardPage-re
  meta: { requiresAuth: true }
}
```

### Elérhető API Végpontok

**GET /api/documents/my-tasks?page=1&pageSize=5**
- Visszaadja az aktuális felhasználó dokumentumait
- Támogatja a lapozást (page, pageSize)
- Response: `PaginatedResult<DocumentResponseDto>`

**DocumentResponseDto típus:**
```typescript
{
  id: number;
  archiveNumber: string;
  originalFileName: string;
  status: string;  // pl: "Draft", "PendingApproval", "Done"
  invoiceNumber?: string | null;
  supplierName?: string | null;
  companyName: string;
  documentTypeName: string;
  documentTypeCode: string;
  createdAt: string;
  modifiedAt?: string | null;
  // ... további mezők
}
```

### Elérhető Store Metódusok (documentStore)
```typescript
import { useDocumentStore } from '@/stores/documentStore';

const documentStore = useDocumentStore();

// Már implementált:
await documentStore.fetchMyTasks(page, pageSize);
// Returns: PaginatedResult<DocumentResponseDto>
```

### Elérhető Komponensek

**Layout:**
- `AppLayout` - Fő layout (sidebar, topbar)
- `BaseCard` - Kártya komponens címmel

**Base komponensek:**
- `BaseButton` - Gomb (variant: primary/secondary/success/danger/ghost)
- `BaseTable` - Táblázat (slot-alapú oszlop testreszabással)
- `StatusBadge` - Státusz badge (automatikus színezés)

**Utility függvények:**
```typescript
import { formatDateTime } from '@/utils/date.utils';
import { getStatusColor, getDocumentTypeBadgeClass } from '@/types/document.types';
```

## Feladat: DashboardPage.vue Létrehozása

### 1. Fájl létrehozása
**Hely:** `src/components/features/DashboardPage.vue`

### 2. Komponens Követelmények

#### Layout struktúra:
```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <BaseButton
          variant="primary"
          :left-icon="['fas', 'plus']"
          @click="navigateToUpload"
        >
          Új dokumentum iktatása
        </BaseButton>
      </div>

      <!-- Statisztikák (OPCIONÁLIS) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Stat Card 1: Vázlat -->
        <!-- Stat Card 2: Jóváhagyásra vár -->
        <!-- Stat Card 3: Kész -->
      </div>

      <!-- Aktuális Ügyeim Widget -->
      <BaseCard title="Aktuális Ügyeim">
        <!-- Táblázat: első 5 dokumentum -->
        <!-- "Összes megtekintése" link -->
      </BaseCard>
    </div>
  </AppLayout>
</template>
```

#### Táblázat Oszlopok (BaseTable-lel):
```typescript
const columns: TableColumn[] = [
  { key: 'archiveNumber', label: 'Iktatószám' },
  { key: 'supplierName', label: 'Szállító' },
  { key: 'invoiceNumber', label: 'Számlaszám' },
  { key: 'status', label: 'Státusz' },
  { key: 'createdAt', label: 'Létrehozva' },
  { key: 'actions', label: '' }  // Megnyit gomb
];
```

#### Táblázat slot példák (DocumentsListPage.vue alapján):
```vue
<BaseTable :columns="columns" :data="documents" :loading="isLoading">
  <!-- Státusz oszlop -->
  <template #cell-status="{ row }">
    <StatusBadge :status="row.status" />
  </template>

  <!-- Létrehozva oszlop -->
  <template #cell-createdAt="{ row }">
    <span class="text-sm text-gray-600">
      {{ formatDateTime(row.createdAt) }}
    </span>
  </template>

  <!-- Műveletek oszlop -->
  <template #cell-actions="{ row }">
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'eye']"
      @click="openDocument(row.id)"
    >
      Megnyit
    </BaseButton>
  </template>
</BaseTable>
```

#### Script setup szerkezet:
```typescript
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layout/AppLayout.vue';
import BaseCard from '../base/BaseCard.vue';
import BaseTable, { type TableColumn } from '../base/BaseTable.vue';
import BaseButton from '../base/BaseButton.vue';
import StatusBadge from '../base/StatusBadge.vue';
import { useDocumentStore } from '@/stores/documentStore';
import type { DocumentResponseDto } from '@/types/document.types';
import { formatDateTime } from '@/utils/date.utils';

const router = useRouter();
const documentStore = useDocumentStore();

// State
const documents = ref<DocumentResponseDto[]>([]);
const isLoading = computed(() => documentStore.isLoading);

// Methods
async function loadDocuments() {
  try {
    const result = await documentStore.fetchMyTasks(1, 5); // Első 5 dokumentum
    documents.value = result?.data || [];
  } catch (error) {
    console.error('Failed to load documents:', error);
    documents.value = [];
  }
}

function navigateToUpload() {
  router.push('/documents/upload');
}

function viewAllDocuments() {
  router.push('/documents');
}

function openDocument(documentId: number) {
  router.push(`/documents/${documentId}`);
}

onMounted(() => {
  loadDocuments();
});
```

#### Statisztikák kártya (OPCIONÁLIS):
Ha implementálod a statisztikákat, számold ki a documents tömbből:
```typescript
const stats = computed(() => {
  if (!documents.value) return { draft: 0, pending: 0, done: 0 };

  return {
    draft: documents.value.filter(d => d.status === 'Draft').length,
    pending: documents.value.filter(d =>
      d.status === 'PendingApproval' ||
      d.status === 'ElevatedApproval'
    ).length,
    done: documents.value.filter(d => d.status === 'Done').length,
  };
});
```

Stat kártya template:
```vue
<BaseCard>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">Vázlat</p>
        <p class="text-2xl font-semibold text-gray-900">{{ stats.draft }}</p>
      </div>
      <div class="rounded-full bg-gray-100 p-3">
        <font-awesome-icon :icon="['fas', 'file']" class="h-6 w-6 text-gray-600" />
      </div>
    </div>
  </div>
</BaseCard>
```

### 3. Routing Frissítése

**Fájl:** `src/router/index.ts`

Cseréld le a LandingPage importot és használatot:
```typescript
// Előtte:
import LandingPage from '@/components/features/LandingPage.vue';

{
  path: '/dashboard',
  name: 'dashboard',
  component: LandingPage,  // <- TÖRÖLNI
  meta: { requiresAuth: true }
}

// Utána:
import DashboardPage from '@/components/features/DashboardPage.vue';

{
  path: '/dashboard',
  name: 'dashboard',
  component: DashboardPage,  // <- ÚJ
  meta: { requiresAuth: true }
}
```

### 4. Kódolási Szabályok és Stílus

**FONTOS - Kövesd ezeket a szabályokat:**

1. **Import sorrend:**
   - Vue core (ref, computed, onMounted)
   - Vue Router (useRouter)
   - Layout komponensek
   - Base komponensek
   - Feature komponensek
   - Stores
   - Types
   - Utils

2. **Template struktúra:**
   - Használj Tailwind CSS utility class-okat
   - Követi a meglévő spacing rendszert (space-y-6, gap-4)
   - Responsive: `grid-cols-1 md:grid-cols-3`
   - Színpaletta: gray-900 (heading), gray-600 (text)

3. **BaseTable használat:**
   - SOHA ne használj thead/tbody közvetlenül
   - Használd a slot-alapú megközelítést (lásd DocumentsListPage.vue)
   - Cell customization: `<template #cell-{columnKey}="{ row }">`

4. **Hibakezelés:**
   - try/catch minden async műveletnél
   - console.error hibáknál
   - Üres tömb fallback, ha API hiba van

5. **Loading state:**
   - Használd a documentStore.isLoading-ot
   - BaseTable automatikusan kezeli a loading UI-t

6. **Ne használj:**
   - console.log (csak console.error hibáknál)
   - inline style-okat
   - hardcoded URL-eket (csak router.push használat)

### 5. Táblázat "Összes megtekintése" Link

A BaseCard komponensen belül, a táblázat alatt:
```vue
<BaseCard title="Aktuális Ügyeim">
  <BaseTable ...>
    <!-- slots -->
  </BaseTable>

  <!-- Összes megtekintése link -->
  <div class="mt-4 flex justify-end border-t border-gray-200 pt-4">
    <BaseButton
      variant="ghost"
      :right-icon="['fas', 'arrow-right']"
      @click="viewAllDocuments"
    >
      Összes megtekintése
    </BaseButton>
  </div>
</BaseCard>
```

### 6. Empty State (ha nincs dokumentum)

```vue
<div v-if="!isLoading && documents.length === 0" class="py-12 text-center">
  <font-awesome-icon :icon="['fas', 'file']" class="text-4xl text-gray-400 mb-4" />
  <h3 class="text-lg font-medium text-gray-900 mb-2">Nincs dokumentum</h3>
  <p class="text-sm text-gray-500 mb-4">
    Kezdj el dolgozni az első dokumentum feltöltésével.
  </p>
  <BaseButton
    variant="primary"
    :left-icon="['fas', 'plus']"
    @click="navigateToUpload"
  >
    Új dokumentum iktatása
  </BaseButton>
</div>
```

## Ellenőrző Lista

Implementálás után ellenőrizd:

- [ ] DashboardPage.vue létrehozva a helyes helyen
- [ ] Routing frissítve (LandingPage → DashboardPage)
- [ ] Import-ok helyesek és rendezettek
- [ ] API hívás működik (fetchMyTasks)
- [ ] Táblázat megjelenik az első 5 dokumentummal
- [ ] Státusz badge-ek megfelelően színezettek
- [ ] Dátumok helyesen formázva (formatDateTime)
- [ ] "Új dokumentum iktatása" gomb navigál /documents/upload-ra
- [ ] "Összes megtekintése" link navigál /documents-re
- [ ] "Megnyit" gomb navigál /documents/:id-re
- [ ] Loading state működik
- [ ] Empty state megjelenik, ha nincs dokumentum
- [ ] Nincs TypeScript hiba
- [ ] Nincs console.log (csak console.error)
- [ ] Responsive design működik (mobile, tablet, desktop)
- [ ] (Opcionális) Statisztikák megjelennek

## Futtatás és Tesztelés

```bash
# TypeScript ellenőrzés
npm run type-check

# Dev szerver
npm run dev

# Build
npm run build
```

## Megjegyzések

- **NE változtass meg meglévő komponenseket** (BaseTable, BaseCard, stb.)
- **NE hozz létre új base komponenseket** (használd a meglévőket)
- **NE módosítsd a documentStore-t** (a fetchMyTasks már implementálva van)
- **Követi a DocumentsListPage.vue mintáját**, de egyszerűsített (csak 5 dokumentum, nincs pagination)
- A statisztikák OPCIONÁLIS funkció - ha implementálod, csak a betöltött 5 dokumentumra számold ki

## Várható Eredmény

Egy professzionális, tiszta dashboard oldal, amely:
1. Gyorsan betölt (5 dokumentum)
2. Áttekinthető UI (modern, Tailwind-based)
3. Működő navigáció (upload, list, detail)
4. Követi a projekt kódolási standardjait
5. Reszponzív minden eszközön
