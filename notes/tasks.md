# Task Breakdown

This breakdown assumes a phased approach, building core functionality first.

## Phase 0: Project Setup & Foundation (Est. ~1-2 days)

1.  **Task 0.1:** Initialize `Next.js` 15+ project.
2.  **Task 0.2:** Integrate `Tailwind CSS`.
3.  **Task 0.3:** Set up and configure `Shadcn-UI`.
4.  **Task 0.4:** Set up `Supabase` project (Database, Auth).
5.  **Task 0.5:** Define initial Database Schema in `Supabase` (Users, Roles, Products, InventoryLogs, Orders, OrderItems, Categories [simple]).
6.  **Task 0.6:** Implement basic App Layout (Navbar, Sidebar/Main content area) using `Shadcn` components.
7.  **Task 0.7:** Set up basic Routing structure in `Next.js`.
8.  **Task 0.8:** Configure `Supabase` client in `Next.js` app.

## Phase 1: Authentication & User Management (Est. ~3-5 days)

1.  **Task 1.1:** Create Login Page UI (`Shadcn` Input, Button, Card).
2.  **Task 1.2:** Implement Login Logic using `Supabase Auth` (email/password).
3.  **Task 1.3:** Implement Logout functionality.
4.  **Task 1.4:** Implement session management/protected routes (middleware or HOC).
5.  **Task 1.5:** Define Roles in DB and implement basic Role-Based Access Control (RBAC) checks (using `Supabase` RLS is ideal).
6.  **Task 1.6 (Admin):** Create User Management Page UI (`Shadcn` Table, Dialog/Form for Add/Edit).
7.  **Task 1.7 (Admin):** Implement Backend logic for User CRUD (interacting with `Supabase auth.users` and a `profiles` table).
8.  **Task 1.8 (Admin):** Implement Activate/Deactivate User logic.

## Phase 2: Product & Inventory Management (Est. ~4-6 days)

1.  **Task 2.1 (Admin):** Create Product Management Page UI (Table, Add/Edit Form using `Shadcn` Dialog/Form).
2.  **Task 2.2 (Admin):** Implement Backend logic for Product CRUD (`Supabase` DB interactions). Link Products to an initial inventory concept.
3.  **Task 2.3 (Admin):** Implement Product Search/Filter functionality on the list page.
4.  **Task 2.4 (Admin):** Design Inventory representation (e.g., quantity field on Product table).
5.  **Task 2.5 (Admin):** Implement UI for Manual Stock Adjustment (e.g., a button on product list/edit form leading to a simple form - Product, Change Quantity, Reason).
6.  **Task 2.6 (Admin):** Implement Backend logic for Manual Stock Adjustment (update inventory, potentially log adjustment).
7.  *(Consider Task 2.7: Add simple Category management - CRUD for categories, link products)*

## Phase 3: Core POS/Checkout (Est. ~5-8 days - *Critical Path*)

1.  **Task 3.1:** Design and Implement POS Interface Layout (Product selection area, Cart area, Totals, Payment area).
2.  **Task 3.2:** Implement Product Selection logic (Search component querying products table, display results, add to cart action). Handle barcode scanner input (treat as keyboard input into search).
3.  **Task 3.3:** Implement Cart state management (add item, update quantity, remove item, calculate subtotal/taxes/total).
4.  **Task 3.4:** Implement Payment section UI (Select Method, Tendered Amount for Cash, Display Change Due).
5.  **Task 3.5:** Implement "Complete Sale" logic:
    *   Validate cart and payment details.
    *   Create Order record in `Supabase` DB.
    *   Create OrderItems records in `Supabase` DB.
    *   **Crucially:** Update Inventory levels for sold items (use a `Supabase` Transaction or Edge Function for atomicity).
    *   Clear cart, display success/change due, ready for next sale.
6.  **Task 3.6:** Basic Receipt display (simple modal or new tab with sale details, browser print CSS).

## Phase 4: Order Management & Dashboard (Est. ~3-5 days)

1.  **Task 4.1 (Admin):** Create Order History Page UI (`Shadcn` Table to list orders).
2.  **Task 4.2 (Admin):** Implement Backend logic to fetch and display orders.
3.  **Task 4.3 (Admin):** Implement Order Detail View UI (Modal or separate page showing order specifics).
4.  **Task 4.4 (Admin):** Implement Order Search/Filter (by Date range primarily).
5.  **Task 4.5:** Implement Dashboard UI.
6.  **Task 4.6:** Implement Backend logic to fetch data for Dashboard widgets (e.g., Today's Sales - requires querying Orders table). Tailor widgets based on Role.

## Phase 5: Reporting & Polish (Est. ~3-5 days)

1.  **Task 5.1 (Admin):** Create Basic Reporting Page UI structure.
2.  **Task 5.2 (Admin):** Implement Sales Summary Report (UI + Backend logic querying Orders).
3.  **Task 5.3 (Admin):** Implement Product Sales Report (UI + Backend logic querying OrderItems).
4.  **Task 5.4 (Admin):** Implement Inventory Levels Report (UI + Backend logic querying Products/Inventory).
5.  **Task 5.5:** UI/UX Polish: Review all flows, improve visual consistency, add loading states, refine component usage.
6.  **Task 5.6:** Implement comprehensive Form Validation and Error Handling feedback.
7.  **Task 5.7:** Cross-browser/device testing (focus on Desktop/Tablet).

## Phase 6: Deployment & Documentation (Est. ~1-2 days)

1.  **Task 6.1:** Set up Production environment in `Supabase`.
2.  **Task 6.2:** Configure Deployment (`Vercel` recommended for `Next.js`).
3.  **Task 6.3:** Final Testing in Production environment.
4.  **Task 6.4:** Write basic User Guide/Documentation (especially for Admin setup and Cashier operation).

---