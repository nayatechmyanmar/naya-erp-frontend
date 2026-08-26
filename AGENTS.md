<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# AGENTS.md — ERP Frontend Engineering & UX Rules

## 0. Purpose

This repository is the frontend of a **multi-tenant ERP SaaS**.

The application must be designed so that the same codebase can serve many businesses without business-specific recoding.

### Required stack

- Next.js `16.3.3`
- React `19.2.8`
- React DOM `19.2.8`
- TypeScript
- App Router
- BFF (Backend for Frontend)
- The BFF communicates with the existing ERP API
- The API is backed by a multi-tenant ERP database
- UI should support both light and dark mode
- Prefer Material 3 / Odoo-inspired usability and visual discipline
- Prefer clean, dense-but-readable enterprise UI over decorative UI

---

# 1. Core Product Philosophy

Build an ERP that feels:

- obvious
- calm
- fast
- predictable
- information-rich
- configurable
- professional
- easy for first-time business users
- scalable for large organizations

Do NOT build a traditional "everything is a page" enterprise application where every button opens another route.

The preferred mental model is:

> **One main screen per business module.**

The main screen should act as the user's workspace and expose the relevant operations without forcing unnecessary navigation.

Examples:

- Products → one Products workspace
- Purchasing → one Purchasing workspace
- Inventory → one Inventory workspace
- Manufacturing → one Manufacturing workspace
- Sales → one Sales workspace
- Accounting → one Accounting workspace
- Reports → one Reports workspace

Inside each workspace, use the appropriate UI primitive for the task:

- Dialog → quick create/edit/confirm
- Sheet → contextual create/edit/detail interaction
- Sidebar → navigation/filter/context
- Detail page → complex entity inspection
- Tabs → closely related views
- Popover → small contextual controls
- Dropdown/menu → secondary actions
- Command/search → fast discovery
- Full page → only when the task genuinely requires a dedicated workspace

Avoid route explosion.

---

# 2. Multi-Tenant Architecture

The frontend must never assume a single company.

The conceptual hierarchy is:

```text
Tenant
  └── Branch
       └── Warehouse
            └── Inventory
```

Business data is tenant-scoped.

Examples:

```text
Products
Suppliers
Customers
Warehouses
Purchase Orders
Purchase Receipts
Inventory
BOMs
Production Orders
Sales Orders
Shipments
Payments
Accounts
Journal Entries
```

must always operate within the currently authenticated tenant.

## Never trust tenant_id from the browser

The browser must not be treated as the authority for tenant isolation.

The backend/BFF must derive tenant context from the authenticated session/token and enforce it when calling the API.

Bad:

```ts
fetch("/api/products?tenant_id=123")
```

Better:

```ts
fetch("/api/products")
```

with the BFF deriving the active tenant from the authenticated user/session.

---

# 3. Tenant Context

The frontend may expose:

- active tenant
- active branch
- optionally active warehouse

but these are application context, not security boundaries.

Recommended conceptual state:

```ts
type OrganizationContext = {
  tenantId: string
  tenantName: string
  branchId?: string
  branchName?: string
  warehouseId?: string
  warehouseName?: string
}
```

The active context should be easy to understand visually.

Example header:

```text
ABC Manufacturing Co.
Mandalay Branch
```

Do not force users to repeatedly select the tenant/branch if their access is unambiguous.

If a user has access to multiple tenants or branches, provide a clear context switcher.

---

# 4. BFF Architecture

The browser communicates with the Next.js BFF.

The browser should NOT directly depend on the ERP API.

Preferred flow:

```text
Browser
   ↓
Next.js UI
   ↓
Next.js BFF
   ↓
ERP API
   ↓
Database
```

The BFF is responsible for:

- authentication/session handling
- tenant context
- authorization-aware API calls
- request validation
- API aggregation
- response normalization
- hiding internal API details
- preventing unnecessary client exposure
- handling API errors consistently
- adapting API data into UI-friendly shapes

Do not leak internal API URLs, secrets, service credentials, or implementation details into client components.

---

# 5. BFF Organization

Prefer feature-oriented API routes.

Example:

```text
app/
  api/
    products/
      route.ts
    suppliers/
      route.ts
    purchase-orders/
      route.ts
    purchase-receipts/
      route.ts
    inventory/
      route.ts
    production-orders/
      route.ts
    sales-orders/
      route.ts
    payments/
      route.ts
    accounting/
      route.ts
```

