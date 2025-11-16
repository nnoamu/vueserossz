# Advanced Features Implementation Guide

## Áttekintés
Ez a dokumentum részletes implementációs útmutatót tartalmaz a következő fejlett funkciókhoz:
1. Workflow gombok finomhangolás
2. Státusz filter tabs
3. Keresés oldal
4. Szállító management oldal
5. Loading states & skeletons
6. Error boundaries

---

## 1. Workflow Gombok Finomhangolás

### Jelenlegi Állapot
A `DocumentDetailPage.vue`-ben már vannak workflow gombok:
- Továbbküldés következő lépésre
- Visszaküldés előző lépésre
- Dokumentum átadása másnak
- Elutasítás
- Iktatás lezárása

### Továbbfejlesztendő Funkciók

#### 1.1 Confirmation Dialog Komponens

**Fájl létrehozása:** `src/components/base/ConfirmDialog.vue`

```vue
<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    size="sm"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600">{{ message }}</p>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="handleCancel">
        {{ cancelText }}
      </BaseButton>
      <BaseButton
        :variant="variant"
        @click="handleConfirm"
        :loading="loading"
      >
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'success';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Megerősítés',
  cancelText: 'Mégse',
  variant: 'primary',
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function handleCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleConfirm() {
  emit('confirm');
  // Ne zárjuk be automatikusan, hadd kezelje a parent
}
</script>
```

#### 1.2 Workflow Actions Integration (DocumentDetailPage.vue)

**Frissítendő metódusok:**

```typescript
// State hozzáadása
const showConfirmDialog = ref(false);
const confirmDialogConfig = ref({
  title: '',
  message: '',
  action: null as (() => Promise<void>) | null,
  variant: 'primary' as 'primary' | 'danger' | 'success',
});
const performingAction = ref(false);

// Confirmation dialog megjelenítése
function showWorkflowConfirmation(
  title: string,
  message: string,
  action: () => Promise<void>,
  variant: 'primary' | 'danger' | 'success' = 'primary'
) {
  confirmDialogConfig.value = { title, message, action, variant };
  showConfirmDialog.value = true;
}

// Továbbküldés confirmation-nel
async function handleWorkflowAction(action: string) {
  if (action === 'forward') {
    showWorkflowConfirmation(
      'Továbbküldés megerősítése',
      'Biztosan tovább szeretné küldeni a dokumentumot a következő lépésre?',
      async () => {
        try {
          performingAction.value = true;
          const response = await api.post(
            `/documents/${documentId}/workflow/advance`,
            { comment: null }
          );

          if (response.data.success) {
            success('Dokumentum sikeresen továbbküldve');
            await loadDocument(); // Reload to get updated status
          } else {
            toastError(response.data.message || 'Továbbküldés sikertelen');
          }
        } catch (err) {
          toastError('Hiba történt a továbbküldés során');
          console.error('Workflow advance error:', err);
        } finally {
          performingAction.value = false;
          showConfirmDialog.value = false;
        }
      },
      'primary'
    );
  }
}

// Lezárás confirmation-nel
async function handleFinalize() {
  showWorkflowConfirmation(
    'Iktatás lezárása',
    'Biztosan le szeretné zárni a dokumentum iktatását? Ez a művelet nem visszavonható.',
    async () => {
      try {
        performingAction.value = true;
        const response = await api.post(
          `/documents/${documentId}/workflow/finalize`,
          { comment: null }
        );

        if (response.data.success) {
          success('Dokumentum iktatása sikeresen lezárva');
          await loadDocument();
        } else {
          toastError(response.data.message || 'Lezárás sikertelen');
        }
      } catch (err) {
        toastError('Hiba történt a lezárás során');
        console.error('Workflow finalize error:', err);
      } finally {
        performingAction.value = false;
        showConfirmDialog.value = false;
      }
    },
    'success'
  );
}

// Dialog confirmation handler
async function handleConfirmAction() {
  if (confirmDialogConfig.value.action) {
    await confirmDialogConfig.value.action();
  }
}
```

**Template frissítés:**

```vue
<!-- ConfirmDialog hozzáadása -->
<ConfirmDialog
  v-model="showConfirmDialog"
  :title="confirmDialogConfig.title"
  :message="confirmDialogConfig.message"
  :variant="confirmDialogConfig.variant"
  :loading="performingAction"
  @confirm="handleConfirmAction"
/>
```

