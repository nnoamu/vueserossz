# Admin Frontend Implementation - Cursor AI Guide

Ez a dokumentum azokhoz a funkciókhoz ad implementációs útmutatót, ahol **a backend már készen van**, csak **a frontend hiányzik**.

---

## 📋 Áttekintés

### ✅ Backend Állapot (Kész)

**AdminUsersController.cs** (`/api/admin/users`):
```csharp
POST   /api/admin/users          // Create user with roles + companies
PUT    /api/admin/users/{id}     // Update user with roles + companies
DELETE /api/admin/users/{id}     // Deactivate user (soft delete)
GET    /api/admin/users/{id}     // Get user by ID
```

**CompaniesController.cs** (`/api/companies`):
```csharp
GET    /api/companies            // List all companies
GET    /api/companies/{id}       // Get company by ID
POST   /api/companies            // Create company (Admin only)
PUT    /api/companies/{id}       // Update company (Admin only)
DELETE /api/companies/{id}       // Deactivate company (Admin only)
```

### ❌ Hiányzó Frontend Komponensek

1. **UsersPage.vue** - Admin felhasználó kezelés oldal
2. **CompaniesPage.vue** - Cég kezelés oldal
3. Router útvonalak frissítése

### 📚 Használható Referencia

**SuppliersPage.vue** - Ez már **készen van** és tökéletes mintaként szolgál! 274 sor, tartalmaz:
- Táblázat kezelést
- Search funkciót
- Create/Edit modalokat
- Törlés megerősítést
- Loading states-eket
- Error handling-et

**Elérési út:** `GlosterIktato.API/GlosterIktato.Client/src/components/features/SuppliersPage.vue`

---

## 🎯 CURSOR PARANCSOK

Válaszd ki a neked megfelelő részletességi szintet:

---

## OPTION 1: Gyors Parancs (Tapasztalt fejlesztőknek)

```
Hozd létre az admin UsersPage.vue és CompaniesPage.vue komponenseket a SuppliersPage.vue mintájára.

BACKEND ENDPOINTOK:
- Users: POST/PUT/DELETE/GET /api/admin/users, /api/admin/users/{id}
- Companies: GET/POST/PUT/DELETE /api/companies, /api/companies/{id}

USERS DTO:
{
  email: string,
  password: string (csak create-nél),
  firstName: string,
  lastName: string,
  roleNames: string[] (pl. ["Admin", "Accountant"]),
  companyIds: number[]
}

COMPANIES DTO:
{
  name: string,
  taxNumber: string,
  address?: string
}

UsersPage speciális elemek:
- Multi-select role választó (Admin, User, Accountant, Manager szerepek)
- Multi-select company választó (API-ból lekérve)
- Aktív/Inaktív státusz badge
- Password mező csak create módban

CompaniesPage egyszerűbb:
- Name, TaxNumber, Address mezők
- Admin only write műveletek

Frissítsd a routert:
- /admin/users -> UsersPage.vue (requiresAdmin: true)
- /admin/companies -> CompaniesPage.vue (requiresAdmin: true)
- /suppliers -> SuppliersPage.vue (requiresAuth: true)

Használj: BaseTable, BaseCard, BaseModal, BaseButton, BaseInput, BaseSelect, ConfirmDialog, useToast, api axios instance
```

---

## OPTION 2: Részletes Parancs (Ajánlott)

```
Implementáld az admin felhasználó és cég kezelő oldalakat a meglévő SuppliersPage.vue komponens mintájára.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 REFERENCIA FÁJL (már létezik, ezt használd mintának):
GlosterIktato.API/GlosterIktato.Client/src/components/features/SuppliersPage.vue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1️⃣ USERSPAGE.VUE LÉTREHOZÁSA

📍 Elérési út:
GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/UsersPage.vue

### Backend API Endpoints:

```typescript
// Users API
POST   /api/admin/users          // Create user
PUT    /api/admin/users/{id}     // Update user
DELETE /api/admin/users/{id}     // Deactivate user
GET    /api/admin/users/{id}     // Get user by ID

