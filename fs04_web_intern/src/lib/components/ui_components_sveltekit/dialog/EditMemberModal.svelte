<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Modal, Button, InputField, Dropdown, Toggle } from '$lib/design-system/components';
    import { Eye, EyeOff } from 'lucide-svelte';

    export let open = false;
    /** Member to edit: id, name, email, accountRole, status. Form is synced when open becomes true. */
    export let member: {
        id: string;
        name: string | null;
        email: string;
        accountRole?: string;
        status?: string;
    } | null = null;

    /** Set by parent while the save request is in progress (e.g. fetch to updateMember). */
    export let loading = false;

    const dispatch = createEventDispatcher<{
        close: void;
        save: { userId: string; name: string; email: string; accountRole: string; status: string; password?: string };
    }>();

    const accountRoleOptions = [
        { id: 'MEMBER', label: 'Member' },
        { id: 'ADMIN', label: 'Admin' }
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let name = '';
    let email = '';
    let accountRole = 'MEMBER';
    let active = true;
    let password = '';
    let passwordVisible = false;
    let nameError = '';
    let emailError = '';

    $: if (open && member) {
        name = member.name ?? '';
        email = member.email ?? '';
        accountRole = member.accountRole ?? 'MEMBER';
        active = (member.status ?? 'ACTIVE') === 'ACTIVE';
        password = '';
        passwordVisible = false;
        nameError = '';
        emailError = '';
    }

    function close() {
        open = false;
        dispatch('close');
    }

    function validate(): boolean {
        nameError = '';
        emailError = '';
        if (!name.trim()) nameError = 'Member name is required';
        if (!email.trim()) emailError = 'Contact email is required';
        else if (!emailRegex.test(email.trim())) emailError = 'Please enter a valid email address';
        return !nameError && !emailError;
    }

    function handleSubmit() {
        if (!member) return;
        if (!validate()) return;
        const payload = {
            userId: member.id,
            name: name.trim(),
            email: email.trim(),
            accountRole,
            status: active ? 'ACTIVE' : 'INACTIVE',
            ...(password.trim() ? { password: password.trim() } : {})
        };
        dispatch('save', payload);
    }
</script>

<Modal
    bind:open
    title="Edit Member"
    width="880px"
    on:close={close}
>
    <div class="edit-member-modal">
        <div class="form-body modal-form-two-col">
            <div class="form-row">
                <div class="form-col">
                    <InputField
                        label="Member Name"
                        placeholder="Enter"
                        bind:value={name}
                        required={true}
                        state={nameError ? 'error' : 'default'}
                        helperText={nameError}
                    />
                </div>
                <div class="form-col form-col-role-active">
                    <div class="dropdown-field">
                        <span class="field-label">Account Role</span>
                        <Dropdown
                            options={accountRoleOptions}
                            bind:value={accountRole}
                            width="100%"
                            disabled={true}
                        />
                    </div>
                    <div class="toggle-field toggle-field-inline">
                        <Toggle bind:checked={active} />
                        <span class="field-label">Active</span>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-col">
                    <InputField
                        label="Contact Email"
                        placeholder="Enter"
                        type="email"
                        bind:value={email}
                        required={true}
                        state={emailError ? 'error' : 'default'}
                        helperText={emailError}
                    />
                </div>
                <div class="form-col">
                    <InputField
                        label="Password"
                        placeholder="Enter"
                        type={passwordVisible ? 'text' : 'password'}
                        bind:value={password}
                        suffixIcon={true}
                    >
                        <button
                            slot="suffix-icon"
                            type="button"
                            class="password-toggle-btn"
                            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                            on:click|stopPropagation={() => (passwordVisible = !passwordVisible)}
                        >
                            {#if passwordVisible}
                                <EyeOff size={20} />
                            {:else}
                                <Eye size={20} />
                            {/if}
                        </button>
                    </InputField>
                </div>
            </div>
        </div>
    </div>
    <div slot="footer" class="edit-member-modal-footer">
        <Button variant="outline" color="primary" size="lg" on:click={close}>
            Cancel
        </Button>
        <Button variant="filled" color="primary" size="lg" loading={loading} on:click={handleSubmit}>
            Save
        </Button>
    </div>
</Modal>

<style>
    .edit-member-modal .form-body {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-4);
    }

    .edit-member-modal .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ds-space-4);
    }

    .edit-member-modal .form-col {
        min-width: 0;
    }

    .edit-member-modal .form-col-role-active {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: var(--ds-space-4);
    }

    .edit-member-modal .form-col-role-active .dropdown-field {
        flex: 1;
        min-width: 0;
    }

    .edit-member-modal .form-col-role-active .toggle-field {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding-bottom: var(--ds-space-0-5);
        min-width: 120px;
    }

    .edit-member-modal .dropdown-field {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-1-5);
    }

    .edit-member-modal .toggle-field {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-1-5);
    }

    .edit-member-modal .toggle-field-inline {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: var(--ds-space-2);
        min-height: 44px;
    }

    .edit-member-modal .toggle-field-inline .field-label {
        margin: 0;
        white-space: nowrap;
    }

    .edit-member-modal .password-toggle-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--ds-text-tertiary);
    }

    .edit-member-modal .password-toggle-btn:hover {
        color: var(--ds-text-primary);
    }

    .edit-member-modal .field-label {
        font: var(--ds-text-sm-medium);
        color: var(--ds-text-secondary);
    }

    .edit-member-modal-footer {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: var(--ds-space-4);
        width: 100%;
    }
</style>
