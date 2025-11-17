# Felhasználói Csoportok (User Groups) Implementációs Útmutató

**Backend:** ✅ 100% Kész
**Frontend:** ❌ Hiányzik
**Referenciák:** UsersPage.vue, CompaniesPage.vue, SuppliersPage.vue (mind implementálva)

---

## 🎯 Egyszerű Cursor Parancs

```
Implementáld a UserGroupsPage.vue komponenst a UsersPage.vue és CompaniesPage.vue mintájára.

ELÉRÉSI ÚT:
src/components/features/admin/UserGroupsPage.vue

REFERENCIA FÁJLOK (ezek már léteznek, másolj belőlük!):
- src/components/features/admin/UsersPage.vue (multi-select, modal kezelés)
- src/components/features/admin/CompaniesPage.vue (admin check, search)
- src/components/features/SuppliersPage.vue (egyszerű CRUD)

BACKEND API (teljes CRUD kész):
GET    /api/user-groups?companyId=1&groupType=Approver  // Lista szűrőkkel
GET    /api/user-groups/{id}                            // Részletek (tagokkal)
POST   /api/user-groups                                 // Létrehozás
PUT    /api/user-groups/{id}                            // Módosítás
DELETE /api/user-groups/{id}                            // Törlés (tagok is!)
POST   /api/user-groups/{id}/members                    // Tag hozzáadása
DELETE /api/user-groups/{id}/members/{userId}           // Tag eltávolítása

USERGROUP DTO:
CreateUserGroupDto: { name, description?, groupType?, companyId, priority? }
UpdateUserGroupDto: { name, description?, groupType?, priority?, isActive }
UserGroupDto (response): { id, name, description, groupType, companyId, companyName, isActive, priority, roundRobinIndex, memberCount, createdAt, members[] }
AddUserGroupMemberDto: { userId, roleInGroup?, priority? }

KOMPONENS FELÉPÍTÉS (UsersPage/CompaniesPage mintájára):

1. HEADER (BaseButton-nal):
   - Cím: "Felhasználói Csoportok"
   - "Új csoport" gomb (jobb felül)

2. FILTERS (BaseCard + BaseInput/BaseSelect):
   - Search input (név/leírás keresés)
   - Company filter select (GET /api/companies)
   - GroupType filter select (Approver, ElevatedApprover, Accountant, Manager, Custom)

3. TABLE (BaseTable + template slots):
   Oszlopok:
   - name
   - description (truncate ha hosszú)
   - groupType (badge: bg-purple-100 text-purple-800)
   - companyName
   - memberCount (badge: bg-blue-100 text-blue-800, pl. "5 fő")
   - isActive (badge: green=Aktív, gray=Inaktív)
   - actions (Tagok gomb + Szerkesztés + Törlés)

4. CREATE/EDIT MODAL (BaseModal):
   Mezők:
   - name (BaseInput, required)
   - description (BaseInput)
   - groupType (BaseSelect: "", Approver, ElevatedApprover, Accountant, Manager, Custom)
   - companyId (BaseSelect, required, fetch /api/companies)
   - priority (BaseInput type=number, default: 0)
   - isActive (checkbox, csak edit módban)

5. MEMBERS MODAL (külön BaseModal, "large" size):
   Trigger: "Tagok (X)" gomb az actions oszlopban
   Tartalom:
   - "Tag hozzáadása" gomb (megnyit egy újabb modal-t)
   - BaseTable a tagokkal:
     Oszlopok: userName, userEmail, roleInGroup, priority, joinedAt, actions (Eltávolítás)

6. ADD MEMBER MODAL (BaseModal):
   Mezők:
   - userId (BaseSelect, fetch /api/users)
   - roleInGroup (BaseInput, optional, pl. "Lead", "Member", "Backup")
   - priority (BaseInput type=number, default: 0)

7. DELETE CONFIRMATIONS:
   - Csoport törlés: "Biztosan törölni szeretnéd ezt a csoportot? Minden tag eltávolításra kerül!"
   - Tag eltávolítás: "Biztosan eltávolítod {userName} felhasználót?"

STATE VÁLTOZÓK (UsersPage mintájára):
```typescript
const groups = ref([]);
const companies = ref([]);
const searchQuery = ref('');
const filterCompanyId = ref(null);
const filterGroupType = ref(null);
const isLoading = ref(false);

