# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user.test.js >> User Management >> Given a user email, when canceling deactivate dialog, then the user should remain active
- Location: tests\user.test.js:29:5

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "https://app-dev-v2.datarealities.com/admin/users", waiting until "load"

```

# Test source

```ts
  1   | const { expect } = require('@playwright/test');
  2   | const config = require('../../config/config-loader');
  3   | const BasePage = require('../base-page');
  4   | const SortUtils = require('../../utils/sort-utils');
  5   | const DialogUtils = require('../../utils/dialog-utils');
  6   | 
  7   | class UserPage extends BasePage {
  8   |     constructor(page) {
  9   |         super(page);
  10  |         this.page = page;
  11  | 
  12  |         this.tableRows = page.locator('table tbody tr');
  13  | 
  14  |         // Page locators
  15  |         this.userListName = page.locator('text=Users');
  16  |         this.addUserButton = page.locator('button:has-text("Add User")');
  17  |         this.inviteUserButton = page.locator('button:has-text("Invite User")');
  18  | 
  19  |         // Form fields
  20  |         this.emailInput = page.locator('input#email[type="email"]');
  21  |         this.nameInput = page.locator('input#name[type="text"]');
  22  |         this.passwordInput = page.locator('input#password[type="password"]');
  23  |         this.roleSelect = page.locator('button[role="combobox"]').first();
  24  |         this.statusSelect = page.locator('button[role="combobox"]').nth(1);
  25  | 
  26  |         // Save buttons
  27  |         this.saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")');
  28  |         this.saveChangesButton = page.locator('button:has-text("Save Changes")');
  29  |         this.cancelButton = page.locator('button:has-text("Cancel")');
  30  | 
  31  |         // Unsaved changes indicator
  32  |         this.unsavedChangesBanner = page.locator('text=You have unsaved changes');
  33  |     }
  34  | 
  35  |     async goToUserPage() {
> 36  |         await this.page.goto(config.pageURL.users.url);
      |                         ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  37  |         await this.userListName;
  38  |     }
  39  | 
  40  |     /*
  41  |     ########################################################
  42  |     ################ Create User ############################
  43  |     ########################################################
  44  |     */
  45  |     async createUser(email, name, options = {}) {
  46  |         await this.goToUserPage();
  47  | 
  48  |         await this.addUserButton.click();
  49  | 
  50  |         // Fill required fields
  51  |         await this.emailInput.waitFor({ state: 'visible' });
  52  |         await this.emailInput.fill(email);
  53  |         await this.nameInput.fill(name);
  54  | 
  55  |         // Set password if provided, otherwise use generated password
  56  |         if (options.password) {
  57  |             await this.passwordInput.fill(options.password);
  58  |         }
  59  | 
  60  |         // Select role if provided
  61  |         if (options.role) {
  62  |             await this.roleSelect.click();
  63  |             const roleOptions = this.page.locator('div[role="option"]');
  64  |             await roleOptions.first().waitFor({ state: 'visible' });
  65  |             await roleOptions.first().click();
  66  |         }
  67  | 
  68  |         // Select status if provided
  69  |         if (options.status) {
  70  |             await this.statusSelect.click();
  71  |             const statusOptions = this.page.locator('div[role="option"]');
  72  |             await statusOptions.first().waitFor({ state: 'visible' });
  73  |             await statusOptions.first().click();
  74  |         }
  75  | 
  76  |         await this.saveButton.click();
  77  | 
  78  |         // Verify user was created
  79  |         await this.tableRows.first().waitFor({ state: 'visible' });
  80  |         const newUserLocator = this.page.locator(`table td >> text="${email}"`);
  81  |         await expect(newUserLocator).toBeVisible();
  82  |         return true;
  83  |     }
  84  | 
  85  |     /*
  86  |     ########################################################
  87  |     ################ Edit User ##############################
  88  |     ########################################################
  89  |     */
  90  |     async editUserNameViaEmail(email, newName) {
  91  |         await this.openUserViaEmail(email);
  92  | 
  93  |         // Wait for form to show and name input to be editable
  94  |         // The name input is the second input field (email is first but disabled)
  95  |         const nameInput = this.page.locator('input#name[name="name"]');
  96  |         await nameInput.waitFor({ state: 'visible' });
  97  |         await nameInput.fill(newName);
  98  | 
  99  |         // Save changes (no unsaved banner in user edit)
  100 |         await expect(this.saveChangesButton).toBeEnabled();
  101 |         await this.saveChangesButton.click();
  102 | 
  103 |         // Wait for page to redirect back to user list
  104 |         await this.userListName.waitFor({ state: 'visible' });
  105 | 
  106 |         // Verify the user name was updated by checking the table
  107 |         const row = await this.getRowByEmail(email);
  108 |         await expect(row).toBeVisible();
  109 | 
  110 |         return true;
  111 |     }
  112 | 
  113 |     async verifyAllSort() {
  114 |         await this.goToUserPage();
  115 |         await SortUtils.verifyColumnSorting(this.page, 'Email', 'text', false);
  116 |         await SortUtils.verifyColumnSorting(this.page, 'Roles', 'text', false);
  117 |         await SortUtils.verifyColumnSorting(this.page, 'Created At', 'relative', false);
  118 |         await SortUtils.verifyColumnSorting(this.page, 'Status', 'text', false);
  119 | 
  120 |         await SortUtils.verifyColumnSorting(this.page, 'Email', 'text', true);
  121 |         await SortUtils.verifyColumnSorting(this.page, 'Roles', 'text', true);
  122 |         await SortUtils.verifyColumnSorting(this.page, 'Created At', 'relative', true);
  123 |         await SortUtils.verifyColumnSorting(this.page, 'Status', 'text', true);
  124 |     }
  125 | 
  126 |     /*
  127 |     * Way 1: Open user by clicking its email/span (or parent button)
  128 |     */
  129 |     async openUserViaEmail(email) {
  130 |         const row = await this.getRowByEmail(email);
  131 |         // Prefer the clickable wrapper with role=button near the email
  132 |         const emailButton = row.locator('div[role="button"]', { hasText: email });
  133 |         if (await emailButton.count()) {
  134 |             await emailButton.click();
  135 |         } else {
  136 |             // fallback to clicking the span itself
```