For larger features:

```text
app/
  api/
    products/
      route.ts
      [id]/
        route.ts
```

Keep BFF handlers thin.

Business rules belong primarily in the backend/domain layer, not duplicated inside the Next.js frontend.

The BFF should orchestrate and adapt, not become a second ERP backend.

---

# 6. Recommended Frontend Structure

Prefer feature/domain organization over technical dumping grounds.

Recommended:

```text
src/
  app/
    (app)/
      dashboard/
      products/
      purchasing/
      inventory/
      manufacturing/
      sales/
      accounting/
      reports/

    api/
      products/
      purchasing/
      inventory/
      manufacturing/
      sales/
      accounting/

  features/
    products/
      components/
      hooks/
      schemas/
      types/
      queries/
      mutations/
      utils/

    purchasing/
      components/
      hooks/
      schemas/
      types/
      queries/
      mutations/

    inventory/
    manufacturing/
    sales/
    accounting/
    reports/

  components/
    ui/
    layout/
    data-table/
    forms/
    dialogs/
    sheets/
    command/
    feedback/

  lib/
    api/
    auth/
    tenant/
    permissions/
    formatting/
    validation/

  types/
```

Avoid giant generic folders such as:

```text
components/
  ProductTable.tsx
  PurchaseDialog.tsx
  SaleDialog.tsx
  RandomThing.tsx
  ...
```

if those components only belong to one business domain.

Keep domain-specific components close to their feature.

---

# 7. Main Screen Principle

Every major module should have one obvious primary workspace.

Example:

```text
Purchasing
┌────────────────────────────────────────────────────┐
│ Purchasing                         + New Purchase  │
├────────────────────────────────────────────────────┤
│ Search    Status    Supplier    Date               │
├────────────────────────────────────────────────────┤
│ Purchase Orders                                     │
│                                                    │
│ PO-0001   ABC Supplier   Confirmed   12 Aug       │
│ PO-0002   XYZ Supplier   Received    13 Aug       │
└────────────────────────────────────────────────────┘
```

The user should be able to:

- search
- filter
- sort
- create
- inspect
- edit
- cancel
- receive
- print/export
- perform contextual actions

from this workspace.

Do not make users navigate through:

```text
Purchasing
→ Purchase Orders
→ Purchase Order List
→ Purchase Order Detail
→ Purchase Receipt
→ Receipt Detail
```

unless the workflow genuinely needs dedicated pages.

---

# 8. When to Use a Dialog

Use a dialog for:

- quick create
- quick edit
- confirmation
- small forms
- status changes
- assigning a team
- selecting a warehouse
- small product/customer/supplier forms

Examples:

```text
+ New Product
Edit Supplier
Confirm Purchase Order
Assign Sales Team
Adjust Stock
```

Dialogs should not become miniature applications.

If a form has many sections, many dependent fields, large tables, or complex workflows, use a Sheet or dedicated detail page.

---

# 9. When to Use a Sheet

Use a Sheet for contextual workflows that are more substantial than a dialog but should not interrupt the main workspace.

Good examples:

```text
Click Purchase Order
       ↓
Right-side Sheet
       ↓
PO summary
Supplier
Items
Totals
Status
Actions
```

This allows users to inspect an entity without losing the main list context.

Sheets are especially useful for:

- entity previews
- editing moderately complex records
- assignment workflows
- inventory movement details
- shipment details
- payment details

---

# 10. When to Use a Detail Page

Use a dedicated detail page when the entity has enough information to justify a full workspace.

Examples:

- Production Order
- complex Sales Order
- complex Purchase Order
- Journal Entry
- Customer account history
- Supplier account history
- Product master detail
- Inventory analysis

A detail page should still feel like part of the module, not a completely different application.

---

# 11. Sidebar Design

Use a persistent application sidebar for major modules.

Recommended:

```text
ERP
────────────────
Dashboard

Sales
Purchasing
Inventory
Manufacturing
Accounting
Reports

────────────────
Settings
```

Do not put every action into the sidebar.

The sidebar is for **navigation**, not for every operation.

Actions belong inside the current module.

---

# 12. Navigation Rules

Navigation should answer:

> "Where am I?"

and the current workspace should answer:

> "What can I do here?"

Avoid deeply nested navigation.

Bad:

