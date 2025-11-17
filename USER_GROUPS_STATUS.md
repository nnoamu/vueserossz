# Felhasználói Csoportok (User Groups) - Implementáció Állapot

Ez a dokumentum a felhasználói csoportok kezelés **teljes backend implementációját** elemzi.

---

## 📋 ÖSSZEFOGLALÓ

| Komponens | Állapot | Megjegyzés |
|-----------|---------|------------|
| **Backend Adatbázis** | ✅ 100% Kész | UserGroup, UserGroupMember táblák |
| **Backend API** | ✅ 100% Kész | Teljes CRUD + tagság kezelés |
| **Backend Service** | ✅ 100% Kész | UserGroupService implementálva |
| **Frontend** | ❌ Nincs | UserGroupsPage.vue hiányzik |
| **Jogosultságok (Permissions)** | ❌ Nincs implementálva | Csak role-based auth van |

---

## ✅ BACKEND - 100% KÉSZ

### 1️⃣ Adatbázis Modellek

#### **UserGroup Entity** (`Models/UserGroup.cs`)

```csharp
public class UserGroup
{
    public int Id { get; set; }
    public string Name { get; set; }              // Csoport neve (max 100 char)
    public string? Description { get; set; }      // Leírás (max 500 char)
    public string? GroupType { get; set; }        // "Approver", "ElevatedApprover", "Accountant"
    public int CompanyId { get; set; }            // Melyik céghez tartozik
    public Company Company { get; set; }
    public bool IsActive { get; set; } = true;    // Aktív-e
    public int Priority { get; set; } = 0;        // Prioritás (alacsonyabb = fontosabb)
    public int RoundRobinIndex { get; set; } = 0; // Auto-assign-hoz
    public DateTime CreatedAt { get; set; }

    // Navigation
    public ICollection<UserGroupMember> Members { get; set; }
}
```

**Fontos tulajdonságok:**
- ✅ **Name**: Csoport neve (unique constraint cégenkén belül)
- ✅ **GroupType**: Workflow státuszhoz rendelt típus (pl. "Approver")
- ✅ **CompanyId**: Minden csoport egy céghez tartozik
- ✅ **Priority**: Több csoport esetén prioritás szerinti választás
- ✅ **RoundRobinIndex**: Automatikus feladatkiosztáshoz

#### **UserGroupMember Entity** (`Models/UserGroupMember.cs`)

```csharp
public class UserGroupMember
{
    public int Id { get; set; }
    public int UserGroupId { get; set; }
    public UserGroup UserGroup { get; set; }
    public int UserId { get; set; }
    public User User { get; set; }
    public string? RoleInGroup { get; set; }      // "Lead", "Member", "Backup"
    public int Priority { get; set; } = 0;        // Prioritás csoporton belül
    public bool IsActive { get; set; } = true;    // Aktív-e a tagság
    public DateTime JoinedAt { get; set; }
    public int? AddedByUserId { get; set; }       // Ki adta hozzá
    public User? AddedBy { get; set; }
}
```

**Fontos tulajdonságok:**
- ✅ **RoleInGroup**: Szerepkör a csoporton belül (opcionális)
- ✅ **Priority**: Tagok prioritása csoporton belül
- ✅ **IsActive**: Tagság aktív/inaktív
- ✅ **Cascade Delete**: Ha csoport törlődik, tagságok is törlődnek

#### **DbContext Konfiguráció** (`Data/ApplicationDbContext.cs`)

```csharp
// UserGroup
public DbSet<UserGroup> UserGroups { get; set; }
public DbSet<UserGroupMember> UserGroupMembers { get; set; }

// Konfiguráció:
modelBuilder.Entity<UserGroup>(entity =>
{
    entity.HasIndex(ug => new { ug.CompanyId, ug.Name }).IsUnique(); // Név unique cégenként
    entity.HasIndex(ug => new { ug.CompanyId, ug.GroupType, ug.IsActive });
});

modelBuilder.Entity<UserGroupMember>(entity =>
{
    entity.HasOne(ugm => ugm.UserGroup)
        .WithMany(ug => ug.Members)
        .OnDelete(DeleteBehavior.Cascade); // ✅ Csoport törléskor tagság is törlődik

    entity.HasIndex(ugm => new { ugm.UserGroupId, ugm.UserId }).IsUnique(); // User csak 1x lehet tag
});
```

**Cascade Delete működése:**
```
UserGroup törlése
   ↓
UserGroupMember-ek automatikusan törlődnek (Cascade)
   ↓
Felhasználók megmaradnak, csak a tagságuk szűnik meg
```

---

### 2️⃣ API Endpoints

