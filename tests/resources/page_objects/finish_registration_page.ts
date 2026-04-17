import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';
import { createLogger } from '../utils/logger';

const log = createLogger('FinishRegistrationPage');

/**
 * Page Object for the finish-registration flow.
 * URL: /finish-registration?token=...&email=...&leaseID=...
 *
 * Steps (move-in enrollment):
 *   1. Enter your address (prefilled from URL params)
 *   2. Utility details — company questions (only for some utilities, e.g. Con Edison)
 *   3. Complete your registration — DOB, move-in date, SSN/ID, prior address
 *
 * Steps (verification enrollment):
 *   1. Enter your address
 *   2. Utility verification — email + proof upload
 */
export class FinishRegistrationPage {
  readonly page: Page;

  // ─── Step 1: Address ───
  readonly addressHeading: Locator;
  readonly addressInput: Locator;
  readonly unitInput: Locator;
  readonly continueButton: Locator;
  readonly stepIndicator: Locator;

  // ─── Step 2: Utility Details (company questions) ───
  readonly utilityDetailsHeading: Locator;
  readonly lifeSupport_No: Locator;
  readonly seniorDisabled_No: Locator;
  readonly assistancePrograms_Pass: Locator;
  readonly backButton: Locator;

  // ─── Step 3: Complete Registration (identity) ───
  readonly completeHeading: Locator;
  readonly dobInput: Locator;
  readonly moveInDateInput: Locator;
  readonly ssnInput: Locator;
  readonly identityMethodDropdown: Locator;
  readonly priorAddressInput: Locator;
  readonly verifyAndCompleteButton: Locator;

  // ─── Legal Links ───
  readonly termsLink: Locator;
  readonly privacyPolicyLink: Locator;
  readonly lpoaLink: Locator;

  // ─── Verification Enrollment: Provider Information ───
  readonly providerInfoHeading: Locator;
  readonly uploadProofButton: Locator;
  readonly doItLaterButton: Locator;
  readonly providerWebsiteLink: Locator;

  // ─── Verification Enrollment: Verify Utility Account ───
  readonly verifyUtilityHeading: Locator;
  readonly verifySubHeading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly fileUploadButton: Locator;
  readonly notifyCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1
    this.addressHeading = page.getByRole('heading', { name: /enter your address/i });
    this.addressInput = page.getByRole('textbox').first();
    this.unitInput = page.getByRole('textbox').nth(1);
    this.continueButton = page.getByRole('button', { name: /continue/i });
    this.stepIndicator = page.locator('text=/\\d+ \\/ \\d+ steps/');

    // Step 2 - Company questions
    this.utilityDetailsHeading = page.getByRole('heading', { name: /few more details/i });
    this.lifeSupport_No = page.getByRole('radio', { name: 'No' }).first();
    this.seniorDisabled_No = page.getByRole('radio', { name: 'No' }).nth(1);
    this.assistancePrograms_Pass = page.getByRole('radio', { name: 'Pass' });
    this.backButton = page.getByRole('button', { name: /back/i });

    // Step 3 - Identity verification
    this.completeHeading = page.getByRole('heading', { name: /complete your registration/i });
    this.dobInput = page.getByRole('textbox').first();
    this.moveInDateInput = page.getByRole('textbox', { name: /MM \/ DD \/ YYYY/i });
    this.ssnInput = page.getByRole('textbox').nth(2);
    this.identityMethodDropdown = page.getByRole('combobox').first();
    this.priorAddressInput = page.getByRole('textbox').last();
    this.verifyAndCompleteButton = page.getByRole('button', { name: /verify & complete/i });

    // Legal links
    this.termsLink = page.getByRole('link', { name: /terms/i });
    this.privacyPolicyLink = page.getByRole('link', { name: /privacy policy/i });
    this.lpoaLink = page.getByRole('link', { name: /lpoa/i });

    // Verification enrollment - Provider Information step
    this.providerInfoHeading = page.getByRole('heading', { name: /provider information/i });
    this.uploadProofButton = page.getByRole('button', { name: /upload proof/i });
    this.doItLaterButton = page.getByRole('button', { name: /i will do it later/i });
    this.providerWebsiteLink = page.getByRole('link', { name: /coned\.com/i });

