<script lang="ts">
  import { enhance } from '$app/forms';
  import { createEventDispatcher } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import { zod } from 'sveltekit-superforms/adapters';
  import * as Dialog from '$lib/components/ui/dialog';
  import FormField from '$lib/components/ui_components_sveltekit/form/FormField.svelte';
  import FormRow from '$lib/components/ui_components_sveltekit/form/FormRow.svelte';
  import FormContainer from '$lib/components/ui_components_sveltekit/form/FormContainer.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';
  import { companyCreateSchema } from '$lib/../routes/admin/accounts/accounts/schema';
  import { getFieldProps, processFormMessages } from '$lib/utils/formHelpers';

  export let open = false;
  export let title = 'Create Company';
  export let description = 'Create a new company and add it to this account';
  export let action = '';
  
  const dispatch = createEventDispatcher();
  
  const emptyForm = {
    name: '',
    contactEmail: '',
    contactPhone: '' as string | null | undefined,
    address: '',
    description: '',
    status: 'ACTIVE' as const
  };
  
  // Initialize superform
  const { form, errors, enhance: formEnhance, submitting, message, delayed } = 
    superForm(emptyForm, {
      validators: zod(companyCreateSchema),
      resetForm: true,
      validationMethod: 'oninput', // Validate on every input change
      onResult: async ({ result }) => {
        if (result.type === 'success') {
          open = false;
          dispatch('success');
        }
      }
    });
  
  // Reactive states
  $: isLoading = $submitting || $delayed;
  $: ({ errorMessage } = processFormMessages($message));
  
  function handleCancel() {
    open = false;
  }
  
  // Reset form when dialog closes
  $: if (!open) {
    $form = { ...emptyForm };
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[600px]">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>
    
    <FormContainer
      method="POST"
      action={action}
      enhance={formEnhance}
      novalidate
      {errorMessage}
      showAlerts={true}
      disabled={isLoading}
      {isLoading}
      delayed={$delayed}
    >
      <div class="space-y-4">
        <FormRow columns={1}>
          <FormField 
            id="name" 
            label="Company Name" 
            error={$errors.name}
            required
            helpText="Enter the official company name"
          >
            <Input
              id="name"
              name="name"
              bind:value={$form.name}
              placeholder="Enter company name"
              {...getFieldProps($errors, 'name', isLoading)}
            />
          </FormField>
        </FormRow>
        
        <FormRow columns={2}>
          <FormField 
            id="contactEmail" 
            label="Contact Email" 
            error={$errors.contactEmail}
            required
            helpText="Primary email for company communications"
          >
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              bind:value={$form.contactEmail}
              placeholder="contact@company.com"
              {...getFieldProps($errors, 'contactEmail', isLoading)}
            />
          </FormField>
          
          <FormField 
            id="contactPhone" 
            label="Contact Phone" 
            error={$errors.contactPhone}
            helpText="Primary phone number for company contact"
          >
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              bind:value={$form.contactPhone}
              placeholder="+1 (555) 123-4567"
              {...getFieldProps($errors, 'contactPhone', isLoading)}
            />
          </FormField>
        </FormRow>
        
        <FormRow columns={1}>
          <FormField 
            id="address" 
            label="Address" 
            error={$errors.address}
            helpText="Physical address of the company"
          >
            <Textarea
              id="address"
              name="address"
              bind:value={$form.address}
              placeholder="Enter company address"
              rows="2"
              class="w-full {$errors.address ? 'border-destructive focus:border-destructive' : ''}"
              disabled={isLoading}
              aria-invalid={$errors.address ? true : undefined}
            />
          </FormField>
        </FormRow>
        
        <FormRow columns={1}>
          <FormField 
            id="description" 
            label="Description" 
            error={$errors.description}
            helpText="Optional description of the company's business or purpose"
          >
            <Textarea
              id="description"
              name="description"
              bind:value={$form.description}
              placeholder="Enter company description"
              rows="3"
              class="w-full {$errors.description ? 'border-destructive focus:border-destructive' : ''}"
              disabled={isLoading}
              aria-invalid={$errors.description ? true : undefined}
            />
          </FormField>
        </FormRow>
      </div>
      
      <Dialog.Footer class="mt-6">
        <Button type="button" variant="outline" on:click={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !$form.name || !$form.contactEmail}>
          {isLoading ? 'Creating...' : 'Create Company'}
        </Button>
      </Dialog.Footer>
    </FormContainer>
  </Dialog.Content>
</Dialog.Root> 