// Group modal
const showCreateModal = ref(false);
const editingGroup = ref(null);
const groupForm = ref({
  name: '',
  description: '',
  groupType: '',
  companyId: null,
  priority: 0,
  isActive: true
});

// Members modal
const showMembersModal = ref(false);
const selectedGroup = ref(null);
const members = ref([]);
const loadingMembers = ref(false);

// Add member modal
const showAddMemberModal = ref(false);
const users = ref([]);
const memberForm = ref({
  userId: null,
  roleInGroup: '',
  priority: 0
});

// Delete
const showDeleteDialog = ref(false);
const deletingGroup = ref(null);
const showRemoveMemberDialog = ref(false);
const removingMember = ref(null);
```

COMPUTED:
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

const columns = [
  { key: 'name', label: 'Név' },
  { key: 'description', label: 'Leírás' },
  { key: 'groupType', label: 'Típus' },
  { key: 'companyName', label: 'Cég' },
  { key: 'memberCount', label: 'Tagok' },
  { key: 'isActive', label: 'Státusz' },
  { key: 'actions', label: 'Műveletek' }
];

const memberColumns = [
  { key: 'userName', label: 'Név' },
  { key: 'userEmail', label: 'Email' },
  { key: 'roleInGroup', label: 'Szerepkör' },
  { key: 'priority', label: 'Prioritás' },
  { key: 'joinedAt', label: 'Csatlakozás' },
  { key: 'actions', label: '' }
];
```

METHODS:
```typescript
async function fetchGroups() {
  isLoading.value = true;
  try {
    const params = {};
    if (filterCompanyId.value) params.companyId = filterCompanyId.value;
    if (filterGroupType.value) params.groupType = filterGroupType.value;

    const response = await api.get('/user-groups', { params });
    groups.value = response.data;
  } catch (error) {
    // toast error
  } finally {
    isLoading.value = false;
  }
}

async function fetchCompanies() {
  const response = await api.get('/companies');
  companies.value = response.data;
}

function editGroup(group) {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    groupType: group.groupType || '',
    companyId: group.companyId,
    priority: group.priority,
    isActive: group.isActive
  };
  showCreateModal.value = true;
}

async function saveGroup() {
  try {
    if (editingGroup.value) {
      await api.put(`/user-groups/${editingGroup.value.id}`, groupForm.value);
    } else {
      await api.post('/user-groups', groupForm.value);
    }
    showCreateModal.value = false;
    await fetchGroups();
  } catch (error) {
    // toast error
  }
}

async function confirmDelete(group) {
  deletingGroup.value = group;
  showDeleteDialog.value = true;
}

async function deleteGroup() {
  await api.delete(`/user-groups/${deletingGroup.value.id}`);
  showDeleteDialog.value = false;
  await fetchGroups();
}

async function openMembersModal(group) {
  selectedGroup.value = group;
  showMembersModal.value = true;
  loadingMembers.value = true;

  try {
    const response = await api.get(`/user-groups/${group.id}`);
    members.value = response.data.members || [];
  } finally {
    loadingMembers.value = false;
  }
}

async function openAddMemberModal() {
  if (users.value.length === 0) {
    const response = await api.get('/users');
    users.value = response.data;
  }

  memberForm.value = { userId: null, roleInGroup: '', priority: 0 };
  showAddMemberModal.value = true;
}

async function addMember() {
  await api.post(`/user-groups/${selectedGroup.value.id}/members`, memberForm.value);
  showAddMemberModal.value = false;
  await openMembersModal(selectedGroup.value);
  await fetchGroups(); // frissítsd memberCount-ot
}

async function confirmRemoveMember(member) {
  removingMember.value = member;
  showRemoveMemberDialog.value = true;
}

async function removeMember() {
  await api.delete(`/user-groups/${selectedGroup.value.id}/members/${removingMember.value.userId}`);
  showRemoveMemberDialog.value = false;
  await openMembersModal(selectedGroup.value);
  await fetchGroups(); // frissítsd memberCount-ot
}

onMounted(async () => {
  await fetchCompanies();
  await fetchGroups();
});
```