---

## 2. Státusz Filter Tabs

### 2.1 Tab Komponens Létrehozása

**Fájl létrehozása:** `src/components/base/BaseTabs.vue`

```vue
<template>
  <div class="border-b border-gray-200">
    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="$emit('update:modelValue', tab.value)"
        :class="[
          modelValue === tab.value
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
        ]"
      >
        <font-awesome-icon
          v-if="tab.icon"
          :icon="tab.icon"
          :class="[
            modelValue === tab.value
              ? 'text-blue-500'
              : 'text-gray-400 group-hover:text-gray-500',
            '-ml-0.5 mr-2 h-5 w-5'
          ]"
        />
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.count !== undefined"
          :class="[
            modelValue === tab.value
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-900',
            'ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium'
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
export interface Tab {
  value: string;
  label: string;
  icon?: [string, string];
  count?: number;
}

interface Props {
  modelValue: string;
  tabs: Tab[];
}

defineProps<Props>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
```

### 2.2 DocumentsListPage Frissítése

**State hozzáadása:**

```typescript
// State
const statusFilter = ref<string>('all');

// Tab definitions
const statusTabs: Tab[] = [
  { value: 'all', label: 'Összes', icon: ['fas', 'list'] },
  { value: 'Draft', label: 'Vázlat', icon: ['fas', 'file'] },
  { value: 'PendingApproval', label: 'Jóváhagyásra vár', icon: ['fas', 'clock'] },
  { value: 'Done', label: 'Kész', icon: ['fas', 'check-circle'] },
];

// Load documents with status filter
async function loadDocuments() {
  try {
    let result;
    if (statusFilter.value === 'all') {
      result = await documentStore.fetchMyTasks(currentPage.value, pageSize.value);
    } else {
      // Call with status parameter
      const response = await api.get<PaginatedResult<DocumentResponseDto>>(
        '/documents/my-tasks',
        {
          params: {
            page: currentPage.value,
            pageSize: pageSize.value,
            status: statusFilter.value
          }
        }
      );
      result = response.data;
    }

    documents.value = result?.data || [];
    pagination.value = result;
  } catch (error) {
    console.error('Failed to load documents:', error);
    documents.value = [];
    pagination.value = null;
  }
}

// Watch status filter changes
watch(statusFilter, () => {
  currentPage.value = 1; // Reset to first page
  loadDocuments();
});
```

**Template frissítés:**

```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900">Aktuális Ügyeim</h1>
        <!-- ... -->
      </div>

      <!-- Status Filter Tabs -->
      <BaseTabs
        v-model="statusFilter"
        :tabs="statusTabs"
      />

      <!-- Table Card -->
      <BaseCard>
        <!-- ... existing table ... -->
      </BaseCard>
    </div>
  </AppLayout>
</template>
```

---

## 3. Keresés Oldal (/search)

### 3.1 Route Hozzáadása

**Fájl:** `src/router/index.ts`

```typescript
{
  path: '/search',
  name: 'search',
  component: () => import('@/components/features/SearchPage.vue'),
  meta: { requiresAuth: true, title: 'Dokumentum keresés' }
}
```

### 3.2 SearchPage Komponens

**Fájl létrehozása:** `src/components/features/SearchPage.vue`