// Helper endpoints
GET /api/users                   // Get all active users (list-hez használd)
GET /api/companies               // Get all companies (select-hez)
```

### DTO Struktúra:

**CreateUserDto:**
```typescript
interface CreateUserDto {
  email: string;              // Required, email validation
  password: string;           // Required, min 6 karakter
  firstName: string;          // Required
  lastName: string;           // Required
  roleNames: string[];        // ["Admin", "User", "Accountant", "Manager"]
  companyIds: number[];       // Assigned companies
}
```

**UpdateUserDto:**
```typescript
interface UpdateUserDto {
  email?: string;
  password?: string;          // Optional - csak ha változtatni akarják
  firstName?: string;
  lastName?: string;
  roleNames?: string[];
  companyIds?: number[];
}
```

**UserResponseDto:**
```typescript
interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Array<{ id: number; name: string }>;
  companies: Array<{ id: number; name: string }>;
  createdAt: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}
```

### Komponens Követelmények:

**1. Táblázat oszlopok:**
- Név (firstName + lastName)
- Email
- Szerepkörök (badge-ek)
- Cégek (lista)
- Státusz (Aktív/Inaktív badge)
- Műveletek (Edit, Delete gombok)

**2. Search funkció:**
- Keresés név vagy email alapján (client-side filter)

**3. Create User Modal:**
```typescript
Mezők:
- Email (input, email validation)
- Password (input, type="password", min 6 char)
- First Name (input, required)
- Last Name (input, required)
- Roles (multi-select) - opciók: Admin, User, Accountant, Manager
- Companies (multi-select) - GET /api/companies-ből töltve
```

**4. Edit User Modal:**
```typescript
Mezők: ugyanazok mint Create-nél, de:
- Password opcionális (csak ha változtatják)
- Pre-fill meglévő adatokkal
- Ugyanazok a multi-select-ek
```

**5. Delete Confirmation:**
- ConfirmDialog használata
- "Biztosan deaktiválod ezt a felhasználót?" üzenet
- DELETE /api/admin/users/{id} hívás

**6. Státusz Badge:**
```vue
<span v-if="user.isActive" class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
  Aktív
</span>
<span v-else class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
  Inaktív
</span>
```

**7. Role Badge-ek:**
```vue
<div class="flex gap-1 flex-wrap">
  <span v-for="role in user.roles" :key="role.id"
        class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
    {{ role.name }}
  </span>
</div>
```

**8. Multi-Select Component:**
Ha nincs kész multi-select komponens, használj native select multiple-t vagy implementálj egyszerű checkbox listát:
```vue
<div class="space-y-2">
  <label class="flex items-center" v-for="role in availableRoles" :key="role">
    <input type="checkbox" v-model="form.roleNames" :value="role" class="mr-2">
    {{ role }}
  </label>
</div>
```

### Használandó Composable-ök és Utilities:
```typescript
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import api from '@/services/api';

// Base components
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseModal from '@/components/base/BaseModal.vue';
import ConfirmDialog from '@/components/base/ConfirmDialog.vue';
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2️⃣ COMPANIESPAGE.VUE LÉTREHOZÁSA

📍 Elérési út:
GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/CompaniesPage.vue

### Backend API Endpoints:

```typescript
GET    /api/companies         // List all companies
GET    /api/companies/{id}    // Get company by ID
POST   /api/companies         // Create company (Admin only)
PUT    /api/companies/{id}    // Update company (Admin only)
DELETE /api/companies/{id}    // Deactivate company (Admin only)
```

### DTO Struktúra:

**CreateCompanyDto:**
```typescript
interface CreateCompanyDto {
  name: string;           // Required, max 200 char
  taxNumber: string;      // Required, max 50 char
  address?: string;       // Optional, max 500 char
}
```