```text
Inventory
  └── Stock
      └── Warehouse
          └── Product
              └── Movement
                  └── Adjustment
```

Prefer:

```text
Inventory
├── Stock Overview
├── Transfers
├── Movements
└── Adjustments
```

with contextual dialogs/sheets for most operations.

---

# 13. UI Density

ERP software needs information density, but density must be controlled.

Prefer:

- compact tables
- clear column hierarchy
- readable row height
- sticky headers where useful
- subtle separators
- consistent spacing
- strong typography hierarchy
- meaningful badges

Avoid:

- huge cards for every metric
- excessive whitespace
- oversized icons
- decorative gradients everywhere
- unnecessary animations
- giant dashboard widgets that hide useful data

The goal is:

> **Dense enough for work, calm enough for humans.**

---

# 14. Tables Are First-Class ERP UI

Tables should be excellent.

Every important table should consider:

- search
- filters
- sorting
- pagination
- column visibility
- row actions
- bulk selection
- responsive behavior
- loading state
- empty state
- error state

Example:

```text
┌─────────────────────────────────────────────────────────┐
│ Products                              + New Product     │
├─────────────────────────────────────────────────────────┤
│ Search products...   Category ▾   Type ▾   Status ▾    │
├─────────────────────────────────────────────────────────┤
│ □ SKU       Product        Type          Stock    ...   │
│ □ RM-001    Flour         Raw Material   500 kg   ...  │
│ □ FG-001    Bean Cake     Finished Good  120 pcs  ...  │
└─────────────────────────────────────────────────────────┘
```

Do not render huge datasets entirely on the client.

Use server-side pagination/filtering when appropriate.

---

# 15. Status UX

ERP records have lifecycle states.

Represent status visually and consistently.

Examples:

```text
DRAFT
CONFIRMED
POSTED
CANCELLED
COMPLETED
PARTIALLY_RECEIVED
FULLY_RECEIVED
```

Use compact badges/chips.

Do not rely only on color.

Good:

```text
● Confirmed
● Partially Received
● Cancelled
```

with color + text.

---

# 16. Actions Should Be Obvious

Users should not have to guess where common actions are.

Primary action:

```text
+ New Purchase
```

Secondary actions:

```text
More ▾
```

Contextual actions:

```text
Receive
Assign
Ship
Post
Cancel
Print
Export
```

Use action placement consistently across modules.

A user who learns how Sales works should already understand Purchasing.

---

# 17. Progressive Disclosure

Do not show everything at once.

Show:

```text
Primary information
      ↓
Common actions
      ↓
Secondary information
      ↓
Advanced options
```

Use:

- expandable sections
- tabs
- sheets
- popovers
- "More" menus

instead of giant forms.

---

# 18. Forms

Forms must follow business workflow order.

Example Purchase Order:

```text
Supplier
Date
Delivery Date

Items
  Product
  UOM
  Quantity
  Rate
  Amount

Totals

Notes / Additional Information

[Cancel] [Save Draft] [Confirm]
```

Do not organize fields based on database table order.

Organize based on how humans perform the business task.

---

# 19. Smart Defaults

The ERP should reduce thinking.

Examples:

If user is currently in:

```text
ABC Manufacturing
Mandalay Branch
```

and creates a Purchase Receipt:

- tenant → current tenant
- branch → current branch
- warehouse → default branch warehouse
- date → today
- UOM → product base UOM
- currency → tenant default currency
- user → current user

Users should be able to change valid defaults, but should not have to repeatedly configure them.

---

# 20. Contextual Intelligence

The UI should proactively help users.

Examples:

When creating Sales Order:

```text
Product: Bean Cake
Available Stock: 120 pcs
Requested: 150 pcs

⚠ Insufficient stock
Available: 120
Requested: 150
```

When receiving purchase:

```text
Ordered: 500 kg
Received: 450 kg

Remaining: 50 kg
```

When shipping:

```text
Ordered: 100
Already shipped: 40
Remaining: 60
```

The UI should surface these facts instead of forcing users to calculate them manually.

---

# 21. Inventory UX

Inventory should make warehouse state immediately understandable.

Main Inventory screen can contain:

```text
Inventory
────────────────────────────────────────
[Stock] [Movements] [Transfers] [Adjustments]

Warehouse ▾
Search product...

Stock Value
Low Stock
Total Items
Recent Movements

Product table
```

