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


async function CON_EDISON_Sign_Up(apiContext:any, AccountId: string){
    const response = await apiContext['post'](`${baseUrl}/sign-up/con-edison`,
        {data: {
            electricAccountID: AccountId
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging
}


async function CON_EDISON_Verify_Account(apiContext:any, AccountId: string){
    const response = await apiContext['post'](`${baseUrl}/verify-account/con-edison`,
        {data: {
            electricAccountID: AccountId
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging
}


async function CON_EDISON_Start_Service(apiContext:any, AccountId: string){
    const response = await apiContext['post'](`${baseUrl}/start-service/con-edison`,
        {data: {
            electricAccountID: AccountId
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging
}


async function EVERSOURCE_Sign_Up(apiContext:any, AccountId: string){
    const response = await apiContext['post'](`${baseUrl}/sign-up/eversource`,
        {data: {
            electricAccountID: AccountId
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging
}


async function EVERSOURCE_Start_Service(apiContext:any, AccountId: string){
    const response = await apiContext['post'](`${baseUrl}/start-service/everource`,
        {data: {
            electricAccountID: AccountId
        }}
    );

    const responseBody = await response.json();

    console.log(await response.status()); // Log the status for debugging
    console.log(responseBody); // Log the response body for debugging
}
    
  


export const AdminApi = {
    Simulate_Electric_Bill,
    Simulate_Gas_Bill,
    CON_EDISON_Sign_Up,
    CON_EDISON_Verify_Account,
    CON_EDISON_Start_Service,
    EVERSOURCE_Sign_Up,
    EVERSOURCE_Start_Service
};