TEMPLATE SLOTS (BaseTable-ben):
```vue
<template #cell-groupType="{ row }">
  <span v-if="row.groupType" class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
    {{ row.groupType }}
  </span>
  <span v-else class="text-gray-400">-</span>
</template>

<template #cell-memberCount="{ row }">
  <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
    {{ row.memberCount }} fő
  </span>
</template>

<template #cell-isActive="{ row }">
  <span :class="[
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  ]">
    {{ row.isActive ? 'Aktív' : 'Inaktív' }}
  </span>
</template>

<template #cell-actions="{ row }">
  <div class="flex gap-2">
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'users']"
      @click="openMembersModal(row)"
    >
      Tagok ({{ row.memberCount }})
    </BaseButton>
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'edit']"
      @click="editGroup(row)"
    >
      Szerkesztés
    </BaseButton>
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'trash']"
      @click="confirmDelete(row)"
    >
      Törlés
    </BaseButton>
  </div>
</template>
```

ROUTER FRISSÍTÉS (src/router/index.ts):
```typescript
import UserGroupsPage from '@/components/features/admin/UserGroupsPage.vue';

// Frissítsd a létező route-ot:
{
  path: '/admin/user-groups',
  name: 'admin-user-groups',
  component: UserGroupsPage,  // volt: LandingPage
  meta: {
    requiresAuth: true,
    requiresAdmin: true,
    title: 'Felhasználói Csoportok'
  }
}
```

HASZNÁLD AZ ALÁBBI KOMPONENSEKET:
- AppLayout (layout wrapper)
- BaseCard (section wrapper)
- BaseButton (gombok, :left-icon prop-pal)
- BaseInput (input mezők)
- BaseSelect (select mezők, v-model-lel)
- BaseTable (:columns, :data, :loading props, template slots)
- BaseModal (v-model, :title, size prop)
- ConfirmDialog (törlésekhez)

BADGE SZÍNEK:
- GroupType: bg-purple-100 text-purple-800
- MemberCount: bg-blue-100 text-blue-800
- RoleInGroup: bg-indigo-100 text-indigo-800
- Aktív: bg-green-100 text-green-800
- Inaktív: bg-gray-100 text-gray-800

FONTOS TUDNIVALÓK:
1. BaseButton-nak :left-icon prop kell (pl. :left-icon="['fas', 'plus']")
2. BaseTable-nek template slots kell: #cell-{columnKey}="{ row }"
3. BaseModal-nak v-model kell (showCreateModal, showMembersModal, stb.)
4. API hívások try-catch-be, toast értesítésekkel
5. Members modal "large" size legyen
6. Csoport törlésekor a tagok is automatikusan törlődnek (cascade delete)
7. formatDate util használata a joinedAt dátumhoz (import { formatDate } from '@/utils/date.utils')

KEZDD AZ UsersPage.vue MÁSOLÁSÁVAL, aztán adaptáld!
```

---

## 📋 Részletes Lépésről Lépésre Útmutató

### LÉPÉS 1: Alapfájl létrehozása

1.1. Másold le a `UsersPage.vue` fájlt:
```bash
Forrás: src/components/features/admin/UsersPage.vue
Cél: src/components/features/admin/UserGroupsPage.vue
```

1.2. Cseréld ki globálisan:
- "user" → "group"
- "User" → "UserGroup"
- "Felhasználó" → "Csoport"
- "Felhasználók" → "Csoportok"

### LÉPÉS 2: Alapstruktúra (Header + Table)

2.1. **Header** (UsersPage mintájára):
```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900">Felhasználói Csoportok</h1>
        <BaseButton
          variant="primary"
          :left-icon="['fas', 'plus']"
          @click="showCreateModal = true"
        >
          Új csoport
        </BaseButton>
      </div>

      <!-- ... -->
    </div>
  </AppLayout>
