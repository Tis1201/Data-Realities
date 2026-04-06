# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user.test.js >> User Management >> Given a user email, when editing the user name, then it should be updated successfully
- Location: tests\user.test.js:25:5

# Error details

```
Error: User row with email "test@example.com" not found
```

# Test source

```ts
  151 |         }).first();
  152 | 
  153 |         if (await ellipsisButton.count()) {
  154 |             await ellipsisButton.click();
  155 |         } else {
  156 |             // fallback: any button in the actions cell
  157 |             const fallbackButton = row.locator('td').last().locator('button').first();
  158 |             if (await fallbackButton.count()) {
  159 |                 await fallbackButton.click();
  160 |             } else {
  161 |                 throw new Error('Could not find action dropdown trigger for user row');
  162 |             }
  163 |         }
  164 | 
  165 |         // Wait for menu and click the desired action
  166 |         const menuItem = this.page.locator('div[role="menuitem"]', { hasText: actionName }).first();
  167 |         await menuItem.waitFor({ state: 'visible' });
  168 |         await menuItem.click();
  169 |     }
  170 | 
  171 |     // Convenience wrapper for editing via the dropdown
  172 |     async editUserViaAction(email) {
  173 |         await this.openUserAction(email, 'Edit User');
  174 |     }
  175 | 
  176 |     /*
  177 |     ########################################################
  178 |     ################ Deactivate User #######################
  179 |     ########################################################
  180 |     */
  181 |     async deactivateUser(email) {
  182 |         await this.openUserAction(email, 'Deactivate');
  183 | 
  184 |         // Handle deactivate dialog using utility (without name verification)
  185 |         await DialogUtils.handleGenericDialog(this.page, 'Deactivate');
  186 | 
  187 |         await this.goToUserPage();
  188 |         // Verify the user status has changed to "Inactive" or similar
  189 |         const row = await this.getRowByEmail(email);
  190 |         const statusCell = row.locator('td').nth(3); // Status column (4th column, 0-indexed)
  191 |         await expect(statusCell).toContainText('Inactive');
  192 | 
  193 |         return true;
  194 |     }
  195 | 
  196 |     /*
  197 |     ########################################################
  198 |     ################ Delete User ###########################
  199 |     ########################################################
  200 |     */
  201 |     async deleteUser(email) {
  202 |         await this.openUserAction(email, 'Delete');
  203 | 
  204 |         // Handle delete dialog using utility
  205 |         await DialogUtils.handleDeleteDialog(this.page);
  206 | 
  207 |         await this.goToUserPage();
  208 |         // Verify the user has been removed from the table
  209 |         // Use a more direct approach to check if the row exists
  210 |         const row = this.tableRows.filter({ hasText: email }).first();
  211 |         await expect(row).not.toBeVisible();
  212 | 
  213 |         return true;
  214 |     }
  215 | 
  216 |     /*
  217 |     ########################################################
  218 |     ################ Cancel Dialog Operations ##############
  219 |     ########################################################
  220 |     */
  221 |     async cancelDeactivateUser(email) {
  222 |         await this.openUserAction(email, 'Deactivate');
  223 | 
  224 |         // Handle cancel dialog using utility
  225 |         await DialogUtils.handleCancelDialog(this.page);
  226 | 
  227 |         // Verify the user is still in the table and status hasn't changed
  228 |         const row = await this.getRowByEmail(email);
  229 |         await expect(row).toBeVisible();
  230 | 
  231 |         return true;
  232 |     }
  233 | 
  234 |     async cancelDeleteUser(email) {
  235 |         await this.openUserAction(email, 'Delete');
  236 | 
  237 |         // Handle cancel dialog using utility
  238 |         await DialogUtils.handleCancelDialog(this.page);
  239 | 
  240 |         // Verify the user is still in the table
  241 |         const row = await this.getRowByEmail(email);
  242 |         await expect(row).toBeVisible();
  243 | 
  244 |         return true;
  245 |     }
  246 | 
  247 |     async getRowByEmail(email) {
  248 |         await this.goToUserPage();
  249 |         const row = this.tableRows.filter({ hasText: email }).first();
  250 |         if (!(await row.count())) {
> 251 |             throw new Error(`User row with email "${email}" not found`);
      |                   ^ Error: User row with email "test@example.com" not found
  252 |         }
  253 |         return row;
  254 |     }
  255 | }
  256 | 
  257 | module.exports = { UserPage };
  258 | 
```