    // Verification enrollment - Verify Utility Account step
    this.verifyUtilityHeading = page.getByRole('heading', { name: 'Verify your utility account', exact: true });
    this.verifySubHeading = page.getByRole('heading', { name: /verify your utility account setup/i });
    this.firstNameInput = page.locator('input').filter({ has: page.locator('~ div:has-text("First name")') });
    this.lastNameInput = page.locator('input').filter({ has: page.locator('~ div:has-text("Last name")') });
    this.emailInput = page.locator('input[disabled]');
    this.phoneInput = page.locator('input').filter({ has: page.locator('~ div:has-text("Phone number")') });
    this.fileUploadButton = page.getByRole('button', { name: /choose file/i });
    this.notifyCheckbox = page.getByRole('checkbox', { name: /notify me/i });
  }

  /** Navigate to a finish-registration URL */
  async goto(finishRegURL: string): Promise<void> {
    log.info('Navigating to finish-registration', {
      url: finishRegURL.substring(0, 80) + '...',
    });
    await this.page.goto(finishRegURL, { waitUntil: 'domcontentloaded' });
  }

  /** Wait for Step 1 (address) to be ready with prefilled data */
  async waitForAddressStep(): Promise<void> {
    log.step(1, 'Waiting for address step');
    await this.addressHeading.waitFor({ timeout: TIMEOUTS.MEDIUM });
    // Wait for address autocomplete to validate (Continue enables)
    await this.continueButton.waitFor({ timeout: TIMEOUTS.MEDIUM });
    await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
  }

  /** Get the prefilled address value */
  async getAddressValue(): Promise<string> {
    return await this.addressInput.inputValue();
  }

  /** Get the prefilled unit value */
  async getUnitValue(): Promise<string> {
    return await this.unitInput.inputValue();
  }

  /** Click Continue (waits for button to be enabled first) */
  async clickContinue(): Promise<void> {
    log.info('Clicking Continue');
    await expect(this.continueButton).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });
    await this.continueButton.click();
  }

  /** Answer company questions with safe defaults and continue */
  async answerCompanyQuestionsAndContinue(): Promise<void> {
    log.step(2, 'Answering company questions');
    // Check if company questions step appeared
    const hasQuestions = await this.utilityDetailsHeading
      .waitFor({ timeout: TIMEOUTS.SHORT })
      .then(() => true)
      .catch(() => false);

    if (!hasQuestions) {
      log.info('No company questions — skipping');
      return;
    }

    // Answer assistance programs (first two default to "No")
    if (await this.assistancePrograms_Pass.isVisible()) {
      await this.assistancePrograms_Pass.click();
    }
    await this.clickContinue();
  }

  /** Verify the identity verification step is showing with expected fields */
  async verifyIdentityStepVisible(): Promise<void> {
    log.step(3, 'Verifying identity step');
    await this.completeHeading.waitFor({ timeout: TIMEOUTS.MEDIUM });
    await expect(this.verifyAndCompleteButton).toBeVisible();
  }

  /** Click "Upload proof" on the provider information step (verification flow) */
  async clickUploadProof(): Promise<void> {
    log.info('Clicking Upload proof');
    await this.providerInfoHeading.waitFor({ timeout: TIMEOUTS.MEDIUM });
    await this.uploadProofButton.click();
  }

  /** Click "I will do it later" on the provider information step */
  async clickDoItLater(): Promise<void> {
    log.info('Clicking "I will do it later"');
    await this.doItLaterButton.click();
  }

  /** Verify the utility verification step is showing with expected fields */
  async verifyUtilityStepVisible(): Promise<void> {
    log.step(3, 'Verifying utility verification step');
    await this.verifyUtilityHeading.waitFor({ timeout: TIMEOUTS.MEDIUM });
    await expect(this.verifySubHeading).toBeVisible();
  }

  /** Verify provider info step shows utility details */
  async verifyProviderInfoVisible(): Promise<void> {
    log.step(2, 'Verifying provider information step');
    await this.providerInfoHeading.waitFor({ timeout: TIMEOUTS.MEDIUM });
    await expect(this.uploadProofButton).toBeVisible();
    await expect(this.doItLaterButton).toBeVisible();
  }

  /**
   * Fill identity verification fields and submit.
   * Used by P2-13 (finish-reg → payment onboarding).
   * Verified live 2026-04-14: step 2 shows DOB (prefilled), move-in date
   * (prefilled), SSN (required), Previous Address (required).
   */
  async completeIdentityVerification(ssn: string, priorAddress: string): Promise<void> {
    log.info('Completing identity verification', { hasSsn: !!ssn });
    await this.completeHeading.waitFor({ timeout: TIMEOUTS.MEDIUM });

    // SSN
    await this.ssnInput.fill(ssn);

    // Previous address — uses autocomplete, type slowly then pick first suggestion
    await this.priorAddressInput.click();
    await this.priorAddressInput.pressSequentially(priorAddress, { delay: 50 });
    // Wait for autocomplete dropdown, then select first option
    const suggestion = this.page.getByRole('option').first();
    try {
      await suggestion.waitFor({ timeout: TIMEOUTS.SHORT });
      await suggestion.click();
    } catch {
      // No autocomplete dropdown — address was typed as free text
      log.info('No autocomplete dropdown — using typed address as-is');
    }

    // Submit
    await expect(this.verifyAndCompleteButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });
    await this.verifyAndCompleteButton.click();
    log.info('Clicked Verify & Complete');
  }

  /** Verify legal consent links are present with correct hrefs */
  async verifyLegalLinks(): Promise<void> {
    log.info('Verifying legal links');
    await expect(this.termsLink).toBeVisible();
    await expect(this.privacyPolicyLink).toBeVisible();
    await expect(this.lpoaLink).toBeVisible();

    await expect(this.termsLink).toHaveAttribute('href', /terms-of-service/);
    await expect(this.privacyPolicyLink).toHaveAttribute('href', /privacy/);
    await expect(this.lpoaLink).toHaveAttribute('href', /lpoa/);
  }
}