```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900">Dokumentum keresés</h1>
      </div>

      <!-- Search Form Card -->
      <BaseCard title="Keresési feltételek">
        <div class="space-y-6">
          <!-- Alap szűrők -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Alap szűrők</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BaseSelect
                v-model="searchForm.companyId"
                :options="companyOptions"
                label="Cég"
                placeholder="Összes cég"
              />
              <BaseSelect
                v-model="searchForm.documentTypeId"
                :options="documentTypeOptions"
                label="Dokumentumtípus"
                placeholder="Összes típus"
              />
              <BaseSelect
                v-model="searchForm.status"
                :options="statusOptions"
                label="Státusz"
                placeholder="Összes státusz"
                multiple
              />
            </div>
          </div>

          <!-- Dátum szűrők -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Dátum szűrők</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DateRangePicker
                v-model:start-date="searchForm.createdFrom"
                v-model:end-date="searchForm.createdTo"
                label="Létrehozva"
              />
              <DateRangePicker
                v-model:start-date="searchForm.issueDateFrom"
                v-model:end-date="searchForm.issueDateTo"
                label="Kiállítás dátuma"
              />
              <DateRangePicker
                v-model:start-date="searchForm.paymentDeadlineFrom"
                v-model:end-date="searchForm.paymentDeadlineTo"
                label="Fizetési határidő"
              />
            </div>
          </div>

          <!-- Összeg szűrők -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Összeg szűrők</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BaseInput
                v-model="searchForm.grossAmountMin"
                type="number"
                label="Bruttó összeg min"
                placeholder="0"
                step="0.01"
              />
              <BaseInput
                v-model="searchForm.grossAmountMax"
                type="number"
                label="Bruttó összeg max"
                placeholder="0"
                step="0.01"
              />
              <BaseSelect
                v-model="searchForm.currency"
                :options="CURRENCY_OPTIONS"
                label="Deviza"
                placeholder="Összes deviza"
              />
            </div>
          </div>

          <!-- Szöveg keresés -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Szöveg keresés</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput
                v-model="searchForm.archiveNumber"
                label="Iktatószám"
                placeholder="Keresés iktatószámban..."
              />
              <BaseInput
                v-model="searchForm.invoiceNumber"
                label="Számlaszám"
                placeholder="Keresés számlaszámban..."
              />
              <BaseInput
                v-model="searchForm.supplierName"
                label="Szállító"
                placeholder="Keresés szállító névben..."
              />
              <BaseInput
                v-model="searchForm.comment"
                label="Megjegyzés"
                placeholder="Keresés megjegyzésben..."
              />
            </div>
          </div>

          <!-- Hozzárendelt felhasználó -->
          <div>
            <BaseSelect
              v-model="searchForm.assignedToUserId"
              :options="userOptions"
              label="Hozzárendelt felhasználó"
              placeholder="Összes felhasználó"
              :loading="loadingUsers"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <BaseButton
              variant="secondary"
              @click="resetForm"
              :disabled="isSearching"
            >
              Törlés
            </BaseButton>
            <BaseButton
              variant="primary"
              @click="performSearch"
              :loading="isSearching"
              :left-icon="['fas', 'search']"
            >
              Keresés
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Search Results -->
      <BaseCard v-if="hasSearched" title="Találati lista">
        <!-- Bulk Actions -->
        <div v-if="selectedDocuments.length > 0" class="mb-4 flex gap-2">
          <BaseButton
            variant="secondary"
            size="sm"
            :left-icon="['fas', 'file-excel']"
            @click="exportToExcel"
            :loading="exporting"
          >
            Excel exportálás ({{ selectedDocuments.length }})
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="sm"
            :left-icon="['fas', 'file-zipper']"
            @click="exportToPdfZip"
            :loading="exporting"
          >
            ZIP exportálás ({{ selectedDocuments.length }})
          </BaseButton>
        </div>

        <!-- Results Table -->
        <BaseTable
          :columns="resultsColumns"
          :data="searchResults"
          :loading="isSearching"
          :selectable="true"
          row-key="id"
          @select="handleSelect"
        >
          <!-- Custom cell templates -->
          <template #cell-archiveNumber="{ row }">
            <span class="font-mono text-sm">{{ row.archiveNumber }}</span>
          </template>
          <template #cell-status="{ row }">
            <StatusBadge :status="row.status" />
          </template>
          <template #cell-grossAmount="{ row }">
            <span v-if="row.grossAmount" class="text-sm">
              {{ formatCurrency(row.grossAmount, row.currency) }}
            </span>
            <span v-else class="text-sm text-gray-400">-</span>
          </template>
          <template #cell-createdAt="{ row }">
            <span class="text-sm text-gray-600">
              {{ formatDateTime(row.createdAt) }}
            </span>
          </template>
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

        <!-- Pagination -->
        <div v-if="searchPagination && searchPagination.totalPages > 1" class="mt-4">
          <!-- Same pagination as DocumentsListPage -->
        </div>

        <!-- Empty State -->
        <div v-if="!isSearching && searchResults.length === 0" class="py-12 text-center">
          <font-awesome-icon :icon="['fas', 'search']" class="text-4xl text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Nincs találat</h3>
          <p class="text-sm text-gray-500">
            Próbáljon meg más keresési feltételeket.
          </p>
        </div>
      </BaseCard>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layout/AppLayout.vue';
import BaseCard from '../base/BaseCard.vue';
import BaseTable, { type TableColumn } from '../base/BaseTable.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseInput from '../base/BaseInput.vue';
import BaseSelect from '../base/BaseSelect.vue';
import DateRangePicker from '../base/DateRangePicker.vue';
import StatusBadge from '../base/StatusBadge.vue';
import { useToast } from '@/composables/useToast';
import api from '@/services/api';
import type { DocumentResponseDto, PaginatedResult } from '@/types/document.types';
import { formatDateTime } from '@/utils/date.utils';
import { CURRENCY_OPTIONS } from '@/constants/app.constants';

const router = useRouter();
const { success, error: toastError } = useToast();

// State
const searchForm = ref({
  companyId: null as number | null,
  documentTypeId: null as number | null,
  status: [] as string[],
  createdFrom: null as string | null,
  createdTo: null as string | null,
  issueDateFrom: null as string | null,
  issueDateTo: null as string | null,
  paymentDeadlineFrom: null as string | null,
  paymentDeadlineTo: null as string | null,
  grossAmountMin: null as number | null,
  grossAmountMax: null as number | null,
  currency: null as string | null,
  archiveNumber: '',
  invoiceNumber: '',
  supplierName: '',
  comment: '',
  assignedToUserId: null as number | null,
});

const searchResults = ref<DocumentResponseDto[]>([]);
const searchPagination = ref<PaginatedResult<DocumentResponseDto> | null>(null);
const selectedDocuments = ref<DocumentResponseDto[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const exporting = ref(false);
const loadingUsers = ref(false);

// Options (load from API)
const companyOptions = ref([]);
const documentTypeOptions = ref([]);
const userOptions = ref([]);

const statusOptions = [
  { label: 'Vázlat', value: 'Draft' },
  { label: 'Jóváhagyásra vár', value: 'PendingApproval' },
  { label: 'Emelt szintű jóváhagyás', value: 'ElevatedApproval' },
  { label: 'Könyvelőnél', value: 'Accountant' },
  { label: 'Kész', value: 'Done' },
  { label: 'Elutasítva', value: 'Rejected' },
];

// Table columns
const resultsColumns: TableColumn[] = [
  { key: 'archiveNumber', label: 'Iktatószám' },
  { key: 'companyName', label: 'Cég' },
  { key: 'supplierName', label: 'Szállító' },
  { key: 'invoiceNumber', label: 'Számlaszám' },
  { key: 'status', label: 'Státusz' },
  { key: 'grossAmount', label: 'Összeg' },
  { key: 'createdAt', label: 'Létrehozva' },
  { key: 'actions', label: '' },
];

// Methods
async function performSearch() {
  isSearching.value = true;
  hasSearched.value = true;

  try {
    const params = buildSearchParams();
    const response = await api.get<PaginatedResult<DocumentResponseDto>>(
      '/documents/search',
      { params }
    );

    searchResults.value = response.data.data || [];
    searchPagination.value = response.data;
  } catch (err) {
    toastError('Hiba történt a keresés során');
    console.error('Search error:', err);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function buildSearchParams() {
  const params: any = { page: 1, pageSize: 20 };

  Object.entries(searchForm.value).forEach(([key, value]) => {
    if (value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      params[key] = value;
    }
  });

  return params;
}

function resetForm() {
  searchForm.value = {
    companyId: null,
    documentTypeId: null,
    status: [],
    createdFrom: null,
    createdTo: null,
    issueDateFrom: null,
    issueDateTo: null,
    paymentDeadlineFrom: null,
    paymentDeadlineTo: null,
    grossAmountMin: null,
    grossAmountMax: null,
    currency: null,
    archiveNumber: '',
    invoiceNumber: '',
    supplierName: '',
    comment: '',
    assignedToUserId: null,
  };
  searchResults.value = [];
  selectedDocuments.value = [];
  hasSearched.value = false;
}

function handleSelect(selected: DocumentResponseDto[]) {
  selectedDocuments.value = selected;
}

function openDocument(documentId: number) {
  router.push(`/documents/${documentId}`);
}

function formatCurrency(amount: number, currency: string = 'HUF'): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

async function exportToExcel() {
  if (selectedDocuments.value.length === 0) return;

  exporting.value = true;
  try {
    const documentIds = selectedDocuments.value.map(d => d.id);
    const response = await api.post(
      '/documents/export/excel',
      { documentIds },
      { responseType: 'blob' }
    );

    // Download file
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documents_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    success('Excel fájl sikeresen exportálva');
  } catch (err) {
    toastError('Hiba történt az exportálás során');
    console.error('Export error:', err);
  } finally {
    exporting.value = false;
  }
}

async function exportToPdfZip() {
  if (selectedDocuments.value.length === 0) return;

  exporting.value = true;
  try {
    const documentIds = selectedDocuments.value.map(d => d.id);
    const response = await api.post(
      '/documents/export/pdf-zip',
      { documentIds },
      { responseType: 'blob' }
    );

    // Download file
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documents_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    window.URL.revokeObjectURL(url);

    success('ZIP fájl sikeresen exportálva');
  } catch (err) {
    toastError('Hiba történt az exportálás során');
    console.error('Export error:', err);
  } finally {
    exporting.value = false;
  }
}

// Load options on mount
onMounted(async () => {
  // Load companies, document types, users
  // Implementation details...
});
</script>
```

