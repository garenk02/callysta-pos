# Performance Optimizations

This document outlines the performance optimizations implemented to improve the application's speed and ability to handle large datasets.

## Database Optimizations

### Additional Indexes

We've added specialized indexes to improve query performance for common operations:

- **Composite indexes** for frequently combined filters (e.g., category + is_active)
- **GIN indexes with pg_trgm** for efficient text search on product name, SKU, and description
- **Specialized indexes** for common query patterns (price ranges, stock quantities, date ranges)

These indexes are defined in `db/performance_indexes.sql` and should be applied to the database.

#### Note on pg_trgm Extension

The GIN indexes with pg_trgm require the PostgreSQL `pg_trgm` extension to be enabled. If you encounter an error like:

```
ERROR: 42704: operator class "gin_trgm_ops" does not exist for access method "gin"
```

You have two options:

1. **Enable the pg_trgm extension** (recommended for better search performance):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
   Then run the full `db/performance_indexes.sql` script.

2. **Use basic indexes instead**:
   If you don't have permission to create extensions or encounter other issues, use the alternative `db/performance_indexes_basic.sql` script, which uses standard B-tree indexes instead of GIN indexes.

## Frontend Optimizations

### Virtualized Lists

We've implemented virtualized lists using `react-virtuoso` to efficiently render large datasets:

- Only renders items visible in the viewport
- Significantly reduces DOM nodes for large lists
- Improves scrolling performance and reduces memory usage

The implementation uses a custom `VirtualizedDataTable` component that:

1. Maintains compatibility with existing column definitions
2. Provides the same filtering and search capabilities as the regular DataTable
3. Uses the Virtuoso component for efficient rendering of table rows
4. Properly handles the table structure to avoid DOM nesting issues

For each table that uses virtualization, we've created specialized column definitions that:

1. Use simple string headers instead of complex components to avoid hydration issues
2. Access data directly from row.original instead of using getValue for better performance
3. Include proper className metadata for consistent styling

This approach allows us to handle thousands of rows with minimal performance impact while maintaining the same user experience.

### Debounced Search

Search inputs are now debounced to reduce unnecessary API calls:

- Waits until the user stops typing before sending requests
- Reduces server load and improves responsiveness
- Implemented using the `useDebounce` hook

### Optimized Image Loading

Images are loaded with optimizations for better performance:

- Lazy loading for off-screen images
- Proper loading states with skeletons
- Optimized image formats and sizes

## Caching Strategy

We've enhanced the caching strategy to reduce unnecessary data fetching:

- **Configurable TTL values** based on data volatility
- **Cache prefetching** for commonly accessed data
- **Intelligent cache invalidation** on specific actions

## Pagination Improvements

We've implemented both standard pagination and cursor-based pagination:

- **Standard pagination** for smaller datasets
- **Cursor-based pagination** for large datasets (more efficient)
- **Infinite scrolling** option for better UX with large lists

## Usage Guidelines

### When to Use Virtualization

Use virtualized lists when:
- Displaying more than 100 items at once
- Users need to scroll through large datasets
- Performance is critical on lower-end devices

### When to Use Cursor-Based Pagination

Use cursor-based pagination when:
- Working with very large datasets (1000+ items)
- Performance is more important than knowing the total count
- Implementing infinite scrolling

### Monitoring Performance

Keep an eye on these metrics:
- Time to first meaningful paint
- Interaction to Next Paint (INP)
- Memory usage during scrolling
- API response times

## Future Optimizations

Potential future optimizations include:

- Implementing server-side search with Postgres full-text search
- Adding worker threads for heavy client-side operations
- Implementing data prefetching for anticipated user actions
- Adding service worker caching for offline support
