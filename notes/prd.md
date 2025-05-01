# Simple Elegant Modern POS (SEMPOS) - PRD

## 1. Introduction

### 1.1. Purpose

To define the requirements for SEMPOS, a web-based Point of Sale system designed for simplicity, elegance, and modern usability, targeting small to medium businesses.

### 1.2. Goals

*   Provide a fast, intuitive checkout experience.
*   Enable efficient management of products and inventory.
*   Offer basic insights through order history and simple reporting.
*   Ensure secure access control for different user roles.
*   Leverage modern web technologies (`Next.js`, `Shadcn-UI`, `Tailwind`, `Supabase`) for a performant and maintainable application.

### 1.3. Target Audience

*   **Admin:** Business owner or manager responsible for setup, product/user management, and viewing reports.
*   **Cashier:** Staff member primarily using the cash register/checkout interface to process sales.

### 1.4. Scope

*   **In Scope:** Features listed (Login, Dashboard, POS, Product Mgmt, Inventory Mgmt, Order Mgmt, Reporting, User Mgmt). Core functionality for single-location businesses.
*   **Out of Scope (for V1):** Advanced features like CRM, complex discount/promotion engine, multi-location support, detailed analytics, offline mode, direct hardware integration (beyond basic browser interactions like USB barcode scanner input), appointment booking, kitchen display systems.

## 2. Functional Requirements

### 2.1. Authentication & Authorization

*   **FR-AUTH-01:** Users must be able to log in using email and password.
*   **FR-AUTH-02:** The system must differentiate between 'Admin' and 'Cashier' roles.
*   **FR-AUTH-03:** Admins have access to all features.
*   **FR-AUTH-04:** Cashiers have access primarily to the Dashboard (limited view) and Cash Register/POS. Access to other sections should be restricted.
*   **FR-AUTH-05:** Users must be able to log out.
*   **FR-AUTH-06:** Session management should persist login status appropriately.
*   *(Consider: Password reset functionality)*

### 2.2. Dashboard

*   **FR-DASH-01:** Display key metrics upon login.
*   **FR-DASH-02 (Admin):** Show overview like Today's Sales, Total Sales (configurable period), Quick links to management sections. Maybe top-selling products or low-stock alerts.
*   **FR-DASH-03 (Cashier):** Show simpler view, maybe Today's Sales (for their session/day), Quick link to POS/Checkout.
*   **FR-DASH-04:** Dashboard data should update reasonably dynamically or upon refresh.

### 2.3. Cash Register / Checkout / POS

*   **FR-POS-01:** Interface for initiating a new sale.
*   **FR-POS-02:** Ability to add products to the cart/sale list (e.g., by searching name/SKU, clicking from a grid/list, potentially scanning barcode into a search field).
*   **FR-POS-03:** Display current sale items, quantities, individual prices, and subtotal.
*   **FR-POS-04:** Ability to adjust quantity of items in the cart.
*   **FR-POS-05:** Ability to remove items from the cart.
*   **FR-POS-06:** Calculate total amount including any applicable taxes (*Define simple tax logic - e.g., single rate*).
*   **FR-POS-07:** Allow selection of payment method (e.g., Cash, Card - *initially just record the type*).
*   **FR-POS-08:** For cash payments, provide a field to enter amount tendered and calculate change due.
*   **FR-POS-09:** Finalize/complete the sale, which records the order and updates inventory.
*   **FR-POS-10:** Option to start a new sale after completion.
*   *(Consider: Simple discount application - % or fixed amount off total)*
*   *(Consider: Basic receipt view/print option using browser print)*

### 2.4. Product Management (Admin Access)

*   **FR-PROD-01:** List all products with key details (Name, SKU, Price, Stock Quantity).
*   **FR-PROD-02:** Ability to Add a new product (Fields: Name, SKU, Category [*optional simple text*], Price, Initial Stock Quantity, Description [*optional*]).
*   **FR-PROD-03:** Ability to Edit an existing product's details.
*   **FR-PROD-04:** Ability to Delete a product (*consider implications - soft delete recommended if orders exist*).
*   **FR-PROD-05:** Search/filter products list (by name, SKU).
*   *(Consider: Product image upload)*