---

## 4. Szállító Management Oldal

### 4.1 Route Hozzáadása

```typescript
{
  path: '/suppliers',
  name: 'suppliers',
  component: () => import('@/components/features/SuppliersPage.vue'),
  meta: { requiresAuth: true, title: 'Szállítók' }
}
```

### 4.2 SuppliersPage Komponens

**Fájl létrehozása:** `src/components/features/SuppliersPage.vue`

Teljes komponens kód (rövid verzió):

```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900">Szállítók</h1>
        <BaseButton
          variant="primary"
          :left-icon="['fas', 'plus']"
          @click="showCreateModal = true"
        >
          Új szállító
        </BaseButton>
      </div>

      <!-- Suppliers Table -->
      <BaseCard>
        <BaseTable
          :columns="columns"
          :data="suppliers"
          :loading="isLoading"
        >
          <template #cell-isActive="{ row }">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                row.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              ]"
            >
              {{ row.isActive ? 'Aktív' : 'Inaktív' }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex gap-2">
              <BaseButton
                variant="ghost"
                size="sm"
                :left-icon="['fas', 'edit']"
                @click="editSupplier(row)"
              >
                Szerkesztés
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                :left-icon="['fas', row.isActive ? 'times' : 'check']"
                @click="toggleSupplierStatus(row)"
              >
                {{ row.isActive ? 'Inaktiválás' : 'Aktiválás' }}
              </BaseButton>
            </div>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <!-- Create/Edit Supplier Modal -->
    <BaseModal
      v-model="showCreateModal"
      :title="editingSupplier ? 'Szállító szerkesztése' : 'Új szállító'"
      size="md"
    >
      <div class="space-y-4">
        <BaseInput
          v-model="supplierForm.name"
          label="Név"
          placeholder="Szállító neve"
          required
          :error="errors.name"
        />
        <BaseInput
          v-model="supplierForm.taxNumber"
          label="Adószám"
          placeholder="12345678-1-23"
          :error="errors.taxNumber"
        />
        <BaseInput
          v-model="supplierForm.address"
          label="Cím"
          placeholder="Cím"
        />
        <BaseInput
          v-model="supplierForm.contactPerson"
          label="Kapcsolattartó"
          placeholder="Kapcsolattartó neve"
        />
        <BaseInput
          v-model="supplierForm.email"
          type="email"
          label="Email"
          placeholder="email@example.com"
        />
        <BaseInput
          v-model="supplierForm.phone"
          label="Telefon"
          placeholder="+36 30 123 4567"
        />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="cancelEdit">
          Mégse
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="saveSupplier"
          :loading="saving"
        >
          Mentés
        </BaseButton>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<script setup lang="ts">
// Full implementation with API calls
// ... (similar structure to other pages)
</script>
```