Do not create separate navigation pages for every tiny inventory operation.

---

# 22. Manufacturing UX

Manufacturing should center around Production Orders.

Main screen:

```text
Manufacturing
────────────────────────────────────────
[Production Orders] [BOMs]

+ New Production

Production No
BOM
Output Product
Planned Qty
Actual Qty
Warehouse
Status
```

Production detail:

```text
Production Order #PR-0001

Output
Bean Cake
100 pcs

Materials
Flour       20 kg
Sugar        5 kg
Oil          2 L

[Start Production]
[Complete]
[Cancel]
```

The system should make material consumption and output movement understandable.

---

# 23. Sales UX

Sales should be customer-centric.

Main screen:

```text
Sales
────────────────────────────────────────
[Orders] [Shipments] [Customers]

+ New Sales Order

Search
Status
Customer
Sales Team
Date

Orders
```

Order detail should clearly show:

```text
Customer
Items
Order total
Stock availability
Assigned Sales Team
Shipment progress
Payment status
```

Do not force the user to open five screens to understand one order.

---

# 24. Accounting UX

Accounting must be accurate before it is beautiful.

Main areas:

```text
Accounting
────────────────────────────────────────
[Overview]
[Journal]
[Accounts]
[Receivables]
[Payables]
[Reports]
```

Journal entry UI should make double-entry obvious:

```text
Account                  Debit       Credit
------------------------------------------------
Cash                     100,000
Sales Revenue                        100,000
------------------------------------------------
Total                    100,000     100,000
```

Always show:

```text
Balanced ✓
```

or:

```text
Not balanced
Difference: 5,000
```

Never allow an invalid posted journal entry.

---

# 25. Reporting UX

Reports should be task-oriented.

Avoid a giant list called "Reports".

Prefer grouped categories:

```text
Sales
  Sales Summary
  Sales by Customer
  Sales by Product

Inventory
  Stock Valuation
  Stock Movement
  Low Stock

Purchasing
  Purchase Summary
  Supplier Purchases

Accounting
  Profit & Loss
  Balance Sheet
  Trial Balance
  General Ledger
```

Use filters at the top:

```text
Date Range
Branch
Warehouse
Customer
Supplier
Product
```

Reports should be exportable where appropriate.

---

# 26. Dashboard Philosophy

The dashboard is not the place to put every possible statistic.

Show only information useful for daily decisions.

Examples:

```text
Today's Sales
Outstanding Receivables
Outstanding Payables
Low Stock
Pending Purchases
Pending Shipments
Production in Progress
Cash Balance
```

Allow users to drill into the source module.

Example:

```text
Low Stock: 8
      ↓
Inventory workspace filtered to low-stock items
```

---

# 27. Light and Dark Mode

Every UI must support both light and dark mode.

Do not hard-code colors such as:

```css
background: white;
color: black;
```

Prefer semantic theme tokens.

Use the project's design system/theme variables.

Think in semantic roles:

```text
background
foreground
card
muted
border
primary
secondary
destructive
success
warning
info
```

The UI should remain readable and professional in both modes.

Avoid pure black backgrounds and excessively bright colors.

Prefer a clean Material 3 / Odoo-inspired neutral foundation.

---

# 28. Color Rules

Color communicates meaning.

Recommended semantic usage:

```text
Primary     → main action / brand
Success     → completed / healthy / positive
Warning     → attention / pending
Destructive → delete / cancel / dangerous
Muted       → secondary information
Info        → informational state
```

Do not use different arbitrary colors for every module.

The ERP should feel like one coherent product.

---

# 29. Responsive Design

The application must work across:

- desktop
- laptop
- tablet
- smaller screens where practical

ERP desktop layouts can be dense, but do not make responsive behavior an afterthought.

For smaller screens:

- tables can become horizontally scrollable
- important columns stay visible
- secondary actions move into menus
- dialogs can become full-screen sheets
- sidebars can collapse

Do not simply shrink desktop UI until it becomes unusable.

---

# 30. Accessibility

Every feature must consider:

- keyboard navigation
- focus states
- labels
- semantic buttons
- accessible dialogs
- accessible forms
- contrast
- screen reader-friendly structure

Do not use clickable `<div>` elements when a button/link is appropriate.

---

# 31. Loading States

Avoid blank screens.

Use:

- skeletons
- inline loading indicators
- disabled submit buttons
- optimistic UI only when safe

