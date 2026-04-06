// Export all sidebar components
import { sidebarStore } from './sidebar-store';
import SidebarProvider from './SidebarProvider.svelte';
import Sidebar from './Sidebar.svelte';
import SidebarContent from './SidebarContent.svelte';
import SidebarHeader from './SidebarHeader.svelte';
import SidebarFooter from './SidebarFooter.svelte';
import SidebarGroup from './SidebarGroup.svelte';
import SidebarGroupLabel from './SidebarGroupLabel.svelte';
import SidebarGroupContent from './SidebarGroupContent.svelte';
import SidebarCollapsibleGroup from './SidebarCollapsibleGroup.svelte';
import SidebarMenuItems from './SidebarMenuItems.svelte';
import SidebarMenu from './SidebarMenu.svelte';
import SidebarMenuItem from './SidebarMenuItem.svelte';
import SidebarMenuButton from './SidebarMenuButton.svelte';
import SidebarTrigger from './SidebarTrigger.svelte';

// Export hook for accessing sidebar store
export const useSidebar = () => sidebarStore;

// Export components
export {
  SidebarProvider as Provider,
  Sidebar as Root,
  SidebarContent as Content,
  SidebarHeader as Header,
  SidebarFooter as Footer,
  SidebarGroup as Group,
  SidebarGroupLabel as GroupLabel,
  SidebarGroupContent as GroupContent,
  SidebarCollapsibleGroup as CollapsibleGroup,
  SidebarMenuItems as MenuItems,
  SidebarMenu as Menu,
  SidebarMenuItem as MenuItem,
  SidebarMenuButton as MenuButton,
  SidebarTrigger as Trigger
};
