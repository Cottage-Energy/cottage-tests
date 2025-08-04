import { expect } from '@playwright/test';
import environmentBaseUrl from '../../resources/utils/environmentBaseUrl';


const env = process.env.ENV || 'dev';
const baseUrl = environmentBaseUrl[env].admin_api;


async function Simulate_Electric_Bill(apiContext:any, AccountId: string, Amount:number, Usage:number){
    const response = await apiContext['post'](`${baseUrl}/payments/simulate`,
        {data: {
            accountId: AccountId,
            accountType: 'Electric',
            totalAmountDue: Amount,
            totalUsage: Usage
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging

    expect(response.status()).toBe(200);
}


async function Simulate_Gas_Bill(apiContext:any, AccountId: string, Amount:number, Usage:number){
    const response = await apiContext['post'](`${baseUrl}/payments/simulate`,
        {data: {
            accountId: AccountId,
            accountType: 'Gas',
            totalAmountDue: Amount,
            totalUsage: Usage
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging

    expect(response.status()).toBe(200);
}


async function Approve_Bill(apiContext:any, BillId: string){
    const response = await apiContext['post'](`${baseUrl}/payments/approve`,
        {data: {
            billId: BillId,
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging

    expect(response.status()).toBe(200);
}

//Auto Sweep Payment
    
  


export const AdminApi = {
    Simulate_Electric_Bill,
    Simulate_Gas_Bill,
    Approve_Bill
};