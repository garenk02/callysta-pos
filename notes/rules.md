# Next.js 15+ Development Guidelines (TypeScript, Tailwind, Shadcn/ui)

These guidelines aim to promote best practices for building robust, secure, and maintainable web applications using Next.js (v15+ App Router), TypeScript, Tailwind CSS, and Shadcn/ui.

---

## 1. TypeScript & Code Quality

* **Enable Strict Mode:** Always have `"strict": true` enabled in your `tsconfig.json` for maximum type safety.
* **Avoid `any`:** Use `any` as a last resort. Prefer specific types, `unknown`, or generics. Use ESLint rules to prevent `any`.
* **Type Everything:** Define explicit types or interfaces for props, function arguments, return values, API responses, and state.
* **Use Utility Types:** Leverage TypeScript's built-in utility types (`Partial`, `Omit`, `Pick`, `ReturnType`, `Parameters`, etc.) to avoid repetitive type definitions.
* **Consistent Naming:** Follow consistent naming conventions for files, variables, functions, types, and interfaces (e.g., PascalCase for components and types, camelCase for variables and functions).
* **Linting & Formatting:** Use ESLint and Prettier with agreed-upon configurations (`eslint-config-next`, Tailwind ESLint plugin) enforced via pre-commit hooks (Husky + lint-staged).
* **Absolute Imports:** Configure `baseUrl` and `paths` in `tsconfig.json` for cleaner, non-relative imports (e.g., `@/components/Button` instead of `../../components/Button`).

---

## 2. Next.js App Router & Core Concepts

* **App Router Structure:** Organize routes logically using folders. Use Route Groups (`(groupName)`) for layouts and organization without affecting URL paths. Use Private Folders (`_folderName`) to explicitly opt-out components/files within from routing.
* **Server Components by Default:** Leverage React Server Components (RSCs) for fetching data, accessing backend resources directly, and reducing client-side JavaScript. Keep them as the default.
* **Client Components (`'use client'`):** Use Client Components *only* when necessary for interactivity, using browser APIs, or employing React hooks like `useState`, `useEffect`, `useContext`. Keep Client Components small and push state/interactivity down the tree.
* **Data Fetching:**
    * **Server Components:** Fetch data directly using `async`/`await` within the component. Leverage Next.js caching (`Workspace` options, `cache`, `revalidate`).
    * **Client Components:** Use data fetching hooks like `useSWR` or `React Query` (TanStack Query) for client-side fetching, caching, revalidation, and mutations. Avoid `useEffect` for data fetching where possible.
* **Caching:** Understand and configure Next.js caching strategies (Route Segment Config options like `revalidate`, `dynamic`, `WorkspaceCache`). Use tags for fine-grained cache invalidation where needed.
* **Loading UI:** Implement `loading.js` / `loading.tsx` files for automatic loading UI using React Suspense during navigation and data fetching.
* **Error Handling:** Implement `error.js` / `error.tsx` for handling runtime errors within route segments. Use `global-error.js` for root layout/template errors. Use `try...catch` in server-side data fetching and Server Actions.
* **Metadata:** Use the Metadata API (`generateMetadata` function) for SEO and page metadata customization.
* **Server Actions:** Prefer Server Actions for form submissions and data mutations initiated from the client, especially when working heavily with RSCs. Ensure proper validation and error handling within Server Actions.

---

## 3. Styling with Tailwind CSS & Shadcn/ui