#### **UserGroupsController** (`Controllers/UserGroupsController.cs`)

Route: `/api/user-groups`
Authorization: `[Authorize(Roles = "Admin")]` - Minden endpoint Adminonly!

| HTTP Method | Endpoint | Funkció | DTO |
|------------|----------|---------|-----|
| **GET** | `/api/user-groups` | Csoportok listázása | `List<UserGroupListDto>` |
| | `?companyId=1` | Szűrés cég szerint | |
| | `?groupType=Approver` | Szűrés típus szerint | |
| **GET** | `/api/user-groups/{id}` | Csoport részletei (tagokkal) | `UserGroupDto` |
| **POST** | `/api/user-groups` | Új csoport létrehozása | `CreateUserGroupDto` → `UserGroupDto` |
| **PUT** | `/api/user-groups/{id}` | Csoport módosítása | `UpdateUserGroupDto` → `UserGroupDto` |
| **DELETE** | `/api/user-groups/{id}` | Csoport törlése | `204 NoContent` |
| | | | |
| **POST** | `/api/user-groups/{id}/members` | Tag hozzáadása | `AddUserGroupMemberDto` → `UserGroupMemberDto` |
| **DELETE** | `/api/user-groups/{id}/members/{userId}` | Tag eltávolítása | `204 NoContent` |
| **GET** | `/api/user-groups/user/{userId}` | User összes csoportja | `List<UserGroupListDto>` |

#### **DTO Struktúrák**

**CreateUserGroupDto:**
```csharp
{
    "name": "Finance Approvers",          // Required, max 100 char
    "description": "...",                 // Optional, max 500 char
    "groupType": "Approver",              // Optional, max 50 char
    "companyId": 1,                       // Required, > 0
    "priority": 0                         // Optional, >= 0
}
```

**UpdateUserGroupDto:**
```csharp
{
    "name": "Finance Approvers",          // Required
    "description": "...",                 // Optional
    "groupType": "Approver",              // Optional
    "priority": 0,                        // Optional
    "isActive": true                      // Default: true
}
```

**UserGroupDto (Response):**
```csharp
{
    "id": 1,
    "name": "Finance Approvers",
    "description": "...",
    "groupType": "Approver",
    "companyId": 1,
    "companyName": "Acme Corp",
    "isActive": true,
    "priority": 0,
    "roundRobinIndex": 0,
    "memberCount": 5,
    "createdAt": "2025-01-15T10:00:00Z",
    "members": [
        {
            "id": 10,
            "userGroupId": 1,
            "userId": 42,
            "userName": "John Doe",
            "userEmail": "john@example.com",
            "roleInGroup": "Lead",
            "priority": 0,
            "isActive": true,
            "joinedAt": "2025-01-15T10:05:00Z",
            "addedByUserId": 1,
            "addedByName": "Admin User"
        }
    ]
}
```

**UserGroupListDto (Lista nézethez, tagok nélkül):**
```csharp
{
    "id": 1,
    "name": "Finance Approvers",
    "description": "...",
    "groupType": "Approver",
    "companyId": 1,
    "companyName": "Acme Corp",
    "isActive": true,
    "priority": 0,
    "memberCount": 5
}
```

**AddUserGroupMemberDto:**
```csharp
{
    "userId": 42,                         // Required, > 0
    "roleInGroup": "Lead",                // Optional, max 50 char
    "priority": 0                         // Optional, >= 0
}
```

---

### 3️⃣ Service Implementáció

#### **IUserGroupService** (`Services/Interfaces/IUserGroupService.cs`)

**CRUD Műveletek:**
```csharp
Task<List<UserGroupListDto>> GetUserGroupsAsync(int? companyId, string? groupType);
Task<UserGroupDto?> GetUserGroupByIdAsync(int groupId);
Task<UserGroupDto?> CreateUserGroupAsync(CreateUserGroupDto dto, int currentUserId);
Task<UserGroupDto?> UpdateUserGroupAsync(int groupId, UpdateUserGroupDto dto, int currentUserId);
Task<bool> DeleteUserGroupAsync(int groupId, int currentUserId);
```

**Tagság kezelés:**
```csharp
Task<UserGroupMemberDto?> AddMemberAsync(int groupId, AddUserGroupMemberDto dto, int currentUserId);
Task<bool> RemoveMemberAsync(int groupId, int userId, int currentUserId);
Task<List<UserGroupListDto>> GetUserGroupsForUserAsync(int userId);
```

