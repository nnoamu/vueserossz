# User Groups Frontend Implementation - Cursor AI Guide

Ez a dokumentum a **felhasználói csoportok kezelés** frontend implementációjához ad útmutatót, ahol a **backend már teljesen kész van**.

---

## 📋 Áttekintés

### ✅ Backend Állapot (100% Kész)

**UserGroupsController** (`/api/user-groups`):
```csharp
// Csoportok kezelése
GET    /api/user-groups                      // Lista (szűrhető)
GET    /api/user-groups/{id}                 // Részletek tagokkal
POST   /api/user-groups                      // Létrehozás
PUT    /api/user-groups/{id}                 // Módosítás
DELETE /api/user-groups/{id}                 // Törlés

// Tagok kezelése
POST   /api/user-groups/{id}/members         // Tag hozzáadása
DELETE /api/user-groups/{id}/members/{userId} // Tag eltávolítása
GET    /api/user-groups/user/{userId}        // User összes csoportja
```

### ❌ Hiányzó Frontend

- **UserGroupsPage.vue** - Admin csoport kezelés oldal (teljes UI)
- Router frissítés: `/admin/user-groups` → UserGroupsPage.vue

### 📚 Használható Referencia

**SuppliersPage.vue** és **UsersPage.vue** (ha már megvan) - Ezek mintaként szolgálnak a táblázat kezeléshez, modal-okhoz, CRUD műveletekhez.

---

## 🎯 CURSOR PARANCSOK

Válaszd ki a neked megfelelő részletességi szintet:

---

## OPTION 1: Gyors Parancs (Tapasztalt fejlesztőknek)

```
Implementáld a UserGroupsPage.vue komponenst a SuppliersPage.vue/UsersPage.vue mintájára.

BACKEND ENDPOINTOK:
- Groups: GET/POST/PUT/DELETE /api/user-groups, /api/user-groups/{id}
- Members: POST/DELETE /api/user-groups/{id}/members
- Filters: ?companyId=1&groupType=Approver

USER GROUP DTO:
{
  name: string (required, max 100),
  description?: string (max 500),
  groupType?: string (max 50, pl. "Approver", "Accountant"),
  companyId: number (required),
  priority?: number (default: 0)
}

MEMBER DTO:
{
  userId: number (required),
  roleInGroup?: string (max 50, pl. "Lead", "Member"),
  priority?: number (default: 0)
}

RESPONSE (UserGroupDto):
{
  id, name, description, groupType, companyId, companyName,
  isActive, priority, roundRobinIndex, memberCount, createdAt,
  members: [{ id, userId, userName, userEmail, roleInGroup, priority, isActive, joinedAt, addedByName }]
}

UI KÖVETELMÉNYEK:

Csoportok táblázat:
- Oszlopok: Név, Leírás, Típus, Cég, Tagok száma, Státusz, Műveletek
- Search (név/leírás)
- Filter: Cég select, Típus select (Approver, Accountant, Manager)
- Create/Edit modal
- Delete confirmation
- Státusz badge (Aktív/Inaktív)

Tagok kezelése (külön modal vagy inline section):
- Táblázat: Név, Email, Szerepkör csoportban, Prioritás, Csatlakozás, Műveletek
- "Tag hozzáadása" gomb → User select dropdown
- "Tag eltávolítása" gomb confirmation-nel
- RoleInGroup input (inline vagy modal)

Frissítsd a routert:
- /admin/user-groups → UserGroupsPage.vue (requiresAdmin: true)

Használj: BaseTable, BaseCard, BaseModal, BaseButton, BaseInput, BaseSelect, ConfirmDialog, useToast, api
```

---

## OPTION 2: Részletes Parancs (Ajánlott)

```
Implementáld a felhasználói csoportok (User Groups) admin kezelő oldalt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 REFERENCIA FÁJLOK (már léteznek, használd mintának):
- GlosterIktato.API/GlosterIktato.Client/src/components/features/SuppliersPage.vue
- GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/UsersPage.vue (ha megvan)
- GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/CompaniesPage.vue (ha megvan)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1️⃣ USERGROUPSPAGE.VUE LÉTREHOZÁSA

📍 Elérési út:
GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/UserGroupsPage.vue

### Backend API Endpoints:

```typescript
// User Groups API
GET    /api/user-groups                      // Lista (szűrhető)
GET    /api/user-groups/{id}                 // Részletek tagokkal
POST   /api/user-groups                      // Létrehozás
PUT    /api/user-groups/{id}                 // Módosítás
DELETE /api/user-groups/{id}                 // Törlés (tagok is törlődnek!)

// Members API
POST   /api/user-groups/{id}/members         // Tag hozzáadása
DELETE /api/user-groups/{id}/members/{userId} // Tag eltávolítása
GET    /api/user-groups/user/{userId}        // User összes csoportja