</template>
```

2.2. **Oszlopok** definíciója:
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

### LÉPÉS 3: Filter-ek hozzáadása

3.1. **Search + Filters** (CompaniesPage search + új filter selectek):
```vue
<!-- Search & Filters -->
<BaseCard>
  <div class="flex gap-4">
    <!-- Search -->
    <div class="flex-1">
      <BaseInput
        v-model="searchQuery"
        placeholder="Keresés név vagy leírás alapján..."
      />
    </div>

    <!-- Company Filter -->
    <div class="w-64">
      <BaseSelect v-model="filterCompanyId" label="Cég">
        <option :value="null">Összes cég</option>
        <option v-for="company in companies" :key="company.id" :value="company.id">
          {{ company.name }}
        </option>
      </BaseSelect>
    </div>

    <!-- GroupType Filter -->
    <div class="w-64">
      <BaseSelect v-model="filterGroupType" label="Típus">
        <option :value="null">Összes típus</option>
        <option value="Approver">Approver</option>
        <option value="ElevatedApprover">Elevated Approver</option>
        <option value="Accountant">Accountant</option>
        <option value="Manager">Manager</option>
        <option value="Custom">Egyedi</option>
      </BaseSelect>
    </div>
  </div>
</BaseCard>
```

3.2. **Filtered computed** property:
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

  // GroupType filter
  if (filterGroupType.value) {
    result = result.filter(g => g.groupType === filterGroupType.value);
  }

  return result;
});
```

### LÉPÉS 4: Badge-ek (Template Slots)

4.1. **GroupType badge** (lila):
```vue
<template #cell-groupType="{ row }">
  <span
    v-if="row.groupType"
    class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
  >
    {{ row.groupType }}
  </span>
  <span v-else class="text-sm text-gray-400">-</span>
</template>
```

4.2. **MemberCount badge** (kék):
```vue
<template #cell-memberCount="{ row }">
  <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
    {{ row.memberCount }} fő
  </span>
</template>
```

4.3. **Status badge** (zöld/szürke) - UsersPage/CompaniesPage mintájára:
```vue
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
```

### LÉPÉS 5: Actions oszlop (Tagok + Szerkesztés + Törlés)

```vue
<template #cell-actions="{ row }">
  <div class="flex gap-2">
    <!-- Tagok gomb -->
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'users']"
      @click="openMembersModal(row)"
    >
      Tagok ({{ row.memberCount }})
    </BaseButton>

    <!-- Szerkesztés -->
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'edit']"
      @click="editGroup(row)"
    >
      Szerkesztés
    </BaseButton>

    <!-- Törlés -->
    <BaseButton
      variant="ghost"
      size="sm"
      :left-icon="['fas', 'trash']"
      @click="confirmDelete(row)"
    >
      Törlés
    </BaseButton>
  </div>
</template>
```

### LÉPÉS 6: Create/Edit Modal

