import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * ResidentInvitePage — the /resident?inviteCode=X page that a household
 * invite recipient lands on from their email link.
 *
 * Guards the recipient side of the household invite flow: accept form
 * rendering, field inputs, accept submit, decline path, invalid-code
 * fallback.
 */
export class ResidentInvitePage {
    readonly page: Page;
    readonly heading: Locator;
    readonly invitedYouLabel: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly termsCheckbox: Locator;
    readonly joinHouseholdButton: Locator;
    readonly declineInvitationButton: Locator;
    readonly invalidInvitationHeading: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: /accept your invitation/i });
        this.invitedYouLabel = page.getByText(/invited you/i).first();
        this.firstNameInput = page.locator('input[name="firstName"]');
        this.lastNameInput = page.locator('input[name="lastName"]');
        this.emailInput = page.locator('input[name="email"]');
        this.termsCheckbox = page.getByRole('checkbox', { name: /I agree to Public Grid/i });
        this.joinHouseholdButton = page.getByRole('button', { name: /join household/i });
        this.declineInvitationButton = page.getByRole('button', { name: /decline invitation/i });
        this.invalidInvitationHeading = page.getByRole('heading', { name: /invalid invitation/i });
    }

    async navigateWithCode(inviteCode: string): Promise<void> {
        await this.page.goto(`/resident?inviteCode=${inviteCode}`);
    }

    async expectAcceptFormVisible(): Promise<void> {
        await expect(this.heading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.invitedYouLabel).toBeVisible();
        await expect(this.joinHouseholdButton).toBeVisible();
    }

    async expectInvalidInvitation(): Promise<void> {
        // Invalid invite should NOT show the accept form
        await expect(this.joinHouseholdButton)
            .not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }

    async fillAcceptForm(firstName: string, lastName: string): Promise<void> {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.termsCheckbox.click();
    }

    async submitAccept(): Promise<void> {
        await this.joinHouseholdButton.click();
    }
}

export default ResidentInvitePage;