---

## 5. Loading States & Skeletons

### 5.1 Skeleton Loader Komponens

**Fájl létrehozása:** `src/components/base/SkeletonLoader.vue`

```vue
<template>
  <div class="animate-pulse">
    <!-- Table Skeleton -->
    <div v-if="type === 'table'" class="space-y-3">
      <div class="h-10 bg-gray-200 rounded"></div>
      <div v-for="i in rows" :key="i" class="h-16 bg-gray-100 rounded"></div>
    </div>

    <!-- Card Skeleton -->
    <div v-else-if="type === 'card'" class="space-y-4">
      <div class="h-6 bg-gray-200 rounded w-1/4"></div>
      <div class="h-4 bg-gray-100 rounded w-3/4"></div>
      <div class="h-4 bg-gray-100 rounded w-1/2"></div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="space-y-2">
      <div v-for="i in rows" :key="i" class="h-12 bg-gray-100 rounded"></div>
    </div>

    <!-- Custom -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'table' | 'card' | 'list' | 'custom';
  rows?: number;
}

withDefaults(defineProps<Props>(), {
  type: 'custom',
  rows: 5,
});
</script>
```

### 5.2 Használat BaseTable-ben

```typescript
// BaseTable.vue frissítése
<template>
  <div class="overflow-x-auto">
    <SkeletonLoader v-if="loading" type="table" :rows="5" />
    <table v-else class="min-w-full divide-y divide-gray-200">
      <!-- ... -->
    </table>
  </div>
</template>
```