6.1. **Modal template** (UsersPage mintájára):
```vue
<!-- Create/Edit Group Modal -->
<BaseModal
  v-model="showCreateModal"
  :title="editingGroup ? 'Csoport szerkesztése' : 'Új csoport'"
  size="md"
>
  <div class="space-y-4">
    <!-- Name -->
    <BaseInput
      v-model="groupForm.name"
      label="Csoport neve"
      placeholder="pl. Finance Approvers"
      required
      :error="errors.name"
    />

    <!-- Description -->
    <BaseInput
      v-model="groupForm.description"
      label="Leírás"
      placeholder="Opcionális leírás..."
      :error="errors.description"
    />

    <!-- GroupType -->
    <BaseSelect v-model="groupForm.groupType" label="Típus">
      <option value="">Nincs megadva</option>
      <option value="Approver">Approver</option>
      <option value="ElevatedApprover">Elevated Approver</option>
      <option value="Accountant">Accountant</option>
      <option value="Manager">Manager</option>
      <option value="Custom">Egyedi</option>
    </BaseSelect>

    <!-- Company -->
    <BaseSelect v-model="groupForm.companyId" label="Cég" required>
      <option :value="null">Válassz céget...</option>
      <option v-for="company in companies" :key="company.id" :value="company.id">
        {{ company.name }}
      </option>
    </BaseSelect>

    <!-- Priority -->
    <BaseInput
      v-model.number="groupForm.priority"
      label="Prioritás"
      type="number"
      min="0"
      placeholder="0 = legmagasabb prioritás"
      :error="errors.priority"
    />

    <!-- IsActive (csak edit módban) -->
    <div v-if="editingGroup" class="flex items-center">
      <input
        type="checkbox"
        v-model="groupForm.isActive"
        id="isActive"
        class="mr-2 h-4 w-4 rounded border-gray-300"
      />
      <label for="isActive" class="text-sm text-gray-700">Aktív csoport</label>
    </div>
  </div>

  <template #footer>
    <BaseButton variant="secondary" @click="cancelEdit">
      Mégse
    </BaseButton>
    <BaseButton variant="primary" @click="saveGroup" :loading="isSaving">
      {{ editingGroup ? 'Mentés' : 'Létrehozás' }}
    </BaseButton>
  </template>
</BaseModal>
```

6.2. **Form handling** metódusok (UsersPage mintájára):
```typescript
const showCreateModal = ref(false);
const editingGroup = ref(null);
const groupForm = ref({
  name: '',
  description: '',
  groupType: '',
  companyId: null,
  priority: 0,
  isActive: true
});
const errors = ref({});
const isSaving = ref(false);

function editGroup(group) {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    groupType: group.groupType || '',
    companyId: group.companyId,
    priority: group.priority,
    isActive: group.isActive
  };
  errors.value = {};
  showCreateModal.value = true;
}

function cancelEdit() {
  showCreateModal.value = false;
  editingGroup.value = null;
  groupForm.value = {
    name: '',
    description: '',
    groupType: '',
    companyId: null,
    priority: 0,
    isActive: true
  };
  errors.value = {};
}

async function saveGroup() {
  isSaving.value = true;
  errors.value = {};

  try {
    if (editingGroup.value) {
      await api.put(`/user-groups/${editingGroup.value.id}`, groupForm.value);
      // toast success
    } else {
      await api.post('/user-groups', groupForm.value);
      // toast success
    }

    cancelEdit();
    await fetchGroups();
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors;
    }
    // toast error
  } finally {
    isSaving.value = false;
  }
}
```

### LÉPÉS 7: Delete Confirmation

```vue
<!-- Delete Confirmation -->
<ConfirmDialog
  v-model="showDeleteDialog"
  title="Csoport törlése"
  :message="`Biztosan törölni szeretnéd a(z) '${deletingGroup?.name}' csoportot? Minden tag eltávolításra kerül!`"
  confirm-text="Törlés"
  cancel-text="Mégse"
  variant="danger"
  @confirm="deleteGroup"
/>
```

```typescript
const showDeleteDialog = ref(false);
const deletingGroup = ref(null);

function confirmDelete(group) {
  deletingGroup.value = group;
  showDeleteDialog.value = true;
}

async function deleteGroup() {
  try {
    await api.delete(`/user-groups/${deletingGroup.value.id}`);
    showDeleteDialog.value = false;
    // toast success
    await fetchGroups();
  } catch (error) {
    // toast error
  }
}
```

