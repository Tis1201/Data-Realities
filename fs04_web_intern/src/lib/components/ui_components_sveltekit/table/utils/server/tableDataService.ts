import { parseQueryParams, formatPagination, formatSorting, formatFilters, buildWhereConditions } from './queryParams';
import type { PrismaClient } from '@prisma/client';

/**
 * Generic table data service for fetching and managing table data
 */

export interface TableDataOptions {
  modelName: string;
  searchableFields?: string[];
  /** Relation fields to include in search (e.g. { tags: 'name' } → tags.some.name contains search) */
  searchableRelations?: Record<string, string>;
  allowedFilters?: string[];
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  defaultPerPage?: number;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
  filterMappings?: Record<string, { field: string; operator: string; valueTransformer?: (value: string) => any; andWithWhen?: { whenValue: any; field: string; value: any } }>;
  /** Map virtual sort fields to actual DB fields (e.g. { endOn: 'scheduledAt' } for computed columns) */
  sortFieldMappings?: Record<string, string>;
  /** Custom orderBy builder for relation count etc. When provided, used instead of default orderBy. */
  getOrderBy?: (sortField: string, sortOrder: 'asc' | 'desc') => Record<string, any>;
  /**
   * When sort field matches, sort in memory (e.g. for array length which Prisma cannot order by).
   * Key extractor returns the value to sort by. Max 10_000 records fetched.
   */
  sortInMemoryForField?: string;
  sortInMemoryKey?: (record: any) => number | string;
  baseWhere?: Record<string, any>;
}

export interface TableDataResult<T> {
  records: T[];
  meta: {
    pagination: {
      page: number;
      per_page: number;
      total_records: number;
      total_pages: number;
    };
    sort: {
      field: string;
      order: string;
    };
    filters: Record<string, any>;
  };
}

/**
 * Fetch table data with pagination, sorting, and filtering
 * @param context Parent function or locals object containing user data
 * @param url URL object containing query parameters
 * @param options Configuration options for the table data
 * @returns Table data with metadata
 */
export async function fetchTableData<T>(
  context: any,
  url: URL,
  options: TableDataOptions
): Promise<TableDataResult<T>> {
  const {
    modelName,
    searchableFields = [],
    allowedFilters = [],
    defaultSortField = 'createdAt',
    defaultSortOrder = 'desc',
    defaultPerPage = 10,
    include,
    select
  } = options;

  // Get database client
  const prisma = context.prisma || (context.locals && context.locals.prisma);
  if (!prisma) {
    throw new Error('Prisma client not available in context');
  }
  
  // Parse query parameters
  const params = parseQueryParams(url, {
    allowedFilters,
    defaultSortField,
    defaultSortOrder,
    defaultPerPage
  });
  
  // Build where conditions
  const where = buildWhereConditions(params, searchableFields, options.filterMappings || {}, options.searchableRelations);
  
  // Get model from prisma
  const model = prisma[modelName as keyof PrismaClient] as any;
  
  if (!model) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }
  
  // Merge baseWhere with dynamic where conditions
  const mergedWhere = options.baseWhere
    ? {
        AND: [
          options.baseWhere,
          ...(Object.keys(where).length > 0 ? [where] : [])
        ]
      }
    : where;

  const useInMemorySort =
    options.sortInMemoryForField &&
    options.sortInMemoryKey &&
    params.sortField === options.sortInMemoryForField;

  let records: any[];

  if (useInMemorySort) {
    // Fetch up to 10k records, sort in memory by computed key (e.g. apps.length), then paginate
    const IN_MEMORY_SORT_LIMIT = 10_000;
    const allRecords = await model.findMany({
      where: mergedWhere,
      take: IN_MEMORY_SORT_LIMIT,
      ...(include && { include }),
      ...(select && { select })
    });
    const keyFn = options.sortInMemoryKey!;
    const dir = params.sortOrder === 'asc' ? 1 : -1;
    allRecords.sort((a: any, b: any) => {
      const va = keyFn(a);
      const vb = keyFn(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return dir * cmp;
    });
    const start = (params.page - 1) * params.per_page;
    records = allRecords.slice(start, start + params.per_page);
  } else {
    // Build orderBy: use custom getOrderBy if provided, else default
    const orderBy = options.getOrderBy
      ? options.getOrderBy(params.sortField, params.sortOrder)
      : {
          [options.sortFieldMappings?.[params.sortField] ?? params.sortField]: params.sortOrder
        };

    const queryOptions: any = {
      where: mergedWhere,
      skip: (params.page - 1) * params.per_page,
      take: params.per_page,
      orderBy
    };

    if (include) queryOptions.include = include;
    if (select) queryOptions.select = select;

    records = await model.findMany(queryOptions);
  }

  // Get total count for pagination
  const totalRecords = await model.count({ where: mergedWhere });
  
  return {
    records,
    meta: {
      pagination: formatPagination(params.page, params.per_page, totalRecords),
      sort: formatSorting(params.sortField, params.sortOrder, params.hasExplicitSort),
      filters: formatFilters(params)
    }
  };
}

/**
 * Delete a record
 * @param context Parent function or locals object containing user data
 * @param modelName Name of the Prisma model
 * @param id ID of the record to delete
 * @returns Result of the delete operation
 */
export async function deleteRecord(
  context: any,
  modelName: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const prisma = context.prisma || (context.locals && context.locals.prisma);
    if (!prisma) {
      throw new Error('Prisma client not available in context');
    }
    const model = prisma[modelName as keyof PrismaClient] as any;
    
    if (!model) {
      return { success: false, error: `Model ${modelName} not found` };
    }
    
    await model.delete({
      where: { id }
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting ${modelName}:`, error);
    return { 
      success: false, 
      error: `Failed to delete ${modelName.toLowerCase()}` 
    };
  }
}
