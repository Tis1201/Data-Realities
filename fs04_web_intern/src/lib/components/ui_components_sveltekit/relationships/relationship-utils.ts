import { Badge } from '$lib/components/ui/badge';

// Available roles for members
export const AVAILABLE_ROLES = [
    { value: 'ADMIN', label: 'Admin', description: 'Account administration and user management' },
    { value: 'MEMBER', label: 'Member', description: 'Standard member access' }
] as const;

// Type definitions
export type RelationshipType = 'companies' | 'members' | 'groups' | 'devices';
export type RoleValue = 'OWNER' | 'ADMIN' | 'MEMBER';

// Badge helper functions
export function getStatusBadge(status: string | undefined) {
    if (!status) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        'ACTIVE': 'default',
        'INACTIVE': 'secondary',
        'PENDING': 'outline'
    };
    return {
        component: Badge,
        props: {
            variant: variants[status] || 'outline',
            class: "whitespace-nowrap"
        },
        children: status.charAt(0) + status.slice(1).toLowerCase()
    };
}

export function getRoleBadge(role: string | undefined) {
    if (!role) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        'OWNER': 'destructive',
        'ADMIN': 'default',
        'MEMBER': 'secondary'
    };
    return {
        component: Badge,
        props: {
            variant: variants[role] || 'outline',
            class: "whitespace-nowrap"
        },
        children: role.charAt(0) + role.slice(1).toLowerCase()
    };
}

// Display name helper
export function getDisplayName(item: any, relationshipType: RelationshipType): string {
    if (!item) return 'Unknown';
    
    // Handle nested member data (AccountMembership with user object)
    if (relationshipType === 'members' && item.user) {
        return item.user.name || item.user.email || item.user.id || 'Unknown User';
    }
    
    // Handle flat data structure
    return item.name || item.email || item.id || 'Unknown';
}

// Get proper singular form
export function getSingularForm(relationshipType: RelationshipType): string {
    const singularMap: Record<RelationshipType, string> = {
        'companies': 'company',
        'members': 'member',
        'groups': 'group',
        'devices': 'device'
    };
    return singularMap[relationshipType];
}

// Get item ID helper
export function getItemId(item: any, relationshipType: RelationshipType): string {
    return (relationshipType === 'members' && item.user) ? item.user.id : item.id;
}

// Get item URL helper
export function getItemUrl(item: any, relationshipType: RelationshipType, viewUrl: string): string {
    if (!viewUrl) return '#';
    const itemId = getItemId(item, relationshipType);
    return `${viewUrl}/${itemId}`;
} 