**UpdateCompanyDto:**
```typescript
interface UpdateCompanyDto {
  name?: string;
  taxNumber?: string;
  address?: string;
}
```

**CompanyResponseDto:**
```typescript
interface CompanyDto {
  id: number;
  name: string;
  taxNumber: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}
```

### Komponens Követelmények:

**1. Táblázat oszlopok:**
- Név
- Adószám
- Cím
- Státusz (Aktív/Inaktív badge)
- Műveletek (Edit, Delete gombok - csak Admin-oknak)

**2. Search funkció:**
- Keresés név vagy adószám alapján (client-side filter)

**3. Create Company Modal:**
```typescript
Mezők:
- Name (input, required, max 200 char)
- Tax Number (input, required, max 50 char)
- Address (textarea, optional, max 500 char)
```

**4. Edit Company Modal:**
```typescript
Mezők: ugyanazok mint Create-nél
- Pre-fill meglévő adatokkal
```

**5. Delete Confirmation:**
- ConfirmDialog használata
- "Biztosan törölni szeretnéd ezt a céget?" üzenet
- DELETE /api/companies/{id} hívás

**6. Admin Check:**
```typescript
import { useAuthStore } from '@/stores/authStore';

const auth = useAuthStore();
const canEdit = computed(() => auth.isAdmin);

// UI-ban:
<BaseButton v-if="canEdit" @click="handleEdit(company)">Szerkesztés</BaseButton>
```

### Ez egyszerűbb mint a UsersPage:
- Nincs multi-select
- Csak 3 mező
- Egyszerűbb táblázat
- Nincs szerepkör/cég kapcsolat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3️⃣ ROUTER FRISSÍTÉSE

📍 Fájl: GlosterIktato.API/GlosterIktato.Client/src/router/index.ts

**Frissítendő/hozzáadandó route-ok:**

```typescript
import UsersPage from '@/components/features/admin/UsersPage.vue';
import CompaniesPage from '@/components/features/admin/CompaniesPage.vue';
import SuppliersPage from '@/components/features/SuppliersPage.vue';

// Admin routes szakaszban (már létezik, csak component-et cserélj):
{
  path: '/admin/users',
  name: 'admin-users',
  component: UsersPage,  // ← LandingPage helyett
  meta: { requiresAuth: true, requiresAdmin: true, title: 'Felhasználók kezelése' }
},

// Új route (ez még nincs):
{
  path: '/admin/companies',
  name: 'admin-companies',
  component: CompaniesPage,
  meta: { requiresAuth: true, requiresAdmin: true, title: 'Cégek kezelése' }
},

// Suppliers route (lehet hogy nincs még):
{
  path: '/suppliers',
  name: 'suppliers',
  component: SuppliersPage,
  meta: { requiresAuth: true, title: 'Szállítók kezelése' }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4️⃣ NAVIGÁCIÓ FRISSÍTÉSE (Opcionális)

Ha a SideNav.vue-ban még nincsenek meg ezek a linkek:

📍 Fájl: GlosterIktato.API/GlosterIktato.Client/src/components/layout/SideNav.vue

```vue
<!-- Admin menü (csak admin felhasználóknak) -->
<div v-if="auth.isAdmin">
  <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Admin</div>

  <router-link to="/admin/users" class="nav-link">
    <font-awesome-icon icon="users" />
    Felhasználók
  </router-link>

  <router-link to="/admin/companies" class="nav-link">
    <font-awesome-icon icon="building" />
    Cégek
  </router-link>

  <router-link to="/suppliers" class="nav-link">
    <font-awesome-icon icon="truck" />
    Szállítók
  </router-link>
</div>
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ ELLENŐRZŐ LISTA