**Workflow helper metódusok:**
```csharp
// Következő user kiválasztása round-robin szerint
Task<int?> GetNextUserFromGroupAsync(int companyId, string groupType);

// Csoport összes aktív tagjának ID-ja (priority szerint rendezve)
Task<List<int>> GetActiveGroupMemberIdsAsync(int companyId, string groupType);
```

**UserGroupService** (`Services/UserGroupService.cs`) - Teljes implementáció kész!

---

## ❌ HIÁNYZÓ FUNKCIÓK

### 1️⃣ Jogosultságok (Permissions) Kezelése

**Amit Te leírtál:**
> Az egyes felhasználói csoportokhoz:
> - Jogosultságok rendelhetők

**Mi van most:**
- ❌ Nincs `Permission` entitás/tábla
- ❌ Nincs `UserGroupPermission` kapcsolótábla
- ❌ Nincs permission-based authorization

**Jelenlegi állapot:**
- ✅ Csak **Role-based authorization** van (`[Authorize(Roles = "Admin")]`)
- ✅ UserGroup-okhoz NEM lehet jogosultságokat rendelni
- ✅ UserGroup jelenleg csak **workflow assignment**-hez használható (pl. melyik csoportnak menjen az "Approver" feladat)

**Mit kellene implementálni:**

```csharp
// 1. Permission entitás
public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; }        // pl. "documents.view"
    public string? Description { get; set; }
    public string Category { get; set; }    // pl. "documents", "users", "companies"
}

// 2. UserGroupPermission kapcsolótábla
public class UserGroupPermission
{
    public int Id { get; set; }
    public int UserGroupId { get; set; }
    public UserGroup UserGroup { get; set; }
    public int PermissionId { get; set; }
    public Permission Permission { get; set; }
    public DateTime GrantedAt { get; set; }
    public int GrantedByUserId { get; set; }
}

// 3. API Endpoints
POST   /api/user-groups/{id}/permissions         // Jogosultság hozzárendelése
DELETE /api/user-groups/{id}/permissions/{permissionId}  // Jogosultság eltávolítása
GET    /api/user-groups/{id}/permissions         // Csoport jogosultságai

// 4. Authorization Policy
[Authorize(Policy = "documents.view")]  // Role helyett permission check
```

---

### 2️⃣ Frontend

**Amit Te leírtál:**
> Az adminisztrátor felhasználói csoportokat hozhat létre, módosíthat, törölhet.

**Mi van most:**
- ❌ Nincs `UserGroupsPage.vue` frontend oldal
- ❌ Router placeholder létezik: `/admin/user-groups` → `LandingPage.vue`

**Mit kellene implementálni:**

```vue
<!-- UserGroupsPage.vue -->
Funkciók:
- Csoportok táblázata (név, leírás, típus, cég, tagok száma, státusz)
- Search/filter (cég szerint, típus szerint)
- Create csoport modal (név, leírás, típus, cég, priority)
- Edit csoport modal (ugyanaz, + IsActive toggle)
- Delete confirmation
- Tagok kezelése:
  - Tagok listája modal-ban vagy külön section-ben
  - "Tag hozzáadása" gomb → User select
  - Tag eltávolítása
  - RoleInGroup szerkesztése
  - Priority módosítása
- (Ha lesz Permission rendszer):
  - Jogosultságok hozzárendelése multi-select-tel
  - Jogosultság eltávolítása
```

---

## 🔍 ÖSSZEHASONLÍTÁS: Leírás vs. Implementáció

| Te azt mondtad | Implementáció állapota |
|---------------|------------------------|
| "Felhasználói csoportokat hozhat létre" | ✅ Backend API: POST /api/user-groups |
| "módosíthat" | ✅ Backend API: PUT /api/user-groups/{id} |
| "törölhet" | ✅ Backend API: DELETE /api/user-groups/{id} |
| | ✅ Cascade delete: tagságok automatikusan törlődnek |
| "Jogosultságok rendelhetők" | ❌ **Nincs implementálva** - Nincs Permission rendszer |
| "Felhasználók rendelhetők" | ✅ Backend API: POST /api/user-groups/{id}/members |
| "Ezek az összerendelések módosíthatók" | ✅ Backend API: Tag hozzáadás/eltávolítás |
| | ⚠️ RoleInGroup/Priority módosítás: jelenleg csak tag törlés+újra hozzáadás |
| "Egy felhasználó több csoport tagja is lehet" | ✅ Adatbázis: Nincs korlátozás |
| "Csoport törlése → tagság megszűnik" | ✅ DbContext: Cascade Delete konfiguráció |
| "Elvesznek azok a jogosultságai" | ❌ Nincs permission rendszer → nem értelmezhető |

---

## 🎯 MIT HASZNÁLHATSZ MOST?