### 2.5. Inventory Management (Admin Access primarily, linked to Product Mgmt & POS)

*   **FR-INV-01:** Stock levels are displayed alongside products (in Product Management).
*   **FR-INV-02:** Stock levels automatically decrease when a sale is completed via POS.
*   **FR-INV-03 (Admin):** Ability to manually adjust stock levels for a product (e.g., for stock takes, receiving new inventory, breakages) with a reason/note.
*   **FR-INV-04:** Display low stock items (e.g., on Dashboard or a dedicated report). Define 'low stock' threshold (*maybe a global setting or per product*).

### 2.6. Order Management (Admin Access, potentially limited view for Cashiers)

*   **FR-ORD-01:** List all completed orders, sortable by date (most recent first).
*   **FR-ORD-02:** Display key order details in the list (Order ID, Date/Time, Total Amount, Cashier [*optional*]).
*   **FR-ORD-03:** Ability to view details of a specific order (Items sold, quantities, prices, subtotal, tax, total, payment method, timestamp, cashier).
*   **FR-ORD-04:** Search/filter orders (by date range, Order ID).
*   *(Consider V2: Order cancellation/refund processing)*

### 2.7. Reporting (Admin Access)

*   **FR-REP-01:** Simple Sales Summary report (Total sales, number of orders) filterable by date range (Today, Yesterday, Week, Month, Custom Range).
*   **FR-REP-02:** Basic Product Sales report (showing quantity sold per product) filterable by date range.
*   **FR-REP-03:** Inventory Levels report (List of products with current stock levels, highlighting low stock items).
*   *(Consider: Data visualization using simple charts)*

### 2.8. User Management (Admin Access)

*   **FR-USER-01:** List all users (Name, Email, Role, Status - Active/Inactive).
*   **FR-USER-02:** Ability to Add a new user (Assign Name, Email, Role - Cashier/Admin, Initial Password mechanism - *e.g., system generates temporary or admin sets*).
*   **FR-USER-03:** Ability to Edit user details (Name, Role).
*   **FR-USER-04:** Ability to Activate/Deactivate a user account (instead of deleting).
*   *(Consider: Admin ability to trigger password reset for a user)*

## 3. Non-Functional Requirements

### 3.1. Performance

*   **NFR-PERF-01:** POS/Checkout interface must load quickly and respond instantly to user actions (adding items, completing sale).
*   **NFR-PERF-02:** Management pages (Products, Orders) should load reasonably fast even with moderate data volume (e.g., 1000s of products/orders).

### 3.2. Usability

*   **NFR-USAB-01:** Interface should be intuitive and require minimal training, especially for Cashiers.
*   **NFR-USAB-02:** Consistent UI/UX across the application using `Shadcn-UI` and `Tailwind` principles.
*   **NFR-USAB-03:** Responsive design - Primarily optimized for desktop, but usable on tablets (especially the POS interface).

### 3.3. Security

*   **NFR-SEC-01:** Secure authentication and session management (Leverage `Supabase Auth`).
*   **NFR-SEC-02:** Role-based access control must be enforced backend-side (Leverage `Supabase Row Level Security` - RLS).
*   **NFR-SEC-03:** Input validation to prevent common vulnerabilities (XSS, SQLi - *`Supabase` helps with the latter*).

### 3.4. Reliability

*   **NFR-REL-01:** Data integrity must be maintained (e.g., inventory updates correctly on sale completion - use `Supabase` transactions/functions).

### 3.5. Maintainability

*   **NFR-MAIN-01:** Codebase should be well-structured, follow `Next.js` conventions, and include comments where necessary.
*   **NFR-MAIN-02:** Leverage reusable components from `Shadcn-UI`.

### 3.6. Technology Stack

*   **NFR-TECH-01:** Frontend: `Next.js` 15+, `Shadcn-UI`, `Tailwind CSS`.
*   **NFR-TECH-02:** Backend/Database: `Supabase` (Authentication, Database, potentially Edge Functions).

## 4. Design Considerations

*   **4.1. UI Theme:** Clean, minimal, modern aesthetic. Leverage `Shadcn-UI`'s design system.
*   **4.2. Key Interfaces:** Pay special attention to the design of the POS/Checkout screen for speed and ease of use. Product selection and cart management are critical.
