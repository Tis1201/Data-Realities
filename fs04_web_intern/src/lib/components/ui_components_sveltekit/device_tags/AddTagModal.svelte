<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Modal, InputField, TextareaField, Dropdown, Button } from '$lib/design-system/components';
    import CharacterCount from '$lib/components/ui_components_sveltekit/form/CharacterCount.svelte';
    import type { DropdownOption } from '$lib/design-system/components';
    import { DESCRIPTION_MAX, NAME_MAX } from '$lib/constants/description';

    export let open = false;
    export let accounts: { id: string; name: string }[] = [];
    export let currentAccountId: string = '';
    export let loading = false;
    export let serverError: string = '';

    const dispatch = createEventDispatcher<{
        close: void;
        add: { name: string; description: string; accountId: string };
        clearError: void;
    }>();

    let name = '';
    let description = '';
    let selectedAccountId = '';
    let nameError = '';
    let descriptionError = '';
    let wasOpen = false;

    $: if (open && !wasOpen) {
        wasOpen = true;
        resetForm();
    } else if (!open && wasOpen) {
        wasOpen = false;
    }

    function resetForm() {
        name = '';
        description = '';
        selectedAccountId = currentAccountId || (accounts.length > 0 ? accounts[0].id : '');
        nameError = '';
        descriptionError = '';
        serverError = '';
    }

    $: accountOptions = accounts.map((acc): DropdownOption => ({
        id: acc.id,
        label: acc.name
    }));

    function handleClose() {
        dispatch('close');
    }

    function handleCancel() {
        handleClose();
    }

    /** Tag name limit (50 chars per character limit audit) */
    const TAG_NAME_MAX = NAME_MAX;
    /** TC-TG-0021: Max 200 chars per recommendation to prevent UI layout break */
    const TAG_DESC_MAX = DESCRIPTION_MAX;

    function validateForm(): boolean {
        nameError = '';
        descriptionError = '';
        
        if (!name.trim()) {
            nameError = 'Tag name is required';
            return false;
        }
        if (name.length > TAG_NAME_MAX) {
            nameError = `Tag name must be at most ${TAG_NAME_MAX} characters`;
            return false;
        }
        if (description.length > TAG_DESC_MAX) {
            descriptionError = `Description must be at most ${TAG_DESC_MAX} characters`;
            return false;
        }
        
        return true;
    }

    function handleAdd() {
        if (!validateForm()) return;
        
        dispatch('add', {
            name: name.trim(),
            description: description.trim(),
            accountId: selectedAccountId
        });
    }

    function handleAccountChange(event: CustomEvent<string | string[]>) {
        const val = event.detail;
        selectedAccountId = Array.isArray(val) ? val[0] || '' : val;
    }

    function handleNameInput(event: CustomEvent<string>) {
        name = event.detail;
    }

    function handleDescriptionInput(event: CustomEvent<string>) {
        description = event.detail;
    }
</script>

<Modal
    {open}
    title="Add Tag"
    size="md"
    showFooter={false}
    on:close={handleClose}
>
    <div class="add-tag-form">
        <div class="add-tag-field-wrap">
            <InputField
                label="Tag Name"
                placeholder="Enter"
                value={name}
                required={true}
                maxlength={TAG_NAME_MAX}
                state={(nameError || serverError) ? 'error' : 'default'}
                helperText={nameError || serverError || ''}
                disabled={loading}
                on:input={(e) => { nameError = ''; dispatch('clearError'); handleNameInput(e); }}
            />
            <CharacterCount current={name.length} max={TAG_NAME_MAX} />
        </div>

        <Dropdown
            label="Account"
            placeholder="Select Account"
            options={accountOptions}
            value={selectedAccountId}
            disabled={loading || accounts.length <= 1}
            clearable={false}
            on:change={handleAccountChange}
        />

        <TextareaField
            label="Description"
            placeholder="Enter"
            value={description}
            rows={4}
            maxlength={TAG_DESC_MAX}
            state={descriptionError ? 'error' : 'default'}
            helperText={descriptionError || ''}
            disabled={loading}
            on:input={(e) => { descriptionError = ''; handleDescriptionInput(e); }}
        />
        <CharacterCount current={description.length} max={TAG_DESC_MAX} />
    </div>

    <div slot="footer" class="add-tag-footer">
        <Button
            variant="outline"
            color="primary"
            size="lg"
            on:click={handleCancel}
            disabled={loading}
        >
            Cancel
        </Button>
        <Button
            variant="filled"
            color="primary"
            size="lg"
            on:click={handleAdd}
            {loading}
            disabled={loading}
        >
            Add
        </Button>
    </div>
</Modal>

<style>
    .add-tag-form {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-4);
    }

    .add-tag-field-wrap {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .add-tag-footer {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: var(--ds-space-4);
        width: 100%;
    }

    .add-tag-footer :global(button) {
        min-width: 100px;
    }
</style>
