# Enhanced Form Components

## EnhancedSelect

A wrapper around the shadcn-svelte Select component that properly handles default values and simplifies the API.

### Basic Usage

```svelte
<script>
  import EnhancedSelect from "$lib/components/ui_components_sveltekit/form/EnhancedSelect.svelte";
  import { Select } from "$lib/components/ui/select/index.js";
  
  let role = "ADMIN"; // Default value works correctly
</script>

<EnhancedSelect 
  value={role} 
  name="role" 
  placeholder="Select a role"
  labelText="Role"
>
  <Select.Item value="ADMIN">Admin</Select.Item>
  <Select.Item value="USER">User</Select.Item>
</EnhancedSelect>
```

### Using with Options Array

```svelte
<script>
  import EnhancedSelect from "$lib/components/ui_components_sveltekit/form/EnhancedSelect.svelte";
  
  let status = "active";
  
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" }
  ];
</script>

<EnhancedSelect 
  value={status} 
  name="status" 
  options={statusOptions}
  placeholder="Select status"
  labelText="Status"
/>
```

### Using with SuperForms

```svelte
<script>
  import EnhancedSelect from "$lib/components/ui_components_sveltekit/form/EnhancedSelect.svelte";
  import { Select } from "$lib/components/ui/select/index.js";
  import { superForm } from "sveltekit-superforms/client";
  
  const { form, errors, enhance } = superForm(data.form);
</script>

<form method="POST" use:enhance>
  <EnhancedSelect 
    value={$form.role} 
    name="role" 
    placeholder="Select a role"
    labelText="Role"
    on:change={(e) => $form.role = e.detail}
  >
    <Select.Item value="ADMIN">Admin</Select.Item>
    <Select.Item value="USER">User</Select.Item>
  </EnhancedSelect>
  
  <button type="submit">Submit</button>
</form>

# Form Handling Guide

This guide covers the standardized approach to form handling in the application, using the email settings form as a template.

## Core Components

### Form Structure

```svelte
<script lang="ts">
  import { goto } from "$app/navigation";
  import { ArrowLeft, Save } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import AdminPageLayout from "$lib/components/admin/layout/AdminPageLayout.svelte";
  import AdminCard from "$lib/components/admin/layout/AdminCard.svelte";
  import FormContainer from "$lib/components/ui_components_sveltekit/form/FormContainer.svelte";
  import FormRow from "$lib/components/ui_components_sveltekit/form/FormRow.svelte";
  import FormField from "$lib/components/ui_components_sveltekit/form/FormField.svelte";
  import { createFormHandler } from '$lib/components/ui_components_sveltekit/form/utils/formHandler';
  
  export let data;
  const title = "Create Resource";
  
  // Breadcrumbs for navigation
  const pageCrumbs = [
    ["Admin", "/admin"],
    ["Settings", "/admin/settings"],
    ["Resources", "/admin/resources"],
    "New Resource"
  ];
  
  // Initialize form handler
  const { form, errors, enhance, submitting, constraints, errorMessage } = createFormHandler(data.form, {
    successRedirect: '/admin/resources',
    validateOnInput: true,
    onSuccess: () => {
      // Handle success if needed
    }
  });
</script>

<AdminPageLayout
  {title}
  crumbs={pageCrumbs}
  actionButtons={[
    {
      label: "Cancel",
      icon: ArrowLeft,
      onClick: () => goto('/admin/resources'),
      variant: "outline",
      class: "h-9"
    },
    {
      label: "Save",
      icon: Save,
      onClick: () => {
        const form = document.querySelector('form[action="?/create"]');
        if (form) form.requestSubmit();
      },
      class: "h-9"
    }
  ]}
  loading={$submitting}
  showCreateButton={false}
  compact={true}
  contentSpacing="space-y-4"