### LÉPÉS 8: Members Modal (Tagok kezelése)

8.1. **Members Modal template**:
```vue
<!-- Members Modal -->
<BaseModal
  v-model="showMembersModal"
  :title="`${selectedGroup?.name} - Tagok kezelése`"
  size="large"
>
  <!-- Add Member Button -->
  <div class="mb-4">
    <BaseButton
      variant="primary"
      size="sm"
      :left-icon="['fas', 'plus']"
      @click="openAddMemberModal"
    >
      Tag hozzáadása
    </BaseButton>
  </div>

  <!-- Members Table -->
  <BaseTable
    :columns="memberColumns"
    :data="members"
    :loading="loadingMembers"
  >
    <!-- User Name + Email -->
    <template #cell-userName="{ row }">
      <div>
        <div class="font-medium text-sm">{{ row.userName }}</div>
        <div class="text-xs text-gray-500">{{ row.userEmail }}</div>
      </div>
    </template>

    <!-- RoleInGroup -->
    <template #cell-roleInGroup="{ row }">
      <span
        v-if="row.roleInGroup"
        class="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800"
      >
        {{ row.roleInGroup }}
      </span>
      <span v-else class="text-sm text-gray-400">-</span>
    </template>

    <!-- JoinedAt -->
    <template #cell-joinedAt="{ row }">
      {{ formatDate(row.joinedAt) }}
    </template>

    <!-- Actions -->
    <template #cell-actions="{ row }">
      <BaseButton
        variant="ghost"
        size="sm"
        :left-icon="['fas', 'times']"
        @click="confirmRemoveMember(row)"
      >
        Eltávolítás
      </BaseButton>
    </template>
  </BaseTable>
</BaseModal>
```

8.2. **Members modal state és methods**:
```typescript
import { formatDate } from '@/utils/date.utils';

const showMembersModal = ref(false);
const selectedGroup = ref(null);
const members = ref([]);
const loadingMembers = ref(false);

const memberColumns = [
  { key: 'userName', label: 'Név / Email' },
  { key: 'roleInGroup', label: 'Szerepkör' },
  { key: 'priority', label: 'Prioritás' },
  { key: 'joinedAt', label: 'Csatlakozás' },
  { key: 'actions', label: '' }
];

async function openMembersModal(group) {
  selectedGroup.value = group;
  showMembersModal.value = true;
  loadingMembers.value = true;

  try {
    const response = await api.get(`/user-groups/${group.id}`);
    members.value = response.data.members || [];
  } catch (error) {
    // toast error
  } finally {
    loadingMembers.value = false;
  }
}
```

### LÉPÉS 9: Add Member Modal

9.1. **Add Member Modal template**:
```vue
<!-- Add Member Modal -->
<BaseModal
  v-model="showAddMemberModal"
  title="Tag hozzáadása"
  size="md"
>
  <div class="space-y-4">
    <!-- User Select -->
    <BaseSelect v-model="memberForm.userId" label="Felhasználó" required>
      <option :value="null">Válassz felhasználót...</option>
      <option v-for="user in users" :key="user.id" :value="user.id">
        {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
      </option>
    </BaseSelect>

    <!-- RoleInGroup -->
    <BaseInput
      v-model="memberForm.roleInGroup"
      label="Szerepkör csoportban"
      placeholder="pl. Lead, Member, Backup"
    />

    <!-- Priority -->
    <BaseInput
      v-model.number="memberForm.priority"
      label="Prioritás"
      type="number"
      min="0"
      placeholder="0 = legmagasabb"
    />
  </div>

  <template #footer>
    <BaseButton variant="secondary" @click="showAddMemberModal = false">
      Mégse
    </BaseButton>
    <BaseButton variant="primary" @click="addMember" :loading="isAddingMember">
      Hozzáadás
    </BaseButton>
  </template>
</BaseModal>
```