---

## 6. Error Boundaries

### 6.1 Error Boundary Komponens

**Fájl létrehozása:** `src/components/base/ErrorBoundary.vue`

```vue
<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gray-50">
    <BaseCard class="max-w-md">
      <div class="text-center py-8">
        <font-awesome-icon
          :icon="['fas', 'exclamation-triangle']"
          class="text-5xl text-red-500 mb-4"
        />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Váratlan hiba történt
        </h2>
        <p class="text-gray-600 mb-4">
          {{ errorMessage }}
        </p>
        <div class="flex gap-2 justify-center">
          <BaseButton variant="primary" @click="reload">
            Oldal újratöltése
          </BaseButton>
          <BaseButton variant="secondary" @click="goHome">
            Főoldal
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from './BaseCard.vue';
import BaseButton from './BaseButton.vue';

const router = useRouter();
const hasError = ref(false);
const errorMessage = ref('');

onErrorCaptured((err: Error) => {
  hasError.value = true;
  errorMessage.value = err.message || 'Ismeretlen hiba';
  console.error('Error boundary caught:', err);
  return false; // Prevent error propagation
});

function reload() {
  window.location.reload();
}

function goHome() {
  router.push('/dashboard');
}
</script>
```

### 6.2 Használat App.vue-ban

```vue
<template>
  <ErrorBoundary>
    <router-view />
    <ToastContainer />
  </ErrorBoundary>
</template>
```

---

## Ellenőrző Lista

### Workflow Finomhangolás:
- [ ] ConfirmDialog komponens létrehozva
- [ ] Workflow actions confirmation dialógussal
- [ ] Error handling minden workflow műveletnél
- [ ] Success feedback toast üzenetekkel
- [ ] Loading states a műveletek során

### Státusz Filter Tabs:
- [ ] BaseTabs komponens létrehozva
- [ ] DocumentsListPage-ben tabs implementálva
- [ ] API hívás status paraméterrel
- [ ] Tab váltás működik

### Keresés Oldal:
- [ ] SearchPage komponens létrehozva
- [ ] Search form minden mezővel
- [ ] API integráció
- [ ] Results táblázat
- [ ] Bulk export (Excel, ZIP)
- [ ] Pagination

### Szállító Management:
- [ ] SuppliersPage létrehozva
- [ ] CRUD műveletek
- [ ] Aktív/inaktív toggle
- [ ] Modal form

### Loading & Skeletons:
- [ ] SkeletonLoader komponens
- [ ] Minden táblázatnál használva
- [ ] Loading states

### Error Boundaries:
- [ ] ErrorBoundary komponens
- [ ] App.vue-ban implementálva
- [ ] Error UI működik

---

## Tesztelési Útmutató

```bash
# TypeScript ellenőrzés
npm run type-check

# Dev szerver
npm run dev

# Build
npm run build
```

**Manuális tesztek:**
1. Workflow műveletek (advance, reject, delegate, finalize)
2. Státusz filter tabs váltása
3. Keresés különböző paraméterekkel
4. Excel/ZIP export
5. Szállító CRUD műveletek
6. Loading states
7. Error boundary (try/catch)