UsersPage.vue:
- [ ] Táblázat users listával (név, email, szerepek, cégek, státusz)
- [ ] Search input (név/email szűrés)
- [ ] "Új felhasználó" gomb
- [ ] Create modal (email, password, név, roles multi-select, companies multi-select)
- [ ] Edit modal (ugyanaz, password opcionális)
- [ ] Delete confirmation dialog
- [ ] Státusz és szerepkör badge-ek
- [ ] Loading state skeleton
- [ ] Error handling toast-okkal
- [ ] API calls: GET /api/users (list), GET /api/companies (companies select), POST/PUT/DELETE /api/admin/users

CompaniesPage.vue:
- [ ] Táblázat companies listával (név, adószám, cím, státusz)
- [ ] Search input (név/adószám szűrés)
- [ ] "Új cég" gomb (csak admin-oknak)
- [ ] Create modal (név, adószám, cím)
- [ ] Edit modal (ugyanaz, pre-filled)
- [ ] Delete confirmation dialog (csak admin-oknak)
- [ ] Státusz badge
- [ ] Loading state
- [ ] Error handling
- [ ] Admin permission check (canEdit computed)
- [ ] API calls: GET/POST/PUT/DELETE /api/companies

Router:
- [ ] /admin/users → UsersPage.vue
- [ ] /admin/companies → CompaniesPage.vue
- [ ] /suppliers → SuppliersPage.vue
- [ ] requiresAdmin meta minden admin route-nál

Navigáció (opcionális):
- [ ] Admin menü szekció SideNav-ban
- [ ] Links: Felhasználók, Cégek, Szállítók

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 DESIGN KÖVETELMÉNYEK

1. **Konzisztencia:** Követd a SuppliersPage.vue styling-ját
2. **Tailwind CSS:** Használj utility class-okat
3. **Responsive:** Mobile-friendly layout
4. **Accessibility:** Proper labels, aria attributes
5. **Loading states:** SkeletonLoader vagy spinner
6. **Error states:** Toast notifications useToast-tal
7. **Empty states:** "Nincs még felhasználó" üzenet ha üres a lista

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚀 TESZTELÉS

Miután kész vagy, ellenőrizd:

1. **UsersPage:**
   - [ ] Lista betöltődik
   - [ ] Search működik
   - [ ] Create user működik (új user megjelenik a listában)
   - [ ] Edit user működik (változások mentődnek)
   - [ ] Delete user működik (IsActive false lesz)
   - [ ] Role multi-select működik
   - [ ] Company multi-select működik
   - [ ] Validation működik (email, password min 6 char)

2. **CompaniesPage:**
   - [ ] Lista betöltődik
   - [ ] Search működik
   - [ ] Create company működik (csak admin)
   - [ ] Edit company működik (csak admin)
   - [ ] Delete company működik (csak admin)
   - [ ] Non-admin user nem látja az edit/delete gombokat

3. **Router:**
   - [ ] /admin/users navigáció működik
   - [ ] /admin/companies navigáció működik
   - [ ] Non-admin userek nem férnek hozzá (redirect dashboard-ra)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💡 TIPPEK

1. **Kezdd a SuppliersPage.vue másolásával** - kb 80% ugyanaz lesz
2. **Companies egyszerűbb** - kezdd azzal ha bizonytalan vagy
3. **Multi-select:** Ha túl bonyolult, kezdd checkbox listával, később lehet fancy component
4. **API error handling:** A SuppliersPage-ben már jó minta van
5. **TypeScript:** Definiálj interface-eket a DTO-khoz (lehet külön types/admin.types.ts fájlba)
6. **Pagination:** Egyelőre skip, később lehet hozzáadni ha sok adat lesz

KEZDD EL ÉS LÉPÉSRŐL LÉPÉSRE HALADJ!
```

---

## OPTION 3: Lépésről Lépésre (Kezdőknek)

```
Hozd létre az admin felhasználó és cég kezelő oldalakat lépésről lépésre.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 1: COMPANIESPAGE.VUE - Egyszerűbb, ezzel kezdjük
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.1 Másold le a SuppliersPage.vue fájlt
    - Forrás: GlosterIktato.API/GlosterIktato.Client/src/components/features/SuppliersPage.vue
    - Cél: GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/CompaniesPage.vue
    - Hozd létre az admin mappát ha még nincs