For tables, use table-aware skeleton rows rather than replacing the entire page with a spinner.

---

# 32. Empty States

Empty states should explain what the user can do.

Bad:

```text
No data
```

Better:

```text
No purchase orders yet.

Create your first purchase order to start tracking supplier purchases.

[+ New Purchase]
```

---

# 33. Error Handling

Errors should be actionable.

Bad:

```text
Something went wrong.
```

Better:

```text
Unable to receive this purchase.

The warehouse currently has insufficient configuration.

[Review Warehouse]
```

API errors should be normalized by the BFF where possible.

Never expose raw backend stack traces to users.

---

# 34. Destructive Actions

Use confirmation dialogs for destructive or irreversible operations.

Examples:

```text
Cancel Purchase Order?
Delete Product?
Cancel Shipment?
Post Journal Entry?
```

Explain consequences briefly.

Avoid confirmation dialogs for harmless actions.

---

# 35. URL and Routing Philosophy

Use URLs for meaningful workspaces and deep-linkable state.

Good:

```text
/products
/purchasing
/inventory
/manufacturing
/sales
/accounting
/reports
```

Detail pages:

```text
/purchasing/orders/123
/sales/orders/456
/manufacturing/production-orders/789
```

Use query parameters for filters/search where useful:

```text
/inventory?warehouse=12&status=LOW_STOCK
```

This allows users to bookmark/share useful views.

Do not create routes for every dialog.

A dialog can be URL-addressable only when there is a real product benefit.

---

# 36. Server vs Client Components

Prefer React Server Components by default.

Use Client Components when needed for:

- interaction
- browser APIs
- stateful UI
- forms requiring client interaction
- dialogs/sheets
- tables with client-side interactions
- command palettes
- interactive filters

Do not add `"use client"` to entire pages unnecessarily.

Keep client boundaries small.

---

# 37. Data Fetching

Prefer server-side fetching where practical.

Use client fetching for:

- highly interactive data
- live filtering
- mutation-driven refresh
- client-only workflows

Avoid duplicate API requests from both Server Components and Client Components unless necessary.

Create reusable typed query/mutation functions.

---

# 38. Type Safety

Do not use `any` as an escape hatch.

Define types for:

- API responses
- API requests
- entities
- pagination
- filters
- mutations
- validation schemas

Keep API types separate from UI view models when the API shape is not ideal for rendering.

Example:

```ts
type Product = {
  id: string
  name: string
  sku: string
  productType: ProductType
}
```

---

# 39. Validation

Validate at multiple boundaries.

Client:

- fast feedback
- user-friendly messages

BFF:

- request shape validation
- authorization/context validation

Backend:

- authoritative business rules

Never rely only on client validation.

---

# 40. Avoid Frontend Business Logic Duplication

Do not recreate ERP accounting/inventory rules in React.

For example, the frontend should not independently decide:

```text
Can this journal be posted?
Can this shipment exceed the order?
Can this warehouse transfer occur?
What is the inventory valuation?
```

The frontend can display these rules and provide helpful pre-validation, but the backend remains authoritative.

---

# 41. Performance

Prefer:

- server rendering
- streaming where useful
- pagination
- selective fetching
- debounced search
- virtualization for genuinely large datasets
- memoization only when justified
- small client components
- minimal JavaScript shipped to the browser

Do not prematurely optimize tiny lists.

Optimize actual bottlenecks.

---

# 42. Component Design

Build reusable primitives, not giant universal components.

Good:

```text
DataTable
FilterBar
StatusBadge
EntityPicker
MoneyDisplay
QuantityDisplay
DateDisplay
ConfirmDialog
EntitySheet
EmptyState
ErrorState
```

Avoid:

```text
MegaERPComponent.tsx
UniversalForm.tsx
UniversalTable.tsx
EverythingDialog.tsx
```

A reusable component should have a clear responsibility.

---

# 43. Avoid Nested UI Hell

Avoid patterns such as:

```text
Dialog
  └── Dialog
      └── Sheet
          └── Dialog
              └── Popover
                  └── Dialog
```

This creates poor UX and difficult state management.

Instead, simplify the workflow.

For example:

```text
Product Picker
    ↓
Select Product
    ↓
Inline quick-create if necessary
```

rather than opening multiple layers of dialogs.

If a workflow becomes deeply nested, reconsider the information architecture.

---