9.2. **Add member state és methods**:
```typescript
const showAddMemberModal = ref(false);
const users = ref([]);
const memberForm = ref({
  userId: null,
  roleInGroup: '',
  priority: 0
});
const isAddingMember = ref(false);

async function openAddMemberModal() {
  // Fetch users ha még nem töltöttük be
  if (users.value.length === 0) {
    try {
      const response = await api.get('/users');
      users.value = response.data;
    } catch (error) {
      // toast error
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

async function addMember() {
  if (!memberForm.value.userId) {
    // toast error: válassz felhasználót
    return;
  }

  isAddingMember.value = true;

  try {
    await api.post(
      `/user-groups/${selectedGroup.value.id}/members`,
      memberForm.value
    );

    showAddMemberModal.value = false;
    // toast success

    // Frissítsd a members listát és a main table-t
    await openMembersModal(selectedGroup.value);
    await fetchGroups(); // memberCount frissítés
  } catch (error) {
    // toast error
  } finally {
    isAddingMember.value = false;
  }
}
```

### LÉPÉS 10: Remove Member Confirmation

```vue
<!-- Remove Member Confirmation -->
<ConfirmDialog
  v-model="showRemoveMemberDialog"
  title="Tag eltávolítása"
  :message="`Biztosan eltávolítod ${removingMember?.userName} felhasználót a csoportból?`"
  confirm-text="Eltávolítás"
  cancel-text="Mégse"
  variant="danger"
  @confirm="removeMember"
/>
```

```typescript
const showRemoveMemberDialog = ref(false);
const removingMember = ref(null);
const isRemovingMember = ref(false);

function confirmRemoveMember(member) {
  removingMember.value = member;
  showRemoveMemberDialog.value = true;
}

async function removeMember() {
  isRemovingMember.value = true;

  try {
    await api.delete(
      `/user-groups/${selectedGroup.value.id}/members/${removingMember.value.userId}`
    );

    showRemoveMemberDialog.value = false;
    // toast success

    // Frissítsd a members listát és a main table-t
    await openMembersModal(selectedGroup.value);
    await fetchGroups(); // memberCount frissítés
  } catch (error) {
    // toast error
  } finally {
    isRemovingMember.value = false;
  }
}
```

### LÉPÉS 11: Data Fetching (onMounted)

```typescript
import { onMounted } from 'vue';

const groups = ref([]);
const companies = ref([]);
const isLoading = ref(false);

async function fetchGroups() {
  isLoading.value = true;

  try {
    const params = {};
    if (filterCompanyId.value) {
      params.companyId = filterCompanyId.value;
    }
    if (filterGroupType.value) {
      params.groupType = filterGroupType.value;
    }

    const response = await api.get('/user-groups', { params });
    groups.value = response.data;
  } catch (error) {
    // toast error
  } finally {
    isLoading.value = false;
  }
}

async function fetchCompanies() {
  try {
    const response = await api.get('/companies');
    companies.value = response.data;
  } catch (error) {
    // toast error
  }
}

onMounted(async () => {
  await fetchCompanies();
  await fetchGroups();
});

// Figyeld a filter változásokat
watch([filterCompanyId, filterGroupType], () => {
  fetchGroups();
});
```

### LÉPÉS 12: Imports és Setup

```typescript
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/services/api';
import { formatDate } from '@/utils/date.utils';
import { useToast } from '@/composables/useToast';

// Layout
import AppLayout from '@/components/layout/AppLayout.vue';

// Base components
import BaseCard from '@/components/base/BaseCard.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseSelect from '@/components/base/BaseSelect.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseModal from '@/components/base/BaseModal.vue';
import ConfirmDialog from '@/components/base/ConfirmDialog.vue';

const { success, error: toastError } = useToast();

// ... state és methods ...
</script>
```

### LÉPÉS 13: Router frissítés

Fájl: `src/router/index.ts`

