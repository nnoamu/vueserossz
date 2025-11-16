# Cursor Parancs - Dashboard Implementálás

## Rövid Parancs (Cursor-nak add meg ezt):

```
Implementáld a Dashboard oldalt a DASHBOARD_IMPLEMENTATION.md útmutató alapján.

FONTOS követelmények:
1. Hozd létre a DashboardPage.vue komponenst (src/components/features/DashboardPage.vue)
2. Használd a meglévő komponenseket (AppLayout, BaseCard, BaseTable, BaseButton, StatusBadge)
3. Hívd meg a documentStore.fetchMyTasks(1, 5) API-t az első 5 dokumentum lekéréséhez
4. Implementálj egy táblázatot a következő oszlopokkal: Iktatószám, Szállító, Számlaszám, Státusz, Létrehozva, Műveletek
5. Add hozzá az "Új dokumentum iktatása" gombot (navigál /documents/upload)
6. Add hozzá az "Összes megtekintése" linket (navigál /documents)
7. Frissítsd a src/router/index.ts fájlt: cseréld le a LandingPage-et DashboardPage-re a /dashboard route-nál
8. OPCIONÁLIS: Implementálj statisztika kártyákat (Vázlat, Jóváhagyásra vár, Kész count)

MINTAKÓD REFERENCIA:
- Táblázat struktúra: DocumentsListPage.vue (de egyszerűbb, nincs pagination)
- Layout: AppLayout használata
- API hívás: documentStore.fetchMyTasks()
- Utility függvények: formatDateTime, StatusBadge komponens

KÓDOLÁSI SZABÁLYOK:
- Követi a meglévő Tailwind CSS stílust
- Használj slot-alapú BaseTable komponenst (lásd DocumentsListPage.vue)
- Implementálj loading state-et (documentStore.isLoading)
- Implementálj empty state-et ha nincs dokumentum
- Hibakezelés: try/catch + console.error
- NE módosítsd a meglévő komponenseket vagy store-okat

Részletes specifikáció: DASHBOARD_IMPLEMENTATION.md
```

## Részletes Parancs (ha a Cursor-nak több kontextus kell):

```
Olvasd el a DASHBOARD_IMPLEMENTATION.md fájlt és implementáld a Dashboard oldalt az alábbi követelmények szerint:

FÁJLOK LÉTREHOZÁSA/MÓDOSÍTÁSA:
1. CREATE: src/components/features/DashboardPage.vue
2. MODIFY: src/router/index.ts (LandingPage → DashboardPage csere a /dashboard route-nál)

KOMPONENS STRUKTÚRA (DashboardPage.vue):
```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header: "Dashboard" + "Új dokumentum iktatása" gomb -->

      <!-- OPCIONÁLIS: Statisztikák grid (3 kártya) -->

      <!-- Aktuális Ügyeim Widget -->
      <BaseCard title="Aktuális Ügyeim">
        <BaseTable :columns="columns" :data="documents" :loading="isLoading">
          <!-- Slot-ok: status, createdAt, actions -->
        </BaseTable>

        <!-- "Összes megtekintése" link -->
      </BaseCard>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
// 1. Importok (Vue, Router, Komponensek, Store, Types, Utils)
// 2. State (documents, isLoading)
// 3. Methods (loadDocuments, navigateToUpload, viewAllDocuments, openDocument)
// 4. Lifecycle (onMounted - loadDocuments())
</script>
```

API HÍVÁS:
- documentStore.fetchMyTasks(1, 5) - első 5 dokumentum
- Response: PaginatedResult<DocumentResponseDto>

TÁBLÁZAT OSZLOPOK:
- Iktatószám (archiveNumber) - font-mono
- Szállító (supplierName) - text-sm
- Számlaszám (invoiceNumber) - text-sm
- Státusz (status) - StatusBadge komponens
- Létrehozva (createdAt) - formatDateTime() utility
- Műveletek (actions) - "Megnyit" BaseButton (ghost, sm)

NAVIGÁCIÓ:
- "Új dokumentum iktatása" → /documents/upload
- "Összes megtekintése" → /documents
- "Megnyit" → /documents/:id

MINTAKÓD HELYEK:
- DocumentsListPage.vue:168-284 - táblázat implementáció referencia
- DocumentsListPage.vue:196-207 - loadDocuments() metódus minta
- BaseTable használat - slot-alapú oszlop customization

KÖVETELMÉNYEK:
✓ TypeScript típusok használata
✓ Error handling (try/catch)
✓ Loading state (isLoading computed)
✓ Empty state (ha documents.length === 0)
✓ Responsive design (Tailwind grid)
✓ Import sorrend betartása
✓ NE használj console.log
✓ NE módosítsd a meglévő komponenseket
✓ Követi a projekt coding style-t

Kezdd az implementálást!
```

## Alternatív Parancs (ha a Cursor lassú):

```
Hozz létre egy Dashboard oldalt lépésről-lépésre:

LÉPÉS 1: Hozd létre a DashboardPage.vue vázat
- AppLayout wrapper
- Header section (h1 + BaseButton)
- BaseCard a táblázatnak

LÉPÉS 2: Implementáld a script setup részt
- Import-ok: Vue, Router, komponensek, store, types, utils
- State: documents ref, isLoading computed
- loadDocuments() async function (fetchMyTasks API hívás)
- Navigation functions
- onMounted hook

LÉPÉS 3: Implementáld a BaseTable-t
- Columns definíció (6 oszlop)
- Slot-ok: cell-status, cell-createdAt, cell-actions
- Loading és empty state

LÉPÉS 4: Frissítsd a routingot
- router/index.ts: LandingPage → DashboardPage

LÉPÉS 5 (OPCIONÁLIS): Statisztikák
- Grid layout (3 kártya)
- Computed stats (draft, pending, done count)

Referencia: DASHBOARD_IMPLEMENTATION.md és DocumentsListPage.vue
```