1.2 Cseréld ki a komponensben:
    - "supplier" → "company" (minden előfordulást)
    - "Supplier" → "Company"
    - "Szállító" → "Cég"
    - "Szállítók" → "Cégek"

1.3 Táblázat oszlopok (columns computed property):
    ```typescript
    const columns = [
      { key: 'name', label: 'Név' },
      { key: 'taxNumber', label: 'Adószám' },
      { key: 'address', label: 'Cím' },
      { key: 'isActive', label: 'Státusz' },
      { key: 'actions', label: 'Műveletek' }
    ];
    ```

1.4 Form mezők (form ref):
    ```typescript
    const form = ref({
      name: '',
      taxNumber: '',
      address: ''
    });
    ```

1.5 API endpoint cserék:
    - `/api/suppliers` → `/api/companies`
    - Módszerek maradnak ugyanazok: GET, POST, PUT, DELETE

1.6 Validation:
    - name: required, max 200 char
    - taxNumber: required, max 50 char
    - address: optional, max 500 char

1.7 Admin check hozzáadása:
    ```typescript
    import { useAuthStore } from '@/stores/authStore';
    const auth = useAuthStore();
    const canEdit = computed(() => auth.isAdmin);

    // Template-ben:
    <BaseButton v-if="canEdit" @click="openEditModal(company)">
      Szerkesztés
    </BaseButton>
    ```

ÁLLJ MEG ITT ÉS TESZTELD! Működik a CompaniesPage?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 2: ROUTER FRISSÍTÉSE - CompaniesPage elérhetővé tétele
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 Fájl: GlosterIktato.API/GlosterIktato.Client/src/router/index.ts

2.2 Import hozzáadása:
    ```typescript
    import CompaniesPage from '@/components/features/admin/CompaniesPage.vue';
    ```

2.3 Új route a routes tömbhöz:
    ```typescript
    {
      path: '/admin/companies',
      name: 'admin-companies',
      component: CompaniesPage,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Cégek kezelése'
      }
    }
    ```

TESZTELD: Navigálj a /admin/companies URL-re böngészőben!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 3: USERSPAGE.VUE - Bonyolultabb, több mezővel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 Másold le újra a SuppliersPage.vue-t
    - Cél: GlosterIktato.API/GlosterIktato.Client/src/components/features/admin/UsersPage.vue

3.2 Cseréld ki:
    - "supplier" → "user"
    - "Supplier" → "User"
    - "Szállító" → "Felhasználó"
    - "Szállítók" → "Felhasználók"

3.3 Táblázat oszlopok:
    ```typescript
    const columns = [
      { key: 'name', label: 'Név' },
      { key: 'email', label: 'Email' },
      { key: 'roles', label: 'Szerepkörök' },
      { key: 'companies', label: 'Cégek' },
      { key: 'isActive', label: 'Státusz' },
      { key: 'actions', label: 'Műveletek' }
    ];
    ```

3.4 Form mezők:
    ```typescript
    const form = ref({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleNames: [] as string[],
      companyIds: [] as number[]
    });
    ```

3.5 Extra ref-ek a select-ekhez:
    ```typescript
    const availableRoles = ref(['Admin', 'User', 'Accountant', 'Manager']);
    const availableCompanies = ref<CompanyDto[]>([]);
    ```

3.6 Companies betöltése (onMounted-ben):
    ```typescript
    async function fetchCompanies() {
      try {
        const response = await api.get('/api/companies');
        availableCompanies.value = response.data;
      } catch (error) {
        console.error('Failed to fetch companies', error);
      }
    }

    onMounted(() => {
      fetchUsers();
      fetchCompanies(); // ← hozzáadás
    });
    ```