// Helper endpoints
GET /api/companies                            // Cégek listája (filter-hez)
GET /api/users                                // Userek listája (member select-hez)
```

### DTO Struktúrák:

**CreateUserGroupDto:**
```typescript
interface CreateUserGroupDto {
  name: string;              // Required, max 100 char
  description?: string;      // Optional, max 500 char
  groupType?: string;        // Optional, max 50 char ("Approver", "ElevatedApprover", "Accountant", "Manager")
  companyId: number;         // Required, > 0
  priority?: number;         // Optional, >= 0, default: 0
}
```

**UpdateUserGroupDto:**
```typescript
interface UpdateUserGroupDto {
  name: string;              // Required, max 100 char
  description?: string;      // Optional
  groupType?: string;        // Optional
  priority?: number;         // Optional, >= 0
  isActive: boolean;         // Default: true
}
```

**UserGroupDto (Response):**
```typescript
interface UserGroupDto {
  id: number;
  name: string;
  description?: string;
  groupType?: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  priority: number;
  roundRobinIndex: number;
  memberCount: number;
  createdAt: string;
  members: UserGroupMemberDto[];
}
```

**UserGroupListDto (Lista nézethez):**
```typescript
interface UserGroupListDto {
  id: number;
  name: string;
  description?: string;
  groupType?: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  priority: number;
  memberCount: number;
}
```

**AddUserGroupMemberDto:**
```typescript
interface AddUserGroupMemberDto {
  userId: number;            // Required, > 0
  roleInGroup?: string;      // Optional, max 50 char ("Lead", "Member", "Backup")
  priority?: number;         // Optional, >= 0, default: 0
}
```

**UserGroupMemberDto:**
```typescript
interface UserGroupMemberDto {
  id: number;
  userGroupId: number;
  userId: number;
  userName: string;          // FirstName + LastName
  userEmail: string;
  roleInGroup?: string;
  priority: number;
  isActive: boolean;
  joinedAt: string;
  addedByUserId?: number;
  addedByName?: string;
}
```

### Komponens Követelmények:

#### **1. Fő Táblázat - Csoportok listája**

**Oszlopok:**
- Név
- Leírás
- Típus (badge, pl. "Approver")
- Cég
- Tagok száma (badge)
- Státusz (Aktív/Inaktív badge)
- Műveletek (Szerkesztés, Tagok, Törlés gombok)

**Szűrők:**
```vue
<div class="flex gap-4 mb-4">
  <!-- Search input -->
  <BaseInput
    v-model="searchQuery"
    placeholder="Keresés név vagy leírás alapján..."
    icon="search"
  />

  <!-- Cég filter -->
  <BaseSelect v-model="filterCompanyId" label="Cég">
    <option :value="null">Összes cég</option>
    <option v-for="company in companies" :key="company.id" :value="company.id">
      {{ company.name }}
    </option>
  </BaseSelect>

  <!-- Típus filter -->
  <BaseSelect v-model="filterGroupType" label="Típus">
    <option :value="null">Összes típus</option>
    <option value="Approver">Approver</option>
    <option value="ElevatedApprover">Elevated Approver</option>
    <option value="Accountant">Accountant</option>
    <option value="Manager">Manager</option>
  </BaseSelect>
</div>
```

**Filtered lista:**
```typescript
const filteredGroups = computed(() => {
  let result = groups.value;

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(g =>
      g.name.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query)
    );
  }

  // Company filter
  if (filterCompanyId.value) {
    result = result.filter(g => g.companyId === filterCompanyId.value);
  }

  // Type filter
  if (filterGroupType.value) {
    result = result.filter(g => g.groupType === filterGroupType.value);
  }

  return result;
});
```

**Badge-ek:**
```vue
<!-- Típus badge -->
<span
  v-if="group.groupType"
  class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
>
  {{ group.groupType }}
</span>

<!-- Tagok száma badge -->
<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
  {{ group.memberCount }} fő
</span>

<!-- Státusz badge -->
<span
  v-if="group.isActive"
  class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
>
  Aktív
</span>
<span v-else class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
  Inaktív
</span>
```

#### **2. Create/Edit Csoport Modal**

**Create Modal mezők:**
```vue
<BaseModal v-model="showGroupModal" :title="isEditMode ? 'Csoport szerkesztése' : 'Új csoport létrehozása'">
  <form @submit.prevent="handleSaveGroup">
    <BaseInput
      v-model="groupForm.name"
      label="Csoport neve"
      required
      :maxlength="100"
      placeholder="pl. Finance Approvers"
    />

    <BaseInput
      v-model="groupForm.description"
      label="Leírás"
      type="textarea"
      :maxlength="500"
      placeholder="Opcionális leírás..."
    />

    <BaseSelect v-model="groupForm.groupType" label="Típus">
      <option value="">Nincs megadva</option>
      <option value="Approver">Approver</option>
      <option value="ElevatedApprover">Elevated Approver</option>
      <option value="Accountant">Accountant</option>
      <option value="Manager">Manager</option>
    </BaseSelect>

    <BaseSelect v-model="groupForm.companyId" label="Cég" required>
      <option :value="null">Válassz céget...</option>
      <option v-for="company in companies" :key="company.id" :value="company.id">
        {{ company.name }}
      </option>
    </BaseSelect>

    <BaseInput
      v-model.number="groupForm.priority"
      label="Prioritás"
      type="number"
      min="0"
      placeholder="0 = legmagasabb"
    />

    <div v-if="isEditMode" class="flex items-center">
      <input
        type="checkbox"
        v-model="groupForm.isActive"
        id="isActive"
        class="mr-2"
      />
      <label for="isActive">Aktív csoport</label>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="closeGroupModal">Mégse</BaseButton>
      <BaseButton type="submit" :loading="isSaving">
        {{ isEditMode ? 'Mentés' : 'Létrehozás' }}
      </BaseButton>
    </template>
  </form>
</BaseModal>
```

**Form kezelés:**
```typescript
const groupForm = ref({
  name: '',
  description: '',
  groupType: '',
  companyId: null as number | null,
  priority: 0,
  isActive: true
});

