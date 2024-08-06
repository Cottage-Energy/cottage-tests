import { test, expect } from '../../resources/fixtures/pg_pages_fixture';
import { MoveInTestUtilities } from '../../resources/fixtures/moveInUtilities';
import { generateTestUserData } from '../../resources/fixtures/test_user';
import {supabase} from '../../resources/utils/supabase';
import {linearClient} from '../../resources/utils/linear';
import { TIMEOUT } from 'dns';

test ('test', async ({ moveInpage,request,page }) => {
  test.setTimeout(300000);

  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

  const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);


  const { data: cottageUser } = await supabase
    .from('CottageUsers')
    .select('id')
    .eq('email', MoveIn.PGUserEmail)
    .single()
    .throwOnError();
  const cottageUserId = cottageUser?.id ?? '';
  console.log(cottageUserId);

  const { data: EAccount } = await supabase
    .from('ElectricAccount')
    .select('id')
    .eq('cottageUserID', cottageUserId)
    .single()
    .throwOnError();
  const ElectricAccountId = EAccount?.id ?? '';
  console.log(ElectricAccountId.toString());


  // Simulate payment
  const response = await request.post('https://ojaryxuxdh.execute-api.us-east-1.amazonaws.com/payments/simulate', {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer thisisasecretkeyforadminactions',
      },
      data: {
        accountId: ElectricAccountId.toString(), // Use the fetched ElectricAccountId
        accountType: "Electric",
        totalAmountDue: 10111,
        totalUsage: 14,
      },
  });
    
    // Check the response status and optionally the response body
  console.log(await response.status()); // Log the status for debugging
  const responseBody = await response.json();
  console.log(responseBody); // Log the response body for debugging
    
    // Example assertion: Ensure the API call was successful
  expect(response.status()).toBe(200);






  //supabase check bill visibility - false
  //supabase check bill isSendReminder - true
  const { data: ElectricBillReminder } = await supabase
    .from('ElectricBill')
    .select('isSendReminder')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillreminder = ElectricBillReminder?.isSendReminder ?? '';
  console.log(ElectricBillreminder);
  expect(ElectricBillreminder).toBe(true);

  //platform check and bills page
  //supabase check if bill paid notification - false
  
  // linear set bill to Done
  await page.waitForTimeout(10000);
  const teamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: "billing-dev" } } })).nodes[0].id;
  const doneStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: teamId } }, name: { eqIgnoreCase: "approved" } } })).nodes[0].id;
  const issuesResponse = await linearClient.issues({
    filter: {
      team: { id: { eq: teamId } },
      description: { contains:MoveIn.PGUserEmail },
    },
  });

  const issuesId = issuesResponse.nodes[0].id;
  const issuesCount = issuesResponse.nodes.length;
  console.log(`Number of issues: ${issuesCount}`);
  console.log(issuesResponse);
  //console.log(issuesId);
  //console.log(doneStatusId);
  //console.log(userData.FirstName +" "+ userData.LastName);

  await linearClient.updateIssue(issuesId, { stateId: doneStatusId });

  //supabase check if bill scheduled
  await page.waitForTimeout(15000);
  const { data: ElectricBillStatus2 } = await supabase
    .from('ElectricBill')
    .select('paymentStatus')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillstatus2 = ElectricBillStatus2?.paymentStatus ?? '';
  console.log(ElectricBillstatus2);
  await expect(ElectricBillstatus2).toBe("scheduled_for_payment"); // should be scheduled_for_payment

  
  // supabase check bill visibility - true
  await page.waitForTimeout(90000);
  const { data: ElectricBillVis } = await supabase
    .from('ElectricBill')
    .select('visible')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillvisib = ElectricBillVis?.visible ?? '';
  console.log(ElectricBillvisib);
  expect(ElectricBillvisib).toBe(true); // should be true

  //check bill ready email - received
  //check platform dashboard and bills page
  
  //supabase check if bill paid notification //check email - true
  const { data: ElectricBillPaidNotif } = await supabase
    .from('ElectricBill')
    .select('paidNotificationSent')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillpaidNotif = ElectricBillPaidNotif?.paidNotificationSent ?? '';
  console.log(ElectricBillpaidNotif);
  expect(ElectricBillpaidNotif).toBe(true); // should be true
  
  //supabase check if bill success
  const { data: ElectricBillStatus } = await supabase
    .from('ElectricBill')
    .select('paymentStatus')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillstatus = ElectricBillStatus?.paymentStatus ?? '';
  console.log(ElectricBillstatus);
  expect(ElectricBillstatus).toBe("succeeded"); // should be succeeded
  
  //check platform dashboard and bills page


  


});