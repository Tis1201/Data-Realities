// Table Props Interface
export interface TableProps<T> {
    records: T[];
    pagination: {
        page: number;
        per_page: number;
        total_records: number;
        total_pages: number;
    };
    sort: {
        field: string;
        order: "asc" | "desc";
    };
    loading?: boolean;
}

// Table State Interface
export interface TableState<T> {
    selectedRecord: T | null;
    confirmationOpen: boolean;
    // Custom dialog properties
    title?: string;
    message?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    successMessage?: string;
    errorMessage?: string;
    isDeleting?: boolean;
}

// Table Column Definition
export interface TableColumn {
    id: string;
    label: string;
    sortable?: boolean;
    sortKey?: string;
    width?: string;
    render?: (record: any) => string | { component: any; props: any };
}