### ✅ Teljes funkcionalitás (Backend API készen van):

**1. Csoportok kezelése:**
```bash
# Lista (szűrhető cég és típus szerint)
GET /api/user-groups?companyId=1&groupType=Approver

# Részletek (tagokkal együtt)
GET /api/user-groups/5

# Létrehozás
POST /api/user-groups
{
  "name": "Finance Approvers",
  "companyId": 1,
  "groupType": "Approver"
}

# Módosítás
PUT /api/user-groups/5
{
  "name": "Finance Approval Team",
  "isActive": true
}

# Törlés (tagságok is törlődnek automatikusan!)
DELETE /api/user-groups/5
```

**2. Tagok kezelése:**
```bash
# Tag hozzáadása
POST /api/user-groups/5/members
{
  "userId": 42,
  "roleInGroup": "Lead",
  "priority": 0
}

# Tag eltávolítása
DELETE /api/user-groups/5/members/42

# User csoportjainak lekérése
GET /api/user-groups/user/42
```

**3. Workflow integráció:**
```bash
# Service metódusok (belső használatra):
GetNextUserFromGroupAsync(companyId: 1, groupType: "Approver")
  → Következő user ID round-robin szerint

GetActiveGroupMemberIdsAsync(companyId: 1, groupType: "Approver")
  → Összes aktív tag ID-ja priority szerint
```

---

## 📝 KÖVETKEZŐ LÉPÉSEK

### 1️⃣ Ha NEM kell Permission rendszer (csak workflow csoportok):

**Frontend implementáció:**
```
Időbecslés: ~2-3 óra

1. UserGroupsPage.vue létrehozása
   - SuppliersPage.vue mintájára
   - Táblázat: név, leírás, típus, cég, tagok száma, státusz
   - Create/Edit modal
   - Delete confirmation

2. Tagok kezelése (külön modal vagy inline)
   - Tagok táblázata (név, email, roleInGroup, priority)
   - "Add Member" button → User select dropdown
   - "Remove Member" button
   - (Optional) RoleInGroup/Priority inline szerkesztés

3. Router frissítés
   /admin/user-groups → UserGroupsPage.vue
```

**Referencia fájlok:**
- `SuppliersPage.vue` - Teljes CRUD minta
- `CompaniesPage.vue` - Ha már megírtad az előző útmutatóból

---

### 2️⃣ Ha KELL Permission rendszer:

**Backend bővítés (Priority: Magas):**
```
Időbecslés: ~4-6 óra

1. Permission entitás + UserGroupPermission kapcsolótábla
2. Adatbázis migráció
3. PermissionService implementáció
4. UserGroupsController bővítése:
   - POST /api/user-groups/{id}/permissions
   - DELETE /api/user-groups/{id}/permissions/{permId}
   - GET /api/user-groups/{id}/permissions
5. Authorization policy handler (permission-based auth)
6. Összes controller átírása:
   [Authorize(Roles = "Admin")] → [Authorize(Policy = "users.edit")]
```

**Frontend implementáció (Permission-nal):**
```
Időbecslés: ~3-4 óra

UserGroupsPage.vue + Permissions UI:
- Multi-select jogosultságok (checkbox lista vagy fancy select)
- Jogosultság hozzáadása/eltávolítása
- Jogosultság kategóriák (documents.*, users.*, companies.*)
- Permission preview (melyik csoport milyen jogokat kapott)
```

**Permission lista példa:**
```typescript
const permissions = [
  // Documents
  { id: 1, name: 'documents.view', category: 'documents' },
  { id: 2, name: 'documents.create', category: 'documents' },
  { id: 3, name: 'documents.edit', category: 'documents' },
  { id: 4, name: 'documents.delete', category: 'documents' },

  // Users
  { id: 5, name: 'users.view', category: 'users' },
  { id: 6, name: 'users.create', category: 'users' },
  { id: 7, name: 'users.edit', category: 'users' },
  { id: 8, name: 'users.delete', category: 'users' },

  // Companies
  { id: 9, name: 'companies.view', category: 'companies' },
  { id: 10, name: 'companies.create', category: 'companies' },
  // ...
];
```

---

## 🔄 WORKFLOW HASZNÁLAT (Már működik!)

A UserGroup rendszer jelenleg **workflow assignment**-hez van használva:

**Példa scenario:**
1. Admin létrehoz egy "Finance Approvers" csoportot
   - Company: Acme Corp (ID: 1)
   - GroupType: "Approver"
   - Members: John, Sarah, Mike

2. Dokumentum advance-oláskor WorkflowService meghívja:
   ```csharp
   var nextUserId = await _groupService.GetNextUserFromGroupAsync(
       companyId: 1,
       groupType: "Approver"
   );
   ```

