import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, generateTestUserData, CleanUp } from '../../../resources/fixtures';
import { utilityQueries, accountQueries, billQueries, paymentQueries, blnkQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import { logger } from '../../../resources/utils/logger';
import * as PaymentData from '../../../resources/data/payment-data.json';
import type { MoveInResult } from '../../../resources/types';

let MoveIn: MoveInResult;


test.beforeEach(async ({ page }) => {
    await utilityQueries.updateBuildingBilling("autotest", true);
    await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
    await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page }) => {
    if (MoveIn?.pgUserEmail) {
        await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    }
    await page.close();
});


/**
 * Triggers the Inngest auto-pay reconciliation event.
 * This event causes the system to look for users with outstanding balances
 * and valid payment methods, then creates new payment attempts.
 */
async function triggerInngestReconciliation(): Promise<void> {
    const inngestKey = process.env.INNGEST_EVENT_KEY;
    if (!inngestKey) {
        throw new Error('INNGEST_EVENT_KEY environment variable is not set');
    }

    const response = await fetch(`https://inn.gs/e/${inngestKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'auto-pay-reconciliation-trigger', data: {} })
    });

    logger.info(`Inngest reconciliation trigger response status: ${response.status}`);
    expect(response.status).toBe(200);
}


test.describe('P1-24: Auto-pay fail -> Inngest reconciliation -> success (COMED Electric Only)', () => {
    test.describe.configure({ mode: "serial" });

    test('COMED Electric Only: auto-pay fails with invalid card, user updates card, Inngest reconciliation succeeds', { tag: [TEST_TAGS.PAYMENT] }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage }) => {

        test.setTimeout(1800000);

        const PGuserUsage = await generateTestUserData();

        await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "COMED");

        // Step 1: Move-in with auto-pay + invalid card
        await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page, "COMED", "COMED", true, false, true, PaymentData.InvalidCardNumber);

        await page.goto('/sign-in');
        await overviewPage.Accept_New_Terms_And_Conditions();

        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

        // Step 2: Insert bill + approve -> auto-pay triggers -> payment fails
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(TIMEOUTS.ANIMATION);

        const ElectricBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);

        await page.waitForTimeout(TIMEOUTS.MEDIUM);
        await billQueries.approveElectricBill(ElectricBillID);
        await page.waitForTimeout(TIMEOUTS.MEDIUM);

        await billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment");
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true);

        // Wait for auto-pay to process and fail (invalid card)
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await billQueries.checkElectricBillStatus(ElectricAccountId, "failed");

        logger.info('Auto-pay failed as expected with invalid card');

        // Verify failed state on UI
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
        ]);

        // Step 3: User updates card to valid card via profile page
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

        logger.info('Card updated to valid card, triggering Inngest reconciliation');

        // Step 4: Trigger Inngest auto-pay reconciliation
        await triggerInngestReconciliation();

        // Step 5: Reconciliation finds outstanding balance -> creates new payment -> succeeds
        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, true);

        logger.info('Reconciliation payment succeeded');

        // Step 6: Verify UI shows success
        await page.waitForTimeout(TIMEOUTS.DEFAULT);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        // Step 7: BLNK Ledger Verification
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Reconciliation payment ${payment.id} — chain verified`);
        }
    });
});