3.7 API endpoint cserék:
    - List: `/api/suppliers` → `/api/users` (GET all users)
    - Create/Update/Delete: `/api/admin/users`, `/api/admin/users/{id}`

3.8 Modal mezők template-ben:
    ```vue
    <BaseInput
      v-model="form.email"
      label="Email"
      type="email"
      required
    />

    <BaseInput
      v-if="!isEditMode"
      v-model="form.password"
      label="Jelszó"
      type="password"
      required
      placeholder="Minimum 6 karakter"
    />

    <BaseInput
      v-model="form.firstName"
      label="Keresztnév"
      required
    />

    <BaseInput
      v-model="form.lastName"
      label="Vezetéknév"
      required
    />

    <!-- Role multi-select -->
    <div class="space-y-2">
      <label class="block text-sm font-medium">Szerepkörök</label>
      <div class="space-y-1">
        <label v-for="role in availableRoles" :key="role" class="flex items-center">
          <input
            type="checkbox"
            v-model="form.roleNames"
            :value="role"
            class="mr-2"
          />
          {{ role }}
        </label>
      </div>
    </div>

    <!-- Companies multi-select -->
    <div class="space-y-2">
      <label class="block text-sm font-medium">Cégek</label>
      <div class="space-y-1">
        <label v-for="company in availableCompanies" :key="company.id" class="flex items-center">
          <input
            type="checkbox"
            v-model="form.companyIds"
            :value="company.id"
            class="mr-2"
          />
          {{ company.name }}
        </label>
      </div>
    </div>
    ```

3.9 Táblázatban role/company megjelenítés:
    ```vue
    <!-- Roles column -->
    <td>
      <div class="flex gap-1 flex-wrap">
        <span
          v-for="role in user.roles"
          :key="role.id"
          class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
        >
          {{ role.name }}
        </span>
      </div>
    </td>

    <!-- Companies column -->
    <td>
      <div class="text-sm">
        <span v-for="(company, idx) in user.companies" :key="company.id">
          {{ company.name }}<span v-if="idx < user.companies.length - 1">, </span>
        </span>
      </div>
    </td>

    <!-- Status column -->
    <td>
      <span
        v-if="user.isActive"
        class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
      >
        Aktív
      </span>
      <span
        v-else
        class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
      >
        Inaktív
      </span>
    </td>
    ```

3.10 Edit modal előkészítés:
     ```typescript
     function openEditModal(user: UserDto) {
       selectedUser.value = user;
       form.value = {
         email: user.email,
         password: '', // Üres - opcionális
         firstName: user.firstName,
         lastName: user.lastName,
         roleNames: user.roles.map(r => r.name),
         companyIds: user.companies.map(c => c.id)
       };
       isEditMode.value = true;
       showModal.value = true;
     }
     ```

TESZTELD: Működik a UsersPage? Create/Edit/Delete?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 4: USERSPAGE ROUTER FRISSÍTÉSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 Import:
    ```typescript
    import UsersPage from '@/components/features/admin/UsersPage.vue';
    ```

4.2 Létező route frissítése (már van /admin/users de LandingPage-re mutat):
    ```typescript
    {
      path: '/admin/users',
      name: 'admin-users',
      component: UsersPage,  // ← Ez volt LandingPage, cseréld ki!
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Felhasználók kezelése'
      }
    }
    ```