3. Round-robin algoritmus kiválaszt egy usert (John → Sarah → Mike → John...)

4. Dokumentum hozzárendelődik az adott userhez

**Ez már működik a backend-en, csak nincs hozzá admin UI!**

---

## 💡 AJÁNLÁS

**Rövid távon (ha nincs idő Permission rendszerre):**
1. ✅ Használd a meglévő UserGroup backend-et workflow-hoz
2. ✅ Implementáld a UserGroupsPage.vue-t (frontend)
3. ✅ Admin kezelheti a csoportokat és tagságokat
4. ⚠️ Jogosultságok helyett továbbra is Role-based auth marad

**Hosszú távon (production-ready rendszer):**
1. ✅ Implementáld a Permission rendszert (backend)
2. ✅ Írd át az authorization-t policy-based-re
3. ✅ Bővítsd a UserGroupsPage.vue-t permission kezeléssel
4. ✅ Fine-grained access control minden admin funkcióra

---

## 📊 ADATBÁZIS DIAGRAM (Jelenlegi)

```
┌─────────────────┐
│     Company     │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   UserGroup     │──────┐
│                 │      │
│ - Name          │      │ 1:N
│ - GroupType     │      │
│ - Priority      │      │
│ - IsActive      │      │
└─────────────────┘      │
                         ▼
                ┌──────────────────┐
         ┌──────│ UserGroupMember  │──────┐
         │      │                  │      │
         │ N:1  │ - RoleInGroup    │ N:1  │
         │      │ - Priority       │      │
         │      │ - IsActive       │      │
         │      └──────────────────┘      │
         ▼                                ▼
┌─────────────────┐            ┌─────────────────┐
│      User       │            │      User       │
│                 │            │   (AddedBy)     │
│ - Email         │            └─────────────────┘
│ - FirstName     │
│ - LastName      │
│ - IsActive      │
└─────────────────┘
```

**CASCADE DELETE működése:**
```
DELETE UserGroup (ID = 5)
   ↓
   ├─ DELETE UserGroupMember (UserGroupId = 5, UserId = 10)
   ├─ DELETE UserGroupMember (UserGroupId = 5, UserId = 11)
   └─ DELETE UserGroupMember (UserGroupId = 5, UserId = 12)

User (ID 10, 11, 12) megmaradnak! ✅
```

---

## ✅ STÁTUSZ ÖSSZEFOGLALÓ

| Funkció | Backend | Frontend | Megjegyzés |
|---------|---------|----------|------------|
| Csoport létrehozása | ✅ Kész | ❌ Hiányzik | POST /api/user-groups |
| Csoport módosítása | ✅ Kész | ❌ Hiányzik | PUT /api/user-groups/{id} |
| Csoport törlése | ✅ Kész | ❌ Hiányzik | DELETE /api/user-groups/{id} |
| Cascade delete | ✅ Kész | - | Tagságok automatikusan törlődnek |
| Csoport listázása | ✅ Kész | ❌ Hiányzik | GET /api/user-groups |
| Csoport részletei | ✅ Kész | ❌ Hiányzik | GET /api/user-groups/{id} |
| Tag hozzáadása | ✅ Kész | ❌ Hiányzik | POST /api/user-groups/{id}/members |
| Tag eltávolítása | ✅ Kész | ❌ Hiányzik | DELETE /api/user-groups/{id}/members/{userId} |
| User csoportjai | ✅ Kész | ❌ Hiányzik | GET /api/user-groups/user/{userId} |
| Workflow round-robin | ✅ Kész | - | Service metódus |
| **Jogosultságok** | ❌ Nincs | ❌ Nincs | **Teljes Permission rendszer hiányzik** |

**Ami TELJESEN készen van:** UserGroup CRUD + Tagság kezelés (Backend)
**Ami TELJESEN hiányzik:** Frontend UI + Permission rendszer (Backend + Frontend)

---

## 🚀 KÖVETKEZŐ LÉPÉS

Szeretnéd hogy:
1. **Implementáljam a UserGroupsPage.vue-t** (2-3 óra, Permission nélkül)?
2. **Implementáljam a teljes Permission rendszert** (Backend 4-6 óra + Frontend 3-4 óra)?
3. **Írjak Cursor útmutatót** a UserGroupsPage.vue-hoz (hasonló az ADMIN_FRONTEND_CURSOR_GUIDE.md-hoz)?
4. **Csak Permission rendszer design dokumentumot** (adatbázis séma, API endpoints, implementációs terv)?

**Melyikre van szükséged?**