# 44. Feature-rich Does NOT Mean Feature-crowded

A feature-rich UI should expose capabilities progressively.

The user should see:

```text
What I need now
```

while advanced features remain available through:

```text
More
Advanced
Details
Settings
```

Do not expose every database field on the main screen.

---

# 45. Consistency Across Modules

If "New" works one way in Sales, it should feel similar in Purchasing.

If filters work one way in Inventory, use the same pattern in Sales.

If statuses use badges, use the same badge system everywhere.

If detail sheets use the right side, do not randomly put them on the left in another module.

Consistency reduces cognitive load.

---

# 46. Business Workflow First

Design UI from the business workflow, not the database.

Example:

Database:

```text
SalesOrders
SalesOrderItems
SalesOrderAssignments
SalesShipments
SalesShipmentItems
Payments
```

The user should not experience six separate concepts.

The user should experience:

```text
Sales
  ↓
Create Order
  ↓
Assign Team
  ↓
Ship
  ↓
Deliver
  ↓
Receive Payment
```

The UI should connect these operations naturally.

---

# 47. Cross-Module Navigation

Entities should provide contextual links.

Example:

```text
Purchase Receipt
   ↓
Purchase Order
   ↓
Supplier
   ↓
Inventory Movement
   ↓
Warehouse
```

Sales:

```text
Sales Order
   ↓
Customer
   ↓
Shipment
   ↓
Inventory Movement
   ↓
Payment
   ↓
Journal Entry
```

This creates a connected ERP rather than isolated CRUD screens.

---

# 48. Do Not Build CRUD for CRUD's Sake

Every screen must answer:

> "What business decision or action does this screen support?"

If a table merely mirrors a database table but provides no useful workflow, redesign it.

ERP users care about:

- what needs attention
- what is pending
- what changed
- what they can do
- why an action is unavailable
- what the financial/stock impact is

---

# 49. Permission-Aware UI

Hide or disable actions based on permissions.

Examples:

Warehouse staff:

```text
View inventory
Receive stock
Transfer stock
```

Accounting staff:

```text
Payments
Journal entries
Reports
```

Sales staff:

```text
Sales orders
Customers
Shipments
```

Admin:

```text
Everything allowed by role
```

But remember:

> UI permission checks are for UX. Backend authorization is the security boundary.

---

# 50. Auditability

ERP operations must be traceable.

When displaying important records, consider showing:

```text
Created by
Created date
Last modified by
Last modified date
Status history
Reference
```

Do not clutter the main view. Put audit details in a details section/sheet when appropriate.

---

# 51. Financial Formatting

Use consistent formatting utilities for:

- currency
- decimals
- quantities
- percentages
- dates
- date ranges

Do not manually format monetary values throughout components.

Example:

```ts
formatCurrency(amount)
formatQuantity(quantity, uom)
formatDate(date)
```

The tenant's configuration should eventually control:

- currency
- decimal precision
- date format
- timezone
- locale

---

# 52. Internationalization

Do not assume English-only text.

The ERP may eventually support:

- English
- Burmese
- other tenant-specific languages

Avoid hardcoding user-facing text in deeply nested components.

Keep labels/messages structured so i18n can be introduced without rewriting the application.

---

# 53. Testing Expectations

For important workflows, test business-facing behavior.

Prioritize:

```text
Login
Tenant switching
Branch switching
Product creation
Purchase → Receipt → Inventory
Inventory → Production → Finished Goods
Sales Order → Assignment → Shipment
Payment → Journal Entry
Daily Closing
Reports
```

Do not only test isolated components.

Test the workflow.

---

# 54. Definition of Done for a Module

A module is not complete merely because CRUD works.

A module should have:

- main workspace
- search
- filters
- pagination where needed
- create flow
- edit flow
- detail/inspection flow
- relevant actions
- loading state
- empty state
- error state
- permission-aware actions
- responsive layout
- light/dark mode
- keyboard/accessibility support
- BFF integration
- tenant isolation
- branch context where relevant
- API error handling

---

# 55. Recommended Module Layout

Use this as the default pattern:

```text
Module
│
├── Header
│    ├── Title
│    ├── Description
│    └── Primary Action
│
├── Context
│    ├── Tenant
│    ├── Branch
│    └── Warehouse if relevant
│
├── Toolbar
│    ├── Search
│    ├── Filters
│    ├── Sort
│    └── View options
│
├── Main Data Area
│    └── Table / Cards / Board
│
├── Contextual UI
│    ├── Dialog
│    ├── Sheet
│    └── Popover
│
└── Detail Page
     └── Only when complexity justifies it
```

