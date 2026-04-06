<script lang="ts">
  import FormField from './FormField.svelte';
  import FormRow from './FormRow.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { getFieldProps } from '$lib/utils/formHelpers';
  
  export let form: any;
  export let errors: any;
  export let isLoading: boolean = false;
  export let showStatus: boolean = true;
  export let showSlug: boolean = true;
  
  export let nameLabel: string = "Account Name";
  export let nameHelp: string = "Enter the official account name";
  export let slugLabel: string = "Slug";
  export let slugHelp: string = "The slug is used in URLs and API endpoints. Only lowercase letters, numbers, and hyphens are allowed.";
  export let statusLabel: string = "Status";
  export let statusHelp: string = "Current operational status of the account";
  export let descriptionLabel: string = "Description";
  export let descriptionHelp: string = "Optional description of the account's purpose";
</script>

<div class="space-y-6">
  <FormRow columns={showSlug ? 2 : 1}>
    <FormField 
      id="name" 
      label={nameLabel}
      error={$errors?.name}
      required={true}
      helpText={nameHelp}
    >
      <Input 
        id="name" 
        name="name" 
        type="text" 
        bind:value={$form.name} 
        placeholder="Enter account name" 
        {...getFieldProps($errors, 'name', isLoading)}
      />
    </FormField>
    
    {#if showSlug}
      <FormField 
        id="slug" 
        label={slugLabel}
        error={$errors?.slug}
        required={true}
        helpText={slugHelp}
      >
        <Input 
          id="slug" 
          name="slug" 
          type="text" 
          bind:value={$form.slug} 
          placeholder="account-slug" 
          {...getFieldProps($errors, 'slug', isLoading)}
        />
      </FormField>
    {/if}
  </FormRow>
  
  {#if showStatus}
    <FormRow columns={2}>
      <FormField 
        id="status" 
        label={statusLabel}
        error={$errors?.status}
        required={true}
        helpText={statusHelp}
      >
        <slot name="status-field" />
      </FormField>
    </FormRow>
  {/if}
  
  <FormField 
    id="description" 
    label={descriptionLabel}
    error={$errors?.description}
    helpText={descriptionHelp}
  >
    <Textarea 
      id="description" 
      name="description" 
      bind:value={$form.description} 
      placeholder="Enter account description" 
      class="w-full h-24 {$errors?.description ? 'border-destructive focus:border-destructive' : ''}"
      disabled={isLoading}
      aria-invalid={$errors?.description ? true : undefined}
    />
  </FormField>
</div> 