* **Utility-First:** Embrace Tailwind's utility-first approach for most styling. Keep custom CSS minimal.
* **Configuration:** Configure `tailwind.config.js` effectively: define theme colors, fonts, spacing, and plugins.
* **Avoid `@apply` Overuse:** Use `@apply` sparingly, primarily for extracting highly repeated complex patterns or integrating with non-Tailwind UI libraries if necessary. Prefer component composition.
* **Shadcn/ui Best Practices:**
    * **Composition:** Leverage Shadcn components as building blocks. Copy/paste components into your project (`components/ui`) and modify them there if needed, rather than abstracting them heavily initially.
    * **Customization:** Customize the look and feel primarily through CSS variables defined in `globals.css` as per Shadcn documentation.
    * **`clsx` / `tailwind-merge`:** Use `clsx` and `tailwind-merge` (often combined in Shadcn's `cn` utility) to conditionally apply Tailwind classes, especially when extending or composing components.
* **Organization:** Keep global styles in `app/globals.css`. For component-specific styles not achievable with utilities, consider CSS Modules or colocated CSS files if necessary, but aim for utilities first.

---

## 4. Component Design

* **Single Responsibility:** Keep components small and focused on a single task or piece of UI.
* **Props:** Define clear, typed props using TypeScript interfaces or types. Avoid overly complex prop objects.
* **Composition:** Favor composition over inheritance. Build complex UIs by combining smaller, reusable components.
* **Server vs. Client:** Clearly distinguish between Server and Client Components. Avoid passing complex non-serializable data (like functions) from Server to Client Components as props unless absolutely necessary and understood.
* **Readability:** Write clean, readable JSX with consistent indentation and structure.

---

## 5. State Management

* **Server State First:** Rely on data fetched in Server Components as the primary source of truth whenever possible.
* **URL State:** Use URL search parameters (`useSearchParams`) for state that should be bookmarkable or shareable (filters, tabs, pagination).
* **Client State:**
    * Use React's built-in hooks (`useState`, `useReducer`) for simple, local component state.
    * Use React Context API for simple global state shared across a limited part of the component tree.
    * For complex, global, or cross-cutting client state, consider libraries like Zustand or Jotai. Avoid Redux unless the complexity truly warrants it.

---

## 6. API Routes (Route Handlers) & Server Actions

* **Use Cases:**
    * **Server Actions:** Ideal for mutations (POST, PUT, DELETE) directly tied to UI interactions (forms) within the App Router, especially from RSCs/Client Components using `useFormState` / `useFormStatus`.
    * **Route Handlers (API Routes):** Use for creating traditional REST/GraphQL API endpoints, handling webhooks, or when needing fine-grained control over request/response objects outside of form actions.
* **Validation:** **Always validate input** on the server-side (in both Server Actions and Route Handlers). Use libraries like `zod` for robust schema definition and validation. Never trust client-side input.
* **Error Handling:** Return appropriate HTTP status codes and error messages from Route Handlers. Handle errors within Server Actions and provide feedback to the client (e.g., using `useFormState`).
* **Typing:** Ensure type safety between client-side calls and server-side handlers (consider tRPC for end-to-end type safety if building many internal APIs).

---

## 7. Security

* **Validate Everything:** Re-validate all data on the server (API Routes, Server Actions), even if validated on the client.
* **Environment Variables:**
    * Store secrets (API keys, database URLs) in `.env.local` (which is gitignored by default).
    * Access server-side only variables directly via `process.env`.
    * Prefix variables with `NEXT_PUBLIC_` **only** if they absolutely need to be accessible in the browser (use with extreme caution – never for secrets).
    * Use Vercel Environment Variables for deployment.
* **Authentication & Authorization:**
    * Implement robust authentication (e.g., NextAuth.js, Clerk, Lucia Auth, custom).
    * Verify user sessions/tokens on *every* sensitive server-side operation (API Routes, Server Actions, data fetching in RSCs).
    * Implement role-based access control where necessary.
* **XSS Prevention:** React automatically escapes content rendered in JSX. Be extremely cautious with `dangerouslySetInnerHTML`. Sanitize any user-generated HTML before rendering.
* **CSRF Protection:** Server Actions have built-in CSRF protection mechanisms. For traditional API Routes handling state-changing requests (POST, PUT, DELETE) from pages with cookie-based auth, ensure CSRF tokens are implemented and validated if not handled by your auth library.
* **Rate Limiting:** Protect Server Actions and public API Routes against brute-force or denial-of-service attacks by implementing rate limiting.
* **Dependency Security:** Regularly audit dependencies using `npm audit` or `yarn audit` and update vulnerable packages promptly.
* **HTTPS:** Use HTTPS (enforced by default on Vercel).

---

## 8. Performance

* **Minimize Client Bundle:** Leverage RSCs. Use Client Components sparingly.
* **Code Splitting:** Next.js handles automatic code splitting per page/layout.
* **`next/image`:** Use `next/image` for automatic image optimization (resizing, format conversion, lazy loading). Provide correct `width` and `height` props.
* **`next/font`:** Use `next/font` for optimizing local or Google fonts (automatic self-hosting, removes layout shifts).
* **Dynamic Imports:** Use `next/dynamic` to dynamically import large Client Components or libraries that are not needed on the initial page load.
* **Bundle Analysis:** Periodically analyze your bundle sizes using `@next/bundle-analyzer` to identify large dependencies or chunks.
* **Memoization:** In Client Components, use `React.memo`, `useMemo`, and `useCallback` judiciously to prevent unnecessary re-renders, but profile first – don't prematurely optimize.

---

## 9. Testing

* **Unit Tests:** Use Jest or Vitest to test utility functions, hooks, and complex logic in isolation.
* **Integration/Component Tests:** Use React Testing Library (with Jest/Vitest) to test components by interacting with them as a user would, verifying rendered output and behavior. Focus on testing component contracts, not implementation details. Test Server Components using server-side rendering utilities if needed, or focus on testing the UI they produce via integration tests.
* **End-to-End (E2E) Tests:** Use Playwright or Cypress to test critical user flows across the entire application.
* **Coverage:** Aim for reasonable test coverage, focusing on critical paths, business logic, and potential edge cases.

---

## 10. Deployment

* **Vercel:** Leverage Vercel's seamless integration with Next.js for optimal performance and ease of deployment.
* **Environment Configuration:** Configure Vercel Environment Variables correctly for Production, Preview, and Development environments.
* **CI/CD:** Integrate linting, type checking, and testing into your CI pipeline (e.g., GitHub Actions) to catch errors before deployment.
* **Monitoring:** Utilize Vercel Analytics and potentially external monitoring tools to track performance and errors in production.