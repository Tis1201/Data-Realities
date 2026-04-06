/**
 * Utility functions for handling query parameters, pagination, sorting, and filtering
 * for data tables across the application
 */

/**
 * Parse URL query parameters for table pagination, sorting, and filtering
 * @param url URL object containing query parameters
 * @param options Configuration options
 * @returns Parsed query parameters
 */
export function parseQueryParams(
    url: URL, 
    options: {
        allowedFilters?: string[];
        defaultPage?: number;
        defaultPerPage?: number;
        defaultSortField?: string;
        defaultSortOrder?: 'asc' | 'desc';
    } = {}
) {
    const {
        allowedFilters = [],
        defaultPage = 1,
        defaultPerPage = 10,
        defaultSortField = 'createdAt',
        defaultSortOrder = 'desc'
    } = options;

    const hasSortParams = url.searchParams.has('sort') && url.searchParams.has('order');

    const queryParams: Record<string, any> = {
        page: Number(url.searchParams.get('page')) || defaultPage,
        per_page: Number(url.searchParams.get('per_page')) || defaultPerPage,
        search: url.searchParams.get('search') || '',
        sortField: url.searchParams.get('sort') || defaultSortField,
        sortOrder: (url.searchParams.get('order') as 'asc' | 'desc') || defaultSortOrder,
        hasExplicitSort: hasSortParams, 
        filters: {} // Store all filters in a separate object
    };

    // Process allowed filters
    allowedFilters.forEach((filter) => {
        const value = url.searchParams.get(filter);
        if (value) {
            // Always convert filter values to arrays, even for single values
            queryParams.filters[filter] = value.includes(',') ? value.split(',').filter(Boolean) : [value];
        }
    });

    return queryParams;
}

/**
 * Format pagination metadata for response
 * @param page Current page number
 * @param per_page Items per page
 * @param totalRecords Total number of records
 * @returns Formatted pagination metadata
 */
export function formatPagination(page: number, per_page: number, totalRecords: number) {
    return {
        page,
        per_page,
        total_records: totalRecords,
        total_pages: Math.ceil(totalRecords / per_page)
    };
}

/**
 * Format sorting metadata for response
 * @param sortField Field to sort by
 * @param sortOrder Sort order (asc/desc)
 * @param hasExplicitSort Whether sort was explicitly requested in URL
 * @returns Formatted sorting metadata
 */
export function formatSorting(sortField: string, sortOrder: string, hasExplicitSort: boolean = true) {
    if (!hasExplicitSort) {
        return { field: '', order: '' };
    }
    return { field: sortField, order: sortOrder };
}

/**
 * Format filters for response metadata
 * @param filters Filter parameters
 * @returns Formatted filter metadata
 */
export function formatFilters(filters: Record<string, any>) {
    return filters;
}

/**
 * Build Prisma where conditions for search and filters
 * @param params Query parameters including search and filters
 * @param searchableFields Fields that can be searched
 * @param filterMappings Mappings from filter names to database fields and operators
 * @returns Prisma-compatible where conditions
 */