>
  <div class="w-full space-y-6">
    <FormContainer
      method="POST"
      action="?/create"
      {enhance}
      novalidate
      errorMessage={$errorMessage}
    >
      <AdminCard
        title="Resource Information"
        description="Create a new resource"
        compact={true}
      >
        <div class="space-y-6">
          <FormRow columns={2}>
            <FormField id="name" label="Name" error={$errors.name}>
              <Input
                bind:value={$form.name}
                name="name"
                placeholder="Enter name"
                error={!!$errors.name}
                disabled={$submitting}
              />
            </FormField>
            
            <FormField id="status" label="Status" error={$errors.status}>
              <EnhancedSelect
                value={$form.status}
                name="status"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                placeholder="Select status"
                on:change={(e) => $form.status = e.detail}
                disabled={$submitting}
              />
            </FormField>
          </FormRow>
          
          <FormRow columns={1}>
            <FormField id="description" label="Description" error={$errors.description}>
              <Textarea
                bind:value={$form.description}
                name="description"
                placeholder="Enter description"
                rows="3"
                error={!!$errors.description}
                disabled={$submitting}
              />
            </FormField>
          </FormRow>
        </div>
      </AdminCard>
    </FormContainer>
  </div>
</AdminPageLayout>
```

## Key Components

### 1. Form Handler

The `createFormHandler` utility provides consistent form handling:

```typescript
const { 
  form,          // Form store
  errors,        // Validation errors
  enhance,       // Form enhancement function
  submitting,    // Loading state
  constraints,   // Form validation constraints
  errorMessage   // Form-level error message
} = createFormHandler(data.form, {
  successRedirect: '/path-after-success',
  validateOnInput: true,
  onSuccess: (result) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
});
```

### 2. Form Container

Wraps the form and handles common functionality:

```svelte
<FormContainer
  method="POST"
  action="?/action"
  {enhance}
  novalidate
  errorMessage={$errorMessage}
  successMessage={$successMessage}
>
  <!-- Form content -->
</FormContainer>
```

### 3. Form Layout

- **FormRow**: Creates a responsive row of form fields
- **FormField**: Wraps form controls with consistent styling and error handling

```svelte
<FormRow columns={2}>
  <FormField id="field1" label="Field 1" error={$errors.field1}>
    <Input bind:value={$form.field1} name="field1" />
  </FormField>
  <FormField id="field2" label="Field 2" error={$errors.field2}>
    <Input bind:value={$form.field2} name="field2" />
  </FormField>
</FormRow>
```

## Server-Side Form Handling

### Standard Form Action Pattern

```typescript
import { restrict } from '$lib/server/guards';
import { handleFormError } from '$lib/server/error-handling';
import { createSuccessResponse } from '$lib/types/api';

export const actions: Actions = {
  // Always use restrict for protected routes
  create: restrict(
    async ({ request, locals, getClientAddress }) => {
      // 1. Validate form data
      const form = await superValidate(request, zod(yourSchema));
      
      if (!form.valid) {
        return fail(400, { form });
      }
      
      try {
        // 2. Process form data
        const result = await processFormData(form.data, locals.prisma);
        
        // 3. Return success response
        return message(
          form,
          createSuccessResponse('Resource created successfully', {
            details: `Resource '${result.name}' has been created.`,
            data: { id: result.id, name: result.name }
          })
        );
        
      } catch (error) {
        // 4. Handle errors consistently
        return handleFormError({
          error,
          form,
          prisma: locals.prisma,
          defaultMessage: 'Failed to create resource. Please try again.',
          action: 'resource creation'
        });
      }
    },
    [SystemRole.ADMIN] // Specify required roles
  )
};

// Helper function to process form data
async function processFormData(data: z.infer<typeof yourSchema>, prisma: PrismaClient) {
  // Your business logic here
  // Example:
  return await prisma.resource.create({
    data: {
      name: data.name,
      status: data.status,
      description: data.description,
      // ... other fields
    }
  });
}

## Best Practices

1. **Consistent Layout**: Use AdminPageLayout and AdminCard for consistent page structure
2. **Form Validation**: Define validation schemas using Zod
3. **Error Handling**: Use FormField's error prop to show validation errors
4. **Loading States**: Disable form controls during submission
5. **Responsive Design**: Use FormRow with appropriate column counts for different screen sizes
6. **Accessibility**: Ensure all form controls have proper labels and ARIA attributes
7. **Type Safety**: Use TypeScript interfaces for form data and validation schemas