test.describe('P2-06: Auto-fail -> update card -> reconciliation -> success (E+G separate charge accounts)', () => {
    test.describe.configure({ mode: "serial" });

    test('EVERSOURCE E+G: both bills fail with invalid card, user updates card, Inngest reconciliation succeeds for both', { tag: [TEST_TAGS.PAYMENT] }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage }) => {

        test.setTimeout(1800000);

        const PGuserUsage = await generateTestUserData();

        await utilityQueries.updateCompaniesToBuilding("autotest", "EVERSOURCE", "EVERSOURCE");

        // Step 1: Move-in with auto-pay + invalid card (E+G, separate charge accounts)
        await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page, "EVERSOURCE", "EVERSOURCE", true, true, true, PaymentData.InvalidCardNumber);

        await page.goto('/sign-in');
        await overviewPage.Accept_New_Terms_And_Conditions();

        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

        // Step 2: Insert both bills + approve -> auto-pay triggers -> both fail
        await Promise.all([
            billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(TIMEOUTS.ANIMATION);

        const ElectricBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, false),
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);

        await page.waitForTimeout(TIMEOUTS.MEDIUM);
        await Promise.all([
            billQueries.approveElectricBill(ElectricBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await page.waitForTimeout(TIMEOUTS.MEDIUM);

        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
            billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, true),
        ]);

        // Wait for auto-pay to process and fail for both
        await Promise.all([
            billQueries.checkElectricBillProcessing(ElectricAccountId),
            billQueries.checkGasBillProcessing(GasAccountId),
        ]);
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "failed"),
            billQueries.checkGasBillStatus(GasAccountId, "failed"),
        ]);

        logger.info('Both electric and gas auto-pay failed as expected with invalid card');

        // Verify failed state on UI
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
        ]);

        // Step 3: User updates card to valid card via profile page
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

        logger.info('Card updated to valid card, triggering Inngest reconciliation for E+G');

        // Step 4: Trigger Inngest auto-pay reconciliation
        await triggerInngestReconciliation();

        // Step 5: Reconciliation handles both bills -> success
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded"),
            billQueries.checkGasBillStatus(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
        ]);

        logger.info('Reconciliation payment succeeded for both electric and gas');

        // Step 6: Verify UI shows success for both
        await page.waitForTimeout(TIMEOUTS.DEFAULT);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        // Step 7: BLNK Ledger Verification for both
        const electricPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (electricPayment) {
            await blnkQueries.verifyFeeCalculation(electricPayment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(electricPayment.id);
            logger.info(`BLNK PASS: Reconciliation electric payment ${electricPayment.id} — chain verified`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Reconciliation gas payment ${gasPayment.id} — chain verified`);
        }
    });
});


test.describe('P2-07: Multiple failure cycles -> eventual reconciliation success (COMED Electric Only)', () => {
    test.describe.configure({ mode: "serial" });

    test('COMED Electric Only: auto-pay fails twice with bad cards, third card valid, Inngest reconciliation succeeds', { tag: [TEST_TAGS.PAYMENT] }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage }) => {

        test.setTimeout(1800000);

        const PGuserUsage = await generateTestUserData();

        await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "COMED");

        // Step 1: Move-in with auto-pay + invalid card
        await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page, "COMED", "COMED", true, false, true, PaymentData.InvalidCardNumber);

        await page.goto('/sign-in');
        await overviewPage.Accept_New_Terms_And_Conditions();

        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

        // Step 2: Insert bill + approve -> first auto-pay triggers -> fails (invalid card)
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(TIMEOUTS.ANIMATION);

        const ElectricBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);

        await page.waitForTimeout(TIMEOUTS.MEDIUM);
        await billQueries.approveElectricBill(ElectricBillID);
        await page.waitForTimeout(TIMEOUTS.MEDIUM);

        await billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment");
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true);

        // Wait for first auto-pay to fail
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await billQueries.checkElectricBillStatus(ElectricAccountId, "failed");

        logger.info('CYCLE 1: Auto-pay failed as expected with first invalid card');

        // Step 3: User updates to ANOTHER invalid card (still will fail)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.InvalidCardNumber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

        logger.info('CYCLE 2: Card updated to second invalid card, triggering reconciliation');

        // Step 4: Trigger reconciliation -> second failure expected
        await triggerInngestReconciliation();

        // Wait for the second payment attempt to fail
        await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, "failed");

        logger.info('CYCLE 2: Reconciliation payment failed again with second invalid card');

        // Verify bill still shows as failed on UI
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
        ]);

        // Step 5: User updates to GOOD card
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

        logger.info('CYCLE 3: Card updated to valid card, triggering final reconciliation');

        // Step 6: Trigger reconciliation -> success
        await triggerInngestReconciliation();

        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, true);

        logger.info('CYCLE 3: Reconciliation payment succeeded with valid card');

        // Step 7: Verify UI shows success
        await page.waitForTimeout(TIMEOUTS.DEFAULT);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        // Step 8: BLNK Ledger Verification
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Reconciliation payment ${payment.id} — chain verified after multiple failure cycles`);
        }
    });
});