```typescript
import UserGroupsPage from '@/components/features/admin/UserGroupsPage.vue';

// Frissítsd a létező route-ot (jelenleg LandingPage-re mutat):
{
  path: '/admin/user-groups',
  name: 'admin-user-groups',
  component: UserGroupsPage,  // ← LandingPage helyett
  meta: {
    requiresAuth: true,
    requiresAdmin: true,
    title: 'Felhasználói Csoportok'
  }
}
```

---

## ✅ Tesztelési Checklist

Miután kész vagy, ellenőrizd:

**Csoportok CRUD:**
- [ ] Lista betöltődik (GET /api/user-groups)
- [ ] Search működik (név/leírás szűrés)
- [ ] Cég filter működik
- [ ] GroupType filter működik
- [ ] Create működik (új csoport megjelenik)
- [ ] Edit működik (módosítások mentődnek)
- [ ] Delete működik (megerősítés után csoport törlődik)
- [ ] Badge-ek helyesen jelennek meg (típus, tagok, státusz)

**Tagok kezelése:**
- [ ] "Tagok" gomb megnyitja a members modal-t
- [ ] Tagok listája betöltődik (GET /api/user-groups/{id})
- [ ] "Tag hozzáadása" gomb megnyit egy új modal-t
- [ ] User select betöltődik (GET /api/users)
- [ ] Tag hozzáadása működik (POST /api/user-groups/{id}/members)
- [ ] Tag eltávolítása működik (DELETE /api/user-groups/{id}/members/{userId})
- [ ] MemberCount frissül a főtáblázatban
- [ ] RoleInGroup megjelenik (badge)
- [ ] JoinedAt dátum formázva van

**Validáció:**
- [ ] Név kötelező (create/edit)
- [ ] CompanyId kötelező (create)
- [ ] UserId kötelező (add member)
- [ ] Hibaüzenetek megjelennek

**UX:**
- [ ] Loading states működnek (spinner/skeleton)
- [ ] Toast értesítések működnek (success/error)
- [ ] Modal-ok bezáródnak sikeres művelet után
- [ ] Confirmation dialog-ok működnek (csoport/tag törlés)

---

## 🎨 Végső Fájlstruktúra

```
src/
├── components/
│   ├── features/
│   │   ├── admin/
│   │   │   ├── UsersPage.vue         ✅ (referencia)
│   │   │   ├── CompaniesPage.vue     ✅ (referencia)
│   │   │   └── UserGroupsPage.vue    ← ÚJ (ezt kell létrehozni)
│   │   └── SuppliersPage.vue         ✅ (referencia)
│   └── base/
│       ├── BaseButton.vue            ✅
│       ├── BaseCard.vue              ✅
│       ├── BaseInput.vue             ✅
│       ├── BaseSelect.vue            ✅
│       ├── BaseTable.vue             ✅
│       ├── BaseModal.vue             ✅
│       └── ConfirmDialog.vue         ✅
├── router/
│   └── index.ts                      (frissítendő)
└── utils/
    └── date.utils.ts                 ✅ (formatDate)
```

---

## 💡 Tippek

1. **Kezdd a UsersPage.vue másolásával** - 80% ugyanaz lesz
2. **Members modal a legbonyolultabb rész** - külön modal egyszerűbb mint inline
3. **Filter-ek hatékonyak** - backend szűrés companyId és groupType alapján
4. **Toast notifications** - minden művelet után adj visszajelzést
5. **Badge színek konzisztensek** - lásd fent a színsémát
6. **formatDate util** - már létezik, csak importáld
7. **API error handling** - backend pontos hibaüzeneteket ad vissza

---

## 🚀 Becsült Idő

- Alapoldal (table + filters): **45 perc**
- Create/Edit modal: **30 perc**
- Delete confirmation: **15 perc**
- Members modal: **45 perc**
- Add member modal: **30 perc**
- Remove member: **20 perc**
- Router + tesztelés: **30 perc**

**Összesen: ~3.5 óra**

---

**SIKERES IMPLEMENTÁLÁST!** 🎉