---

# 56. Example: Products Main Screen

```text
Products
Manage products, stock behavior, units and categories.

[+ New Product]

Search products...

Category ▾
Type ▾
Active ▾

────────────────────────────────────────────
SKU      Product       Type             UOM
────────────────────────────────────────────
RM-001   Flour         Raw Material     KG
RM-002   Sugar         Raw Material     KG
FG-001   Bean Cake     Finished Good    PCS
PK-001   Plastic Bag   Packaging        PCS
```

Clicking a row:

```text
→ Product Sheet
```

Complex product:

```text
→ /products/[id]
```

Creating:

```text
→ Dialog
```

No unnecessary page transition.

---

# 57. Example: Purchase Main Screen

```text
Purchasing

[+ New Purchase]

Search...
Supplier ▾
Status ▾
Date ▾

Pending Receipts: 8
Pending Payments: 14

Purchase Orders
──────────────────────────────────────
PO       Supplier     Status
PO-001   Alice        Confirmed
PO-002   Bob          Partial
PO-003   David        Fully Received
```

Row actions:

```text
View
Edit
Receive
Cancel
Print
More
```

Receiving opens a Sheet or dedicated workflow depending on complexity.

---

# 58. Example: Sales Main Screen

```text
Sales

[+ New Order]

Search...
Customer ▾
Sales Team ▾
Status ▾

Orders
────────────────────────────────────────
SO       Customer    Team       Status
SO-001   ABC Store   Group A    Confirmed
SO-002   XYZ Shop    Group B    Shipped
```

Click:

```text
→ Order Sheet
```

Actions:

```text
Assign Team
Ship
View Customer
Record Payment
Print
More
```

---

# 59. Code Quality Rules

Prefer:

- small components
- explicit names
- typed APIs
- feature-local code
- reusable UI primitives
- predictable state
- clear server/client boundaries
- composition over inheritance
- simple data flow

Avoid:

- giant page components
- giant hooks
- deeply nested conditional rendering
- duplicated API calls
- duplicated validation
- arbitrary global state
- hidden side effects
- magic strings everywhere
- `any`
- unnecessary abstraction

---

# 60. Global State

Do not put all ERP data into one giant global store.

Use local state for local UI.

Use server/cache state for server data.

Use global state only for genuinely global concerns:

```text
auth/session
tenant context
theme
UI preferences
```

Do not turn Zustand/Redux/etc. into a second database.

---

# 61. Final Agent Checklist

Before implementing a feature, ask:

### Architecture
- Does this belong to a domain/feature?
- Is the browser talking through the BFF?
- Is tenant context enforced?
- Is branch context handled?

### UX
- Can this live inside an existing module workspace?
- Does it really need a new route?
- Should this be a dialog?
- Should this be a sheet?
- Should this be a detail page?
- Can the user understand what to do without instructions?

### UI
- Does it support light and dark mode?
- Is the information hierarchy obvious?
- Are primary actions obvious?
- Is the UI dense but readable?
- Are empty/loading/error states handled?
- Is the design consistent with the rest of the ERP?

### Data
- Is server-side pagination/filtering appropriate?
- Are API types defined?
- Are mutations validated?
- Are backend rules treated as authoritative?

### Enterprise readiness
- Does tenant isolation remain intact?
- Are permissions respected?
- Can the feature work for one branch or many branches?
- Does the UI avoid assumptions about a specific company's workflow?

---

# 62. Golden Rule

When choosing between:

```text
More pages
```

and

```text
One strong workspace with contextual UI
```

prefer:

> **One strong workspace with contextual UI.**

When choosing between:

```text
More features visible
```

and

```text
Progressive disclosure
```

prefer:

> **Progressive disclosure.**

When choosing between:

```text
Database structure
```

and

```text
Business workflow
```

prefer:

> **Business workflow.**

When choosing between:

```text
Beautiful decoration
```

and

```text
Clear information hierarchy
```

prefer:

> **Clear information hierarchy.**

The goal is not to make an ERP that looks complicated enough to feel "enterprise".

The goal is to make an ERP that can handle enterprise complexity **without making the user feel that complexity**.