const isEditMode = ref(false);
const selectedGroup = ref<UserGroupDto | null>(null);

function openCreateModal() {
  groupForm.value = {
    name: '',
    description: '',
    groupType: '',
    companyId: null,
    priority: 0,
    isActive: true
  };
  isEditMode.value = false;
  showGroupModal.value = true;
}

function openEditModal(group: UserGroupDto) {
  selectedGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    groupType: group.groupType || '',
    companyId: group.companyId,
    priority: group.priority,
    isActive: group.isActive
  };
  isEditMode.value = true;
  showGroupModal.value = true;
}

async function handleSaveGroup() {
  isSaving.value = true;
  try {
    if (isEditMode.value && selectedGroup.value) {
      // Update
      await api.put(`/user-groups/${selectedGroup.value.id}`, groupForm.value);
      success('Csoport sikeresen frissítve');
    } else {
      // Create
      await api.post('/user-groups', groupForm.value);
      success('Csoport sikeresen létrehozva');
    }
    closeGroupModal();
    await fetchGroups();
  } catch (error: any) {
    toastError(error.response?.data?.message || 'Hiba történt');
  } finally {
    isSaving.value = false;
  }
}
```

#### **3. Delete Confirmation**

```vue
<ConfirmDialog
  v-model="showDeleteDialog"
  title="Csoport törlése"
  message="Biztosan törölni szeretnéd ezt a csoportot? A csoport összes tagja eltávolításra kerül!"
  confirm-text="Törlés"
  variant="danger"
  :loading="isDeleting"
  @confirm="handleDeleteConfirm"
/>
```

```typescript
const showDeleteDialog = ref(false);
const groupToDelete = ref<UserGroupDto | null>(null);

function openDeleteDialog(group: UserGroupDto) {
  groupToDelete.value = group;
  showDeleteDialog.value = true;
}

async function handleDeleteConfirm() {
  if (!groupToDelete.value) return;

  isDeleting.value = true;
  try {
    await api.delete(`/user-groups/${groupToDelete.value.id}`);
    success('Csoport sikeresen törölve');
    showDeleteDialog.value = false;
    await fetchGroups();
  } catch (error: any) {
    toastError(error.response?.data?.message || 'Hiba történt a törlés során');
  } finally {
    isDeleting.value = false;
  }
}
```

#### **4. Tagok Kezelése - Külön Modal**

**"Tagok" gomb a táblázatban:**
```vue
<BaseButton
  variant="secondary"
  size="sm"
  @click="openMembersModal(group)"
>
  <font-awesome-icon icon="users" class="mr-1" />
  Tagok ({{ group.memberCount }})
</BaseButton>
```

**Members Modal:**
```vue
<BaseModal
  v-model="showMembersModal"
  :title="`${selectedGroupForMembers?.name} - Tagok kezelése`"
  size="large"
>
  <!-- Tagok táblázat -->
  <div class="mb-4">
    <BaseButton @click="openAddMemberModal" size="sm">
      <font-awesome-icon icon="plus" class="mr-1" />
      Tag hozzáadása
    </BaseButton>
  </div>

  <BaseTable :columns="memberColumns" :data="currentMembers" :loading="loadingMembers">
    <template #userName="{ row }">
      <div>
        <div class="font-medium">{{ row.userName }}</div>
        <div class="text-xs text-gray-500">{{ row.userEmail }}</div>
      </div>
    </template>

    <template #roleInGroup="{ row }">
      <span
        v-if="row.roleInGroup"
        class="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800"
      >
        {{ row.roleInGroup }}
      </span>
      <span v-else class="text-gray-400">-</span>
    </template>

    <template #priority="{ row }">
      {{ row.priority }}
    </template>

    <template #joinedAt="{ row }">
      {{ formatDate(row.joinedAt) }}
    </template>

    <template #addedByName="{ row }">
      {{ row.addedByName || '-' }}
    </template>

    <template #actions="{ row }">
      <BaseButton
        variant="danger"
        size="sm"
        @click="openRemoveMemberDialog(row)"
      >
        Eltávolítás
      </BaseButton>
    </template>
  </BaseTable>
</BaseModal>
```

**Members betöltése:**
```typescript
const showMembersModal = ref(false);
const selectedGroupForMembers = ref<UserGroupDto | null>(null);
const currentMembers = ref<UserGroupMemberDto[]>([]);
const loadingMembers = ref(false);

async function openMembersModal(group: UserGroupDto) {
  selectedGroupForMembers.value = group;
  loadingMembers.value = true;
  showMembersModal.value = true;

  try {
    // Fetch részletes adatok (tagokkal)
    const response = await api.get(`/user-groups/${group.id}`);
    currentMembers.value = response.data.members || [];
  } catch (error) {
    toastError('Hiba történt a tagok betöltése során');
  } finally {
    loadingMembers.value = false;
  }
}