TESZTELD: Navigálj /admin/users-re!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 5: SUPPLIERS ROUTER HOZZÁADÁSA (ha még nincs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.1 Import:
    ```typescript
    import SuppliersPage from '@/components/features/SuppliersPage.vue';
    ```

5.2 Új route:
    ```typescript
    {
      path: '/suppliers',
      name: 'suppliers',
      component: SuppliersPage,
      meta: {
        requiresAuth: true,
        title: 'Szállítók kezelése'
      }
    }
    ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 6: TÍPUSOK DEFINIÁLÁSA (Opcionális de ajánlott)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6.1 Fájl: GlosterIktato.API/GlosterIktato.Client/src/types/admin.types.ts

6.2 Tartalom:
    ```typescript
    // User types
    export interface UserDto {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
      roles: Array<{ id: number; name: string }>;
      companies: Array<{ id: number; name: string }>;
      createdAt: string;
      createdBy?: string;
      modifiedAt?: string;
      modifiedBy?: string;
    }

    export interface CreateUserDto {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      roleNames: string[];
      companyIds: number[];
    }

    export interface UpdateUserDto {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      roleNames?: string[];
      companyIds?: number[];
    }

    // Company types
    export interface CompanyDto {
      id: number;
      name: string;
      taxNumber: string;
      address?: string;
      isActive: boolean;
      createdAt: string;
      createdBy?: string;
      modifiedAt?: string;
      modifiedBy?: string;
    }

    export interface CreateCompanyDto {
      name: string;
      taxNumber: string;
      address?: string;
    }

    export interface UpdateCompanyDto {
      name?: string;
      taxNumber?: string;
      address?: string;
    }
    ```

6.3 Import a komponensekben:
    ```typescript
    import type { UserDto, CreateUserDto, UpdateUserDto } from '@/types/admin.types';
    import type { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from '@/types/admin.types';
    ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LÉPÉS 7: NAVIGÁCIÓ MENÜ FRISSÍTÉSE (Opcionális)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7.1 Fájl: GlosterIktato.API/GlosterIktato.Client/src/components/layout/SideNav.vue

7.2 Keress egy jó helyet az admin menünek (pl. Settings után)

7.3 Add hozzá:
    ```vue
    <!-- Admin Section -->
    <div v-if="auth.isAdmin" class="mt-6">
      <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Admin
      </div>

      <router-link
        to="/admin/users"
        class="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
        active-class="bg-blue-50 text-blue-600 border-r-2 border-blue-600"
      >
        <font-awesome-icon icon="users" class="w-5 h-5 mr-3" />
        <span>Felhasználók</span>
      </router-link>

      <router-link
        to="/admin/companies"
        class="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
        active-class="bg-blue-50 text-blue-600 border-r-2 border-blue-600"
      >
        <font-awesome-icon icon="building" class="w-5 h-5 mr-3" />
        <span>Cégek</span>
      </router-link>

      <router-link
        to="/suppliers"
        class="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
        active-class="bg-blue-50 text-blue-600 border-r-2 border-blue-600"
      >
        <font-awesome-icon icon="truck" class="w-5 h-5 mr-3" />
        <span>Szállítók</span>
      </router-link>
    </div>
    ```

7.4 Import authStore ha még nincs:
    ```typescript
    import { useAuthStore } from '@/stores/authStore';
    const auth = useAuthStore();
    ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KÉSZ! VÉGSŐ TESZTELÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ellenőrizd hogy minden működik:
- [ ] /admin/companies - céglista, create, edit, delete
- [ ] /admin/users - user lista, create (password), edit (opcionális password), delete
- [ ] /suppliers - szállító lista, CRUD
- [ ] Navigációs menü megjelenik (csak admin-oknak)
- [ ] Non-admin userek nem férnek hozzá admin oldalakhoz
- [ ] Toast értesítések működnek
- [ ] Loading states megjelennek
- [ ] Validation működik
- [ ] Search szűrők működnek

HA MINDEN OK, KÉSZ VAGY! 🎉
```

---

## 📚 További Információk

### Backend API Dokumentáció

**Részletes státusz jelentés:**
- Lásd: `ADMIN_FEATURES_STATUS.md`
- Backend endpoint-ok teljes listája
- DTO struktúrák
- Hiányzó funkciók listája

### Meglévő Komponensek Használata

**Base komponensek** (már léteznek):
- `BaseTable.vue` - Táblázat megjelenítés
- `BaseCard.vue` - Kártya layout
- `BaseModal.vue` - Modal dialog
- `BaseButton.vue` - Gomb komponens
- `BaseInput.vue` - Input mező
- `ConfirmDialog.vue` - Megerősítő dialog
- `SkeletonLoader.vue` - Loading állapot

**Composable-ök:**
- `useToast()` - Toast értesítések
- `useAuthStore()` - Auth állapot (isAdmin check)
- `api` - Axios instance API hívásokhoz

### Styling Guide

**Tailwind CSS Utility Classes:**
```css
/* Badge styles */
.badge-active { @apply px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 }
.badge-inactive { @apply px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 }
.badge-role { @apply px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 }

/* Button styles */
.btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 }
.btn-secondary { @apply px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 }
.btn-danger { @apply px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 }

/* Input styles */
.input { @apply w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 }
```

---

## 🐛 Troubleshooting

**Probléma:** Multi-select nem működik
- **Megoldás:** Ellenőrizd hogy `v-model="form.roleNames"` egy array-re mutat (`string[]`)

**Probléma:** Companies nem töltődnek be a select-ben
- **Megoldás:** Hívd meg `fetchCompanies()` az `onMounted()` hook-ban

**Probléma:** Password validation hiba
- **Megoldás:** Backend min 6 karakter, add hozzá frontend validation-t

**Probléma:** Admin route-okhoz non-admin is hozzáfér
- **Megoldás:** Ellenőrizd a router guard-ot: `if (to.meta?.requiresAdmin && !auth.isAdmin)`

**Probléma:** API 403 Forbidden
- **Megoldás:** Ellenőrizd hogy a user Admin role-lal van bejelentkezve

---

## 📦 Fájlok Összesítése

**Új fájlok létrehozása:**
```
GlosterIktato.API/GlosterIktato.Client/src/
├── components/
│   └── features/
│       └── admin/
│           ├── UsersPage.vue           (ÚJ)
│           └── CompaniesPage.vue       (ÚJ)
└── types/
    └── admin.types.ts                  (ÚJ, opcionális)
```

**Módosítandó fájlok:**
```
GlosterIktato.API/GlosterIktato.Client/src/
├── router/
│   └── index.ts                        (FRISSÍTÉS)
└── components/
    └── layout/
        └── SideNav.vue                 (FRISSÍTÉS, opcionális)
```

**Referencia fájlok (már léteznek, használd őket!):**
```
GlosterIktato.API/GlosterIktato.Client/src/
└── components/
    └── features/
        └── SuppliersPage.vue           (REFERENCIA - másold le!)
```

---

## ⏱️ Becsült Időszükséglet

- **CompaniesPage.vue:** 30-45 perc (egyszerű, 3 mező)
- **UsersPage.vue:** 1-1.5 óra (multi-select, több mező)
- **Router frissítés:** 5-10 perc
- **Típusok létrehozása:** 10-15 perc (opcionális)
- **Navigáció frissítés:** 10-15 perc (opcionális)
- **Tesztelés:** 30 perc

**Összesen:** ~2.5-3 óra a teljes implementáció

---

## 🎯 Sorrend Ajánlása

1. ✅ **CompaniesPage.vue** - Kezdd ezzel, egyszerűbb
2. ✅ **Companies Router** - Tesztelés
3. ✅ **UsersPage.vue** - Bonyolultabb, de már van tapasztalat
4. ✅ **Users Router** - Tesztelés
5. ✅ **Suppliers Router** - Gyors hozzáadás
6. ✅ **Típusok** - Ha van idő, TypeScript support
7. ✅ **Navigáció** - Polish, UX javítás

---

**JAVASLAT:** Használd az **OPTION 2 (Részletes Parancs)** vagy **OPTION 3 (Lépésről Lépésre)** verziót, attól függően mennyire vagy magabiztos Vue.js-ben.

**Ha elakadsz**, nézd meg a `SuppliersPage.vue` fájlt referenciának - ott minden minta megvan!

Sok sikert! 🚀
