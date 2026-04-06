# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account.test.js >> Account Management >> Given an account name, when deactivating the account via dialog, then it should be deactivated successfully
- Location: tests\account.test.js:30:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Accounts List')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Accounts List')

```

# Test source

```ts
  1   | const { expect } = require('@playwright/test');
  2   | const config = require('../../config/config-loader');
  3   | const BasePage = require('../base-page');
  4   | const SortUtils = require('../../utils/sort-utils');
  5   | const DialogUtils = require('../../utils/dialog-utils');
  6   | 
  7   | class AccountPage extends BasePage {
  8   |     constructor(page) {
  9   |         super(page);
  10  |         this.page = page;
  11  | 
  12  |         this.table = page.locator('table tbody');
  13  |         this.tableRows = page.locator('table tbody tr');
  14  | 
  15  |         // Page locators
  16  |         this.accountListName = page.locator('text=Accounts List');
  17  |         this.addAccountButton = page.locator('button:has-text("Add Account")');
  18  | 
  19  |         // Form fields
  20  |         this.accountNameInput = page.locator('input#name[placeholder="Enter account name"]');
  21  |         this.descriptionInput = page.locator('textarea#description[placeholder="Enter account description"]');
  22  | 
  23  |         // Save buttons
  24  |         this.saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")');
  25  |         this.saveChangesButton = page.locator('button:has-text("Save Changes")');
  26  |         this.cancelButton = page.locator('button:has-text("Cancel")');
  27  | 
  28  |         // Unsaved changes indicator
  29  |         this.unsavedChangesBanner = page.locator('text=You have unsaved changes');
  30  |     }
  31  | 
  32  | 
  33  |     async goToAccountPage() {
  34  |         await this.page.goto(config.pageURL.accounts.url);
> 35  |         await expect(this.accountListName).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
  36  |         await this.table.waitFor();
  37  |     }
  38  | 
  39  |     /*
  40  |     ########################################################
  41  |     ################ Create Account ########################
  42  |     ########################################################
  43  |     */
  44  |     async createAccount(accountName, description) {
  45  |         await this.goToAccountPage();
  46  | 
  47  |         await this.addAccountButton.click();
  48  | 
  49  |         await this.accountNameInput.waitFor({ state: 'visible' });
  50  |         await this.accountNameInput.fill(accountName);
  51  |         await this.descriptionInput.fill(description);
  52  | 
  53  |         await this.saveButton.click();
  54  | 
  55  |         await this.tableRows.first().waitFor({ state: 'visible' });
  56  |         const newAccountLocator = this.page.locator(`table td >> text="${accountName}"`);
  57  |         await expect(newAccountLocator).toBeVisible();
  58  |         return true;
  59  |     }
  60  | 
  61  |     /*
  62  |     ########################################################
  63  |     ################ Edit Account ########################
  64  |     ########################################################
  65  |     */
  66  |     async editAccountNameViaName(oldName, newName) {
  67  |         await this.openAccountViaName(oldName);
  68  | 
  69  |         // Wait for form to show and input to be editable
  70  |         await this.accountNameInput.waitFor({ state: 'visible' });
  71  |         await this.accountNameInput.fill(newName);
  72  | 
  73  |         // Expect unsaved banner to appear
  74  |         await expect(this.unsavedChangesBanner).toBeVisible();
  75  | 
  76  |         // Save changes
  77  |         await expect(this.saveChangesButton).toBeEnabled();
  78  |         await this.saveChangesButton.click();
  79  | 
  80  |         // Wait for unsaved banner to disappear (assuming save completes in-place)
  81  |         await expect(this.unsavedChangesBanner).not.toBeVisible();
  82  | 
  83  |         // Optionally: verify that the name input reflects the new name still
  84  |         const currentName = await this.accountNameInput.inputValue();
  85  |         if (currentName.trim() !== newName.trim()) {
  86  |             throw new Error(`Expected account name to persist as "${newName}" but found "${currentName}"`);
  87  |         }
  88  | 
  89  |         return true;
  90  |     }
  91  | 
  92  |     async verifyAllSort(){
  93  |         await this.goToAccountPage();
  94  |         await SortUtils.verifyColumnSorting(this.page, 'Name', 'text', false);
  95  |         await SortUtils.verifyColumnSorting(this.page, 'Slug', 'text', false);
  96  |         await SortUtils.verifyColumnSorting(this.page, 'Status', 'text', false);
  97  |         await SortUtils.verifyColumnSorting(this.page, 'Created', 'relative', false);
  98  | 
  99  |         await SortUtils.verifyColumnSorting(this.page, 'Name', 'text', true);
  100 |         await SortUtils.verifyColumnSorting(this.page, 'Slug', 'text', true);
  101 |         await SortUtils.verifyColumnSorting(this.page, 'Status', 'text', true);
  102 |         await SortUtils.verifyColumnSorting(this.page, 'Created', 'relative', true);
  103 |     }
  104 | 
  105 |     /*
  106 |     * Way 1: Open account by clicking its name/span (or parent button)
  107 |     */
  108 |     async openAccountViaName(accountName) {
  109 |         const row = await this.getRowByName(accountName);
  110 |         // Prefer the clickable wrapper with role=button near the name
  111 |         const nameButton = row.locator('div[role="button"]', { hasText: accountName });
  112 |         if (await nameButton.count()) {
  113 |             await nameButton.click();
  114 |         } else {
  115 |             // fallback to clicking the span itself
  116 |             await row.locator('span', { hasText: accountName }).click();
  117 |         }
  118 |     }
  119 | 
  120 |     /*
  121 |      * Way 2: Open action dropdown and select an action by visible label
  122 |      * actionName examples: 'Edit Account', 'Deactivate', 'Delete'
  123 |      */
  124 |     async openAccountAction(accountName, actionName) {
  125 |         const row = await this.getRowByName(accountName);
  126 | 
  127 |         // Find the ellipsis / action dropdown trigger in that row
  128 |         const ellipsisButton = row.locator('button').filter({
  129 |             has: row.locator('svg[class*="lucide-ellipsis-vertical"], svg[aria-label="More"]'),
  130 |         }).first();
  131 | 
  132 |         if (await ellipsisButton.count()) {
  133 |             await ellipsisButton.click();
  134 |         } else {
  135 |             // fallback: any button in the actions cell
```