const memberColumns = [
  { key: 'userName', label: 'Név / Email' },
  { key: 'roleInGroup', label: 'Szerepkör' },
  { key: 'priority', label: 'Prioritás' },
  { key: 'joinedAt', label: 'Csatlakozás' },
  { key: 'addedByName', label: 'Hozzáadta' },
  { key: 'actions', label: 'Műveletek' }
];
```

#### **5. Tag Hozzáadása Modal**

```vue
<BaseModal v-model="showAddMemberModal" title="Tag hozzáadása">
  <form @submit.prevent="handleAddMember">
    <BaseSelect v-model="memberForm.userId" label="Felhasználó" required>
      <option :value="null">Válassz felhasználót...</option>
      <option v-for="user in availableUsers" :key="user.id" :value="user.id">
        {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
      </option>
    </BaseSelect>

    <BaseInput
      v-model="memberForm.roleInGroup"
      label="Szerepkör csoportban"
      placeholder="pl. Lead, Member, Backup"
      :maxlength="50"
    />

    <BaseInput
      v-model.number="memberForm.priority"
      label="Prioritás"
      type="number"
      min="0"
      placeholder="0 = legmagasabb"
    />

    <template #footer>
      <BaseButton variant="secondary" @click="showAddMemberModal = false">Mégse</BaseButton>
      <BaseButton type="submit" :loading="isAddingMember">Hozzáadás</BaseButton>
    </template>
  </form>
</BaseModal>
```

**Tag hozzáadása logika:**
```typescript
const showAddMemberModal = ref(false);
const memberForm = ref({
  userId: null as number | null,
  roleInGroup: '',
  priority: 0
});
const availableUsers = ref<any[]>([]);
const isAddingMember = ref(false);

async function openAddMemberModal() {
  // Fetch összes user (ha még nincs betöltve)
  if (availableUsers.value.length === 0) {
    try {
      const response = await api.get('/users');
      availableUsers.value = response.data;
    } catch (error) {
      toastError('Hiba történt a felhasználók betöltése során');
      return;
    }
  }

  memberForm.value = {
    userId: null,
    roleInGroup: '',
    priority: 0
  };
  showAddMemberModal.value = true;
}

async function handleAddMember() {
  if (!selectedGroupForMembers.value || !memberForm.value.userId) return;

  isAddingMember.value = true;
  try {
    await api.post(
      `/user-groups/${selectedGroupForMembers.value.id}/members`,
      memberForm.value
    );
    success('Tag sikeresen hozzáadva');
    showAddMemberModal.value = false;

    // Frissítsd a tagok listáját
    await openMembersModal(selectedGroupForMembers.value);
    await fetchGroups(); // Frissítsd a memberCount-ot
  } catch (error: any) {
    toastError(error.response?.data?.message || 'Hiba történt');
  } finally {
    isAddingMember.value = false;
  }
}
```

#### **6. Tag Eltávolítása**

```vue
<ConfirmDialog
  v-model="showRemoveMemberDialog"
  title="Tag eltávolítása"
  :message="`Biztosan eltávolítod ${memberToRemove?.userName} felhasználót a csoportból?`"
  confirm-text="Eltávolítás"
  variant="danger"
  :loading="isRemovingMember"
  @confirm="handleRemoveMemberConfirm"
/>
```

```typescript
const showRemoveMemberDialog = ref(false);
const memberToRemove = ref<UserGroupMemberDto | null>(null);
const isRemovingMember = ref(false);

function openRemoveMemberDialog(member: UserGroupMemberDto) {
  memberToRemove.value = member;
  showRemoveMemberDialog.value = true;
}

async function handleRemoveMemberConfirm() {
  if (!selectedGroupForMembers.value || !memberToRemove.value) return;

  isRemovingMember.value = true;
  try {
    await api.delete(
      `/user-groups/${selectedGroupForMembers.value.id}/members/${memberToRemove.value.userId}`
    );
    success('Tag sikeresen eltávolítva');
    showRemoveMemberDialog.value = false;

    // Frissítsd a tagok listáját
    await openMembersModal(selectedGroupForMembers.value);
    await fetchGroups(); // Frissítsd a memberCount-ot
  } catch (error: any) {
    toastError(error.response?.data?.message || 'Hiba történt');
  } finally {
    isRemovingMember.value = false;
  }
}
```

### Használandó Composable-ök és Utilities:
```typescript
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import api from '@/services/api';
import { formatDate } from '@/utils/date.utils';

// Base components
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseSelect from '@/components/base/BaseSelect.vue';
import BaseModal from '@/components/base/BaseModal.vue';
import ConfirmDialog from '@/components/base/ConfirmDialog.vue';
```

### Teljes Component Vázlat:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
// ... imports

const { success, error: toastError } = useToast();

// State
const groups = ref<UserGroupListDto[]>([]);
const companies = ref<any[]>([]);
const isLoading = ref(false);

// Filters
const searchQuery = ref('');
const filterCompanyId = ref<number | null>(null);
const filterGroupType = ref<string | null>(null);

// Group modal
const showGroupModal = ref(false);
const groupForm = ref({ ... });
const isEditMode = ref(false);
const selectedGroup = ref<UserGroupDto | null>(null);
const isSaving = ref(false);

// Delete
const showDeleteDialog = ref(false);
const groupToDelete = ref<UserGroupDto | null>(null);
const isDeleting = ref(false);

// Members modal
const showMembersModal = ref(false);
const selectedGroupForMembers = ref<UserGroupDto | null>(null);
const currentMembers = ref<UserGroupMemberDto[]>([]);
const loadingMembers = ref(false);

// Add member
const showAddMemberModal = ref(false);
const memberForm = ref({ ... });
const availableUsers = ref<any[]>([]);
const isAddingMember = ref(false);

// Remove member
const showRemoveMemberDialog = ref(false);
const memberToRemove = ref<UserGroupMemberDto | null>(null);
const isRemovingMember = ref(false);

// Computed
const filteredGroups = computed(() => { ... });

// Methods
async function fetchGroups() { ... }
async function fetchCompanies() { ... }
function openCreateModal() { ... }
function openEditModal(group) { ... }
async function handleSaveGroup() { ... }
function openDeleteDialog(group) { ... }
async function handleDeleteConfirm() { ... }
async function openMembersModal(group) { ... }
async function openAddMemberModal() { ... }
async function handleAddMember() { ... }
function openRemoveMemberDialog(member) { ... }
async function handleRemoveMemberConfirm() { ... }

onMounted(async () => {
  await Promise.all([fetchGroups(), fetchCompanies()]);
});

const columns = [
  { key: 'name', label: 'Név' },
  { key: 'description', label: 'Leírás' },
  { key: 'groupType', label: 'Típus' },
  { key: 'companyName', label: 'Cég' },
  { key: 'memberCount', label: 'Tagok' },
  { key: 'isActive', label: 'Státusz' },
  { key: 'actions', label: 'Műveletek' }
];
</script>

<template>
  <AppLayout>
    <BaseCard title="Felhasználói Csoportok">
      <!-- Filters + Create button -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex gap-4">
          <BaseInput v-model="searchQuery" placeholder="Keresés..." />
          <BaseSelect v-model="filterCompanyId" label="Cég">...</BaseSelect>
          <BaseSelect v-model="filterGroupType" label="Típus">...</BaseSelect>
        </div>
        <BaseButton @click="openCreateModal">
          <font-awesome-icon icon="plus" class="mr-2" />
          Új csoport
        </BaseButton>
      </div>

      <!-- Table -->
      <BaseTable :columns="columns" :data="filteredGroups" :loading="isLoading">
        <!-- ... template slots ... -->
      </BaseTable>
    </BaseCard>

    <!-- Modals -->
    <BaseModal v-model="showGroupModal">...</BaseModal>
    <ConfirmDialog v-model="showDeleteDialog">...</ConfirmDialog>
    <BaseModal v-model="showMembersModal">...</BaseModal>
    <BaseModal v-model="showAddMemberModal">...</BaseModal>
    <ConfirmDialog v-model="showRemoveMemberDialog">...</ConfirmDialog>
  </AppLayout>
</template>
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2️⃣ TÍPUSOK DEFINIÁLÁSA

📍 Fájl: GlosterIktato.API/GlosterIktato.Client/src/types/admin.types.ts

Bővítsd a meglévő fájlt ezekkel a típusokkal:

```typescript
// User Group types
export interface UserGroupListDto {
  id: number;
  name: string;
  description?: string;
  groupType?: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  priority: number;
  memberCount: number;
}

export interface UserGroupDto extends UserGroupListDto {
  roundRobinIndex: number;
  createdAt: string;
  members: UserGroupMemberDto[];
}

export interface CreateUserGroupDto {
  name: string;
  description?: string;
  groupType?: string;
  companyId: number;
  priority?: number;
}

export interface UpdateUserGroupDto {
  name: string;
  description?: string;
  groupType?: string;
  priority?: number;
  isActive: boolean;
}

export interface UserGroupMemberDto {
  id: number;
  userGroupId: number;
  userId: number;
  userName: string;
  userEmail: string;
  roleInGroup?: string;
  priority: number;
  isActive: boolean;
  joinedAt: string;
  addedByUserId?: number;
  addedByName?: string;
}

export interface AddUserGroupMemberDto {
  userId: number;
  roleInGroup?: string;
  priority?: number;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3️⃣ ROUTER FRISSÍTÉSE

📍 Fájl: GlosterIktato.API/GlosterIktato.Client/src/router/index.ts

Frissítsd a létező placeholder route-ot:

```typescript
import UserGroupsPage from '@/components/features/admin/UserGroupsPage.vue';

// Létező route frissítése
{
  path: '/admin/user-groups',
  name: 'admin-user-groups',
  component: UserGroupsPage,  // ← Ez volt LandingPage, cseréld ki!
  meta: {
    requiresAuth: true,
    requiresAdmin: true,
    title: 'Felhasználói Csoportok'
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4️⃣ NAVIGÁCIÓ FRISSÍTÉSE (Opcionális)

📍 Fájl: GlosterIktato.API/GlosterIktato.Client/src/components/layout/SideNav.vue

Ha még nincs link a felhasználói csoportokhoz:

```vue
<router-link
  to="/admin/user-groups"
  class="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
  active-class="bg-blue-50 text-blue-600 border-r-2 border-blue-600"
>
  <font-awesome-icon icon="users-cog" class="w-5 h-5 mr-3" />
  <span>Felhasználói Csoportok</span>
</router-link>
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ ELLENŐRZŐ LISTA

UserGroupsPage.vue:
- [ ] Csoportok táblázata (név, leírás, típus, cég, tagok száma, státusz)
- [ ] Search input (név/leírás szűrés)
- [ ] Cég filter dropdown
- [ ] Típus filter dropdown (Approver, Accountant, stb.)
- [ ] "Új csoport" gomb
- [ ] Create modal (név, leírás, típus, cég, prioritás)
- [ ] Edit modal (ugyanaz + isActive checkbox)
- [ ] Delete confirmation dialog
- [ ] Badge-ek (típus, tagok száma, státusz)
- [ ] "Tagok" gomb minden sornál
- [ ] Members modal:
  - [ ] Tagok táblázata (név, email, szerepkör, prioritás, csatlakozás, hozzáadta)
  - [ ] "Tag hozzáadása" gomb
  - [ ] "Tag eltávolítása" gomb minden tagnál
- [ ] Add member modal (user select, szerepkör, prioritás)
- [ ] Remove member confirmation
- [ ] Loading states (skeleton/spinner)
- [ ] Error handling (toast notifications)
- [ ] API calls: GET/POST/PUT/DELETE /user-groups + members endpoints

Router:
- [ ] /admin/user-groups → UserGroupsPage.vue
- [ ] requiresAdmin: true meta

Types:
- [ ] admin.types.ts bővítve UserGroup típusokkal

Navigáció (opcionális):
- [ ] Link a SideNav-ban admin szekcióban

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 DESIGN KÖVETELMÉNYEK

1. **Konzisztencia:** Használd ugyanazt a design rendszert mint SuppliersPage/UsersPage
2. **Tailwind CSS:** Utility classes
3. **Responsive:** Mobile-friendly
4. **Badge színek:**
   - Típus: `bg-purple-100 text-purple-800`
   - Tagok száma: `bg-blue-100 text-blue-800`
   - Aktív: `bg-green-100 text-green-800`
   - Inaktív: `bg-gray-100 text-gray-800`
   - RoleInGroup: `bg-indigo-100 text-indigo-800`
5. **Loading states:** SkeletonLoader vagy spinner
6. **Toast notifications:** useToast composable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚀 TESZTELÉS

Miután kész vagy:

1. **Csoportok CRUD:**
   - [ ] Lista betöltődik
   - [ ] Search működik (név/leírás)
   - [ ] Cég filter működik
   - [ ] Típus filter működik
   - [ ] Create működik (új csoport megjelenik)
   - [ ] Edit működik (módosítások mentődnek)
   - [ ] Delete működik (csoport törlődik)
   - [ ] IsActive toggle működik
   - [ ] Validation működik (név required, companyId required)

2. **Tagok kezelése:**
   - [ ] "Tagok" gomb megnyitja a members modal-t
   - [ ] Tagok listája betöltődik
   - [ ] "Tag hozzáadása" működik
   - [ ] Tag eltávolítása működik
   - [ ] RoleInGroup megjelenik
   - [ ] Priority megjelenik
   - [ ] MemberCount frissül a táblázatban

3. **Edge cases:**
   - [ ] Csoport törléskor tagok is eltávolításra kerülnek
   - [ ] Nem lehet ugyanazt a usert kétszer hozzáadni
   - [ ] Nem lehet ugyanolyan nevű csoportot létrehozni egy cégnél

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💡 TIPPEK

1. **Kezdd a SuppliersPage.vue másolásával** - ugyanaz a struktúra
2. **Members modal lehet összetett** - külön modal egyszerűbb mint inline table
3. **User select:** Használj BaseSelect vagy implementálj autocomplete-et nagy user listák esetén
4. **Priority:** Lehet inline szerkeszthető, de egyszerűbb csak tag törlés + újra hozzáadás
5. **API error handling:** A backend pontos hibaüzeneteket ad vissza
6. **TypeScript:** Definiálj minden DTO-t a types fájlban

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEZDD EL ÉS LÉPÉSRŐL LÉPÉSRE HALADJ!
```

---

## OPTION 3: Lépésről Lépésre (Kezdőknek)

```
Hozd létre a felhasználói csoportok kezelő oldalt lépésről lépésre.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 1: ALAPOLDAL - Csoportok táblázat search/filter nélkül
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.1 Másold le a SuppliersPage.vue fájlt
    - Forrás: GlosterIktato.API/GlosterIktato.Client/src/components/features/SuppliersPage.vue
    - Cél: GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/UserGroupsPage.vue

1.2 Cseréld ki:
    - "supplier" → "group" (minden előfordulást)
    - "Supplier" → "UserGroup"
    - "Szállító" → "Csoport"
    - "Szállítók" → "Csoportok"

1.3 Táblázat oszlopok:
    ```typescript
    const columns = [
      { key: 'name', label: 'Név' },
      { key: 'description', label: 'Leírás' },
      { key: 'groupType', label: 'Típus' },
      { key: 'companyName', label: 'Cég' },
      { key: 'memberCount', label: 'Tagok' },
      { key: 'isActive', label: 'Státusz' },
      { key: 'actions', label: 'Műveletek' }
    ];
    ```

1.4 API endpoint cserék:
    - `/api/suppliers` → `/api/user-groups`

1.5 Form mezők (egyszerűsített):
    ```typescript
    const form = ref({
      name: '',
      description: '',
      groupType: '',
      companyId: null,
      priority: 0,
      isActive: true
    });
    ```

TESZTELD: Működik a lista megjelenítés?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 2: CREATE/EDIT MODAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 Modal mezők template:
    - Name input (required)
    - Description textarea (optional)
    - GroupType select (Approver, Accountant, Manager)
    - Company select (fetch from /api/companies)
    - Priority input (number, default: 0)
    - IsActive checkbox (csak edit módban)

2.2 Companies betöltése:
    ```typescript
    const companies = ref([]);

    async function fetchCompanies() {
      const response = await api.get('/companies');
      companies.value = response.data;
    }

    onMounted(() => {
      fetchGroups();
      fetchCompanies();
    });
    ```

TESZTELD: Működik a create és edit?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 3: SEARCH ÉS FILTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 State hozzáadása:
    ```typescript
    const searchQuery = ref('');
    const filterCompanyId = ref(null);
    const filterGroupType = ref(null);
    ```

3.2 Computed filtered list:
    ```typescript
    const filteredGroups = computed(() => {
      let result = groups.value;

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(g =>
          g.name.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q)
        );
      }

      if (filterCompanyId.value) {
        result = result.filter(g => g.companyId === filterCompanyId.value);
      }

      if (filterGroupType.value) {
        result = result.filter(g => g.groupType === filterGroupType.value);
      }

      return result;
    });
    ```

3.3 Template filter inputs:
    ```vue
    <div class="flex gap-4 mb-4">
      <BaseInput v-model="searchQuery" placeholder="Keresés..." />
      <BaseSelect v-model="filterCompanyId" label="Cég">
        <option :value="null">Összes</option>
        <option v-for="c in companies" :value="c.id">{{ c.name }}</option>
      </BaseSelect>
      <BaseSelect v-model="filterGroupType" label="Típus">
        <option :value="null">Összes</option>
        <option value="Approver">Approver</option>
        <option value="Accountant">Accountant</option>
      </BaseSelect>
    </div>
    ```

TESZTELD: Működnek a szűrők?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 4: BADGE-EK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 Template slot-ok a táblázatban:
    ```vue
    <template #groupType="{ row }">
      <span v-if="row.groupType" class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
        {{ row.groupType }}
      </span>
    </template>

    <template #memberCount="{ row }">
      <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
        {{ row.memberCount }} fő
      </span>
    </template>

    <template #isActive="{ row }">
      <span v-if="row.isActive" class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        Aktív
      </span>
      <span v-else class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        Inaktív
      </span>
    </template>
    ```

TESZTELD: Badge-ek megjelennek?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 5: MEMBERS MODAL - Tagok megjelenítése
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.1 "Tagok" gomb hozzáadása a táblázathoz:
    ```vue
    <template #actions="{ row }">
      <div class="flex gap-2">
        <BaseButton size="sm" variant="secondary" @click="openMembersModal(row)">
          <font-awesome-icon icon="users" class="mr-1" />
          Tagok ({{ row.memberCount }})
        </BaseButton>
        <BaseButton size="sm" @click="openEditModal(row)">Szerkesztés</BaseButton>
        <BaseButton size="sm" variant="danger" @click="openDeleteDialog(row)">Törlés</BaseButton>
      </div>
    </template>
    ```

5.2 Members modal state:
    ```typescript
    const showMembersModal = ref(false);
    const selectedGroupForMembers = ref(null);
    const currentMembers = ref([]);
    const loadingMembers = ref(false);
    ```

5.3 Members modal megnyitása:
    ```typescript
    async function openMembersModal(group) {
      selectedGroupForMembers.value = group;
      loadingMembers.value = true;
      showMembersModal.value = true;

      try {
        const response = await api.get(`/user-groups/${group.id}`);
        currentMembers.value = response.data.members || [];
      } catch (error) {
        toastError('Hiba a tagok betöltése során');
      } finally {
        loadingMembers.value = false;
      }
    }
    ```

5.4 Members modal template:
    ```vue
    <BaseModal v-model="showMembersModal" :title="`${selectedGroupForMembers?.name} - Tagok`" size="large">
      <BaseTable :columns="memberColumns" :data="currentMembers" :loading="loadingMembers">
        <!-- ... slots ... -->
      </BaseTable>
    </BaseModal>
    ```

5.5 Member columns:
    ```typescript
    const memberColumns = [
      { key: 'userName', label: 'Név' },
      { key: 'userEmail', label: 'Email' },
      { key: 'roleInGroup', label: 'Szerepkör' },
      { key: 'priority', label: 'Prioritás' },
      { key: 'joinedAt', label: 'Csatlakozás' },
      { key: 'actions', label: 'Műveletek' }
    ];
    ```

TESZTELD: Members modal megnyílik és tagok látszanak?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 6: TAG HOZZÁADÁSA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6.1 "Tag hozzáadása" gomb a members modal-ban:
    ```vue
    <div class="mb-4">
      <BaseButton @click="openAddMemberModal" size="sm">
        <font-awesome-icon icon="plus" class="mr-1" />
        Tag hozzáadása
      </BaseButton>
    </div>
    ```

6.2 Add member state:
    ```typescript
    const showAddMemberModal = ref(false);
    const memberForm = ref({
      userId: null,
      roleInGroup: '',
      priority: 0
    });
    const availableUsers = ref([]);
    const isAddingMember = ref(false);
    ```

6.3 Users betöltése:
    ```typescript
    async function openAddMemberModal() {
      if (availableUsers.value.length === 0) {
        const response = await api.get('/users');
        availableUsers.value = response.data;
      }

      memberForm.value = { userId: null, roleInGroup: '', priority: 0 };
      showAddMemberModal.value = true;
    }
    ```

6.4 Tag hozzáadása:
    ```typescript
    async function handleAddMember() {
      isAddingMember.value = true;
      try {
        await api.post(
          `/user-groups/${selectedGroupForMembers.value.id}/members`,
          memberForm.value
        );
        success('Tag hozzáadva');
        showAddMemberModal.value = false;
        await openMembersModal(selectedGroupForMembers.value);
        await fetchGroups();
      } catch (error) {
        toastError(error.response?.data?.message);
      } finally {
        isAddingMember.value = false;
      }
    }
    ```

6.5 Add member modal template:
    ```vue
    <BaseModal v-model="showAddMemberModal" title="Tag hozzáadása">
      <form @submit.prevent="handleAddMember">
        <BaseSelect v-model="memberForm.userId" label="Felhasználó" required>
          <option :value="null">Válassz...</option>
          <option v-for="u in availableUsers" :value="u.id">
            {{ u.firstName }} {{ u.lastName }} ({{ u.email }})
          </option>
        </BaseSelect>

        <BaseInput v-model="memberForm.roleInGroup" label="Szerepkör" placeholder="pl. Lead" />
        <BaseInput v-model.number="memberForm.priority" label="Prioritás" type="number" />

        <template #footer>
          <BaseButton variant="secondary" @click="showAddMemberModal = false">Mégse</BaseButton>
          <BaseButton type="submit" :loading="isAddingMember">Hozzáadás</BaseButton>
        </template>
      </form>
    </BaseModal>
    ```

TESZTELD: Tag hozzáadása működik?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 7: TAG ELTÁVOLÍTÁSA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7.1 "Eltávolítás" gomb a members táblázatban:
    ```vue
    <template #actions="{ row }">
      <BaseButton variant="danger" size="sm" @click="openRemoveMemberDialog(row)">
        Eltávolítás
      </BaseButton>
    </template>
    ```

7.2 Remove member state:
    ```typescript
    const showRemoveMemberDialog = ref(false);
    const memberToRemove = ref(null);
    const isRemovingMember = ref(false);
    ```

7.3 Remove confirmation:
    ```typescript
    function openRemoveMemberDialog(member) {
      memberToRemove.value = member;
      showRemoveMemberDialog.value = true;
    }

    async function handleRemoveMemberConfirm() {
      isRemovingMember.value = true;
      try {
        await api.delete(
          `/user-groups/${selectedGroupForMembers.value.id}/members/${memberToRemove.value.userId}`
        );
        success('Tag eltávolítva');
        showRemoveMemberDialog.value = false;
        await openMembersModal(selectedGroupForMembers.value);
        await fetchGroups();
      } catch (error) {
        toastError(error.response?.data?.message);
      } finally {
        isRemovingMember.value = false;
      }
    }
    ```

7.4 Template:
    ```vue
    <ConfirmDialog
      v-model="showRemoveMemberDialog"
      title="Tag eltávolítása"
      :message="`Eltávolítod ${memberToRemove?.userName} felhasználót?`"
      confirm-text="Eltávolítás"
      variant="danger"
      :loading="isRemovingMember"
      @confirm="handleRemoveMemberConfirm"
    />
    ```

TESZTELD: Tag eltávolítása működik?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 8: ROUTER ÉS TÍPUSOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8.1 Router frissítés (router/index.ts):
    ```typescript
    import UserGroupsPage from '@/components/features/admin/UserGroupsPage.vue';

    {
      path: '/admin/user-groups',
      name: 'admin-user-groups',
      component: UserGroupsPage,
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Felhasználói Csoportok' }
    }
    ```

8.2 Típusok (types/admin.types.ts) - lásd OPTION 2 alatt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KÉSZ! VÉGSŐ TESZTELÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- [ ] /admin/user-groups - csoportlista betöltődik
- [ ] Search működik
- [ ] Filter (cég, típus) működik
- [ ] Create group működik
- [ ] Edit group működik
- [ ] Delete group működik
- [ ] "Tagok" gomb megnyitja members modal-t
- [ ] Tagok listája betöltődik
- [ ] Tag hozzáadása működik
- [ ] Tag eltávolítása működik
- [ ] Badge-ek megjelennek
- [ ] Toast értesítések működnek
- [ ] Loading states működnek

GRATULÁLOK, KÉSZ VAGY! 🎉
```

---

## 📊 Becsült Időszükséglet

- **Alapoldal (csoportok táblázat):** 30-45 perc
- **Create/Edit modal:** 30 perc
- **Search/Filter:** 20 perc
- **Members modal (csak megjelenítés):** 30 perc
- **Tag hozzáadása:** 30 perc
- **Tag eltávolítása:** 20 perc
- **Router + típusok:** 15 perc
- **Tesztelés:** 30 perc

**Összesen:** ~3-3.5 óra

---

## 🎯 Ajánlott Sorrend

1. ✅ Alapoldal táblázattal (LÉPÉS 1)
2. ✅ Create/Edit modal (LÉPÉS 2)
3. ✅ Delete funkció
4. ✅ Badge-ek (LÉPÉS 4)
5. ✅ Search/Filter (LÉPÉS 3)
6. ✅ Members modal megjelenítés (LÉPÉS 5)
7. ✅ Tag hozzáadása (LÉPÉS 6)
8. ✅ Tag eltávolítása (LÉPÉS 7)
9. ✅ Router + típusok (LÉPÉS 8)

---

## 🔑 Kulcs Különbségek vs. SuppliersPage

| Feature | SuppliersPage | UserGroupsPage |
|---------|---------------|----------------|
| Filter | Search only | Search + Cég + Típus |
| Badge-ek | Státusz | Státusz + Típus + Tagok száma |
| Extra funkció | - | **Members kezelés (külön modal)** |
| Mezők száma | 4 | 5 + Members |
| Bonyolultság | Egyszerű | Közepes (nested members) |

**A legnagyobb különbség:** Members kezelés egy külön modal-ban, nested CRUD műveletekkel (tag hozzáadás/eltávolítás).

---

**JAVASLAT:** Használd az **OPTION 2 (Részletes)** vagy **OPTION 3 (Lépésről lépésre)** verziót.

**Ha elakadsz**, nézd meg a `SuppliersPage.vue` és `UsersPage.vue` fájlokat referenciának!

Sok sikert! 🚀
