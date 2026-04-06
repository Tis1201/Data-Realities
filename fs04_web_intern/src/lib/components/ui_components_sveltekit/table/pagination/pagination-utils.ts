import { onMount } from "svelte";
import { goto } from "$app/navigation";

/**
 * Initialize pagination with stored page size preference
 * @param storageKey The localStorage key for storing page size preference
 * @param replaceState Whether to replace the current history state
 */
export function initPagination(storageKey = 'preferredPageSize', replaceState = true) {
    onMount(() => {
        const url = new URL(window.location.href);
        const storedSize = localStorage.getItem(storageKey);
        if (storedSize && storedSize !== url.searchParams.get('per_page')) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('per_page', storedSize);
            newUrl.searchParams.set('page', '1');
            goto(newUrl.toString(), { replaceState });
        }
    });
}

/**
 * Handle table sort event
 * @param event The sort event from the table component
 * @param replaceState Whether to replace the current history state
 */
export function handleTableSort(
    event: CustomEvent<{ field?: string | null; column?: string; order?: string | null; direction?: string }>, 
    replaceState = true
) {
    const { detail } = event;
    const url = new URL(window.location.href);
    const field = detail.field !== null && detail.field !== undefined ? (detail.field || detail.column || '') : null;
    const order = detail.order !== null && detail.order !== undefined ? (detail.order || detail.direction || '') : null;
    
    if (field && order) {
        // Set sort parameters
        url.searchParams.set('sort', field);
        url.searchParams.set('order', order);
        // Maintain backward compatibility with legacy parameter names
        url.searchParams.set('sort_field', field);
        url.searchParams.set('sort_order', order);
    } else {
        // Remove sort parameters (third click - clear sort)
        url.searchParams.delete('sort');
        url.searchParams.delete('order');
        url.searchParams.delete('sort_field');
        url.searchParams.delete('sort_order');
    }
    goto(url.toString(), { replaceState });
}

/**
 * Handle table pagination event
 * @param event The pagination event from the table component
 * @param storageKey The localStorage key for storing page size preference
 * @param replaceState Whether to replace the current history state
 */
export function handleTablePagination(
    event: CustomEvent<{ page?: number; per_page?: number; perPage?: number }>,
    storageKey = 'preferredPageSize',
    replaceState = true
) {
    const { detail } = event;
    const url = new URL(window.location.href);
    url.searchParams.set('page', (detail.page || 1).toString());
    
    const perPage = detail.per_page || detail.perPage || 10;
    url.searchParams.set('per_page', perPage.toString());
    
    // Store the preferred page size
    localStorage.setItem(storageKey, perPage.toString());
    
    goto(url.toString(), { replaceState });
}

/**
 * Get default pagination object
 * @param meta The metadata from the API response
 * @param defaultPerPage Default items per page
 */
export function getDefaultPagination(meta: any, defaultPerPage = 10) {
    return meta?.pagination || { 
        page: 1, 
        per_page: defaultPerPage, 
        total_records: 0, 
        total_pages: 0 
    };
}

/**
 * Get default sort object
 * @param meta The metadata from the API response
 * @param defaultField Default field to sort by
 * @param defaultOrder Default sort order
 */
export function getDefaultSort(meta: any, defaultField = "createdAt", defaultOrder: "asc" | "desc" = "desc") {
    if (meta?.sort) {
        return {
            field: meta.sort.field ?? defaultField,
            order: (meta.sort.order === 'asc' ? 'asc' : meta.sort.order === 'desc' ? 'desc' : defaultOrder)
        };
    }
    
    const legacyField = meta?.sort_field ?? defaultField;
    const legacyOrder = meta?.sort_order === 'asc' ? 'asc' : meta?.sort_order === 'desc' ? 'desc' : defaultOrder;
    
    return { field: legacyField, order: legacyOrder };
}