export function buildWhereConditions(
    params: Record<string, any>,
    searchableFields: string[] = [],
    filterMappings: Record<string, { field: string, operator: string, valueTransformer?: (value: string) => any, andWithWhen?: { whenValue: any; field: string; value: any } }> = {},
    searchableRelations?: Record<string, string>
) {
    const whereConditions = [];
    
    // Add search conditions if search term is provided
    if (params.search && (searchableFields.length > 0 || (searchableRelations && Object.keys(searchableRelations).length > 0))) {
        const searchConditions = searchableFields.map((field) => {
            // Array fields (e.g., string[]) cannot use contains/mode; use "has" for exact match
            if (['apps', 'targetValue'].includes(field)) {
                return { [field]: { has: params.search } };
            }

            return {
                [field]: {
                    contains: params.search,
                    mode: 'insensitive'
                }
            };
        });

        // Add relation search conditions (e.g. { tags: 'name' } → tags.some({ name: { contains: search } }))
        if (searchableRelations) {
            for (const [relation, field] of Object.entries(searchableRelations)) {
                searchConditions.push({
                    [relation]: {
                        some: {
                            [field]: {
                                contains: params.search,
                                mode: 'insensitive'
                            }
                        }
                    }
                });
            }
        }
        
        whereConditions.push({
            OR: searchConditions
        });
    }
    
    // filterMappings is now passed as a parameter
    
    // Pin rule status multi-select: when both isDraft and isActive are present, use OR logic
    // (isDraft=true) OR (isDraft=false AND isActive=true) OR (isDraft=false AND isActive=false)
    const filters = params.filters || {};
    const isDraftVals = filters.isDraft;
    const isActiveVals = filters.isActive;
    const hasBothStatusFilters = Array.isArray(isDraftVals) && Array.isArray(isActiveVals) &&
        isDraftVals.length > 0 && isActiveVals.length > 0 &&
        !isDraftVals.includes('__all__') && !isActiveVals.includes('__all__');
    const statusFiltersToSkip = new Set<string>();

    if (hasBothStatusFilters && filterMappings.isDraft && filterMappings.isActive) {
        const showDraft = isDraftVals.includes('true');
        const activeFiltered = isActiveVals.filter((v: string) => v !== 'draft');
        const showActive = activeFiltered.includes('true');
        const showInactive = activeFiltered.includes('false');

        const orParts: Record<string, any>[] = [];
        if (showDraft) orParts.push({ isDraft: true });
        if (showActive) orParts.push({ AND: [{ isDraft: false }, { isActive: true }] });
        if (showInactive) orParts.push({ AND: [{ isDraft: false }, { isActive: false }] });

        if (orParts.length > 0) {
            whereConditions.push({ OR: orParts });
            statusFiltersToSkip.add('isDraft');
            statusFiltersToSkip.add('isActive');
        }
    }

    // Only process filters that are in the filters object
    if (params.filters && typeof params.filters === 'object') {
        console.log('Processing filters:', Object.keys(params.filters));
        console.log('Filter mappings available:', Object.keys(filterMappings));

        Object.keys(params.filters).forEach(filterName => {
            if (statusFiltersToSkip.has(filterName)) return;
            const filterValue = params.filters[filterName];
            console.log(`Processing filter: ${filterName}`, filterValue);
            
            // Skip if not an array or empty array
            if (!Array.isArray(filterValue) || filterValue.length === 0) {
                console.log(`Skipping filter ${filterName}: not an array or empty array`);
                return;
            }

            // TC-RDM-APR-0010: When __all__ is selected (with or without others), treat as "no filter" - show all
            if (filterValue.includes('__all__')) {
                console.log(`Skipping filter ${filterName}: __all__ selected (no filter)`);
                return;
            }
            // Draft is placeholder for isActive until schema supports it; filter out to avoid wrong mapping
            const filterValueFiltered = filterName === 'isActive'
                ? filterValue.filter((v: string) => v !== 'draft')
                : filterValue;
            if (filterValueFiltered.length === 0) {
                console.log(`Skipping filter ${filterName}: only unsupported values (e.g. draft)`);
                return;
            }
            
            // Get mapping for this filter or skip if no mapping exists
            const mapping = filterMappings[filterName];
            if (!mapping) {
                console.warn(`No mapping found for filter: ${filterName}`);
                return;
            }
            console.log(`Mapping for ${filterName}:`, mapping);
            
            // Handle case conversion for system role filter; use filtered values for isActive
            let processedFilterValue = filterValueFiltered;
            if (filterName === 'systemRoles' && mapping.field === 'systemRole') {
                processedFilterValue = filterValue.map((value: string) => 
                    typeof value === 'string' ? value.toUpperCase() : value
                );
                console.log(`Converted values for ${filterName}:`, processedFilterValue);
            }
            
            // Build the where condition based on the operator
            if (mapping.operator === 'equals') {
                // For 'equals' operator, create OR conditions for each value
                whereConditions.push({
                    OR: processedFilterValue.map((value: string) => {
                        // Apply valueTransformer if it exists
                        const transformedValue = mapping.valueTransformer ? mapping.valueTransformer(value) : 
                            (typeof value === 'string' ? value.toLowerCase() : value);
                        
                        const baseCondition = { [mapping.field]: { equals: transformedValue } };
                        const andWith = mapping.andWithWhen;
                        if (andWith && transformedValue === andWith.whenValue) {
                            return { AND: [baseCondition, { [andWith.field]: { equals: andWith.value } }] };
                        }
                        return baseCondition;
                    })
                });
            } else if (mapping.operator === 'contains') {
                // For 'contains' operator, create OR conditions for each value with different patterns
                whereConditions.push({
                    OR: processedFilterValue.flatMap((value: string) => {
                        const searchValue = typeof value === 'string' ? value.toLowerCase() : value;
                        return [
                            { [mapping.field]: { equals: searchValue } },                  // Exact match
                            { [mapping.field]: { contains: `,${searchValue}` } },          // End or middle
                            { [mapping.field]: { contains: `${searchValue},` } },          // Beginning or middle
                            { [mapping.field]: { contains: `,${searchValue},` } }          // Middle
                        ];
                    })
                });
            } else if (mapping.operator === 'in') {
                // For 'in' operator, use a single condition with all values
                // Apply valueTransformer if it exists (supports returning array for case-insensitive variants)
                const transformedValues = mapping.valueTransformer
                    ? processedFilterValue.flatMap((value: string) => {
                        const result = mapping.valueTransformer!(value);
                        return Array.isArray(result) ? result : [result];
                    })
                    : processedFilterValue;

                const uniqueValues = [...new Set(transformedValues)];

                whereConditions.push({
                    [mapping.field]: { in: uniqueValues }
                });
            }
            // Add more operators as needed
        });
    }
    
    // Process other custom filters (non-array string values)
    // Skipping this for now as we're using the filters object
    
    return whereConditions.length > 0 ? { AND: whereConditions } : {};
}
