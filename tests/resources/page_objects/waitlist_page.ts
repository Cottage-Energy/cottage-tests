import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * WaitlistPage — the "We're not able to service this area yet" screen that
 * users reach when their move-in address is outside the service area.
 *
 * This is the no-service waitlist branch (reached via /move-in with an
 * unsupported address). Different from the existing-utility waitlist
 * branch, which has a separate code path that persists address + reference
 * correctly (see row #352 vs row #353 in Finding #2 of ENG-2188 retest).
 */
export class WaitlistPage {
    readonly page: Page;
    readonly heading: Locator;
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly zipInput: Locator;
    readonly joinWaitListButton: Locator;
    readonly backButton: Locator;
    readonly receivedToast: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: /We're not able to service this area yet/i });
        this.nameInput = page.getByRole('textbox', { name: 'Name *' });
        this.emailInput = page.getByRole('textbox', { name: 'Email *' });
        this.zipInput = page.getByRole('textbox', { name: 'Zip code *' });
        this.joinWaitListButton = page.getByRole('button', { name: 'Join Wait List' });
        this.backButton = page.getByRole('button', { name: 'Back' });
        // "Received!" appears in the toast div AND the screen-reader live
        // region — .first() satisfies strict mode.
        this.receivedToast = page.getByText('Received!').first();
    }

    async expectVisible(): Promise<void> {
        await expect(this.heading).toBeVisible({ timeout: TIMEOUTS.LONG });
    }

    async fillForm(name: string, email: string, zip: string): Promise<void> {
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.zipInput.fill(zip);
    }

    async submit(): Promise<void> {
        await this.joinWaitListButton.click();
    }

    async expectReceivedToast(): Promise<void> {
        await expect(this.receivedToast).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }
}

export default WaitlistPage;
