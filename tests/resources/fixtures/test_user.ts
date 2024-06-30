import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';


type TestUser ={
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
    Email: string;
    UnitNumber: string;
    Today: string;
    Tomorrow: string;
    BirthDate: string;
    SSN: string;
    CardExpiry: string;
    CVC: string;
    Country: string;
    Zip: string;
}


const CreateUser = base.extend<TestUser>({
    FirstName: async ({}, use) => {
        await use(faker.person.firstName());
    },
    LastName: async ({}, use) => {
        await use(faker.person.lastName());
    },
    PhoneNumber: async ({}, use) => {
        await use(faker.phone.number());
    },
    Email: async ({}, use) => {
        await use(faker.internet.email());
    },
    UnitNumber: async ({}, use) => {
        await use(faker.location.buildingNumber());
    },
    Today: async ({}, use) => {
        await use(faker.date.recent().toISOString().split('T')[0]);
    },
    Tomorrow: async ({}, use) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await use(tomorrow.toISOString().split('T')[0]);
    },
    BirthDate: async ({}, use) => {
        await use(faker.date.past({ years: 18 }).toISOString().split('T')[0]);
    },
    SSN: async ({}, use) => {
        await use(faker.string.numeric({ length: 9 }));
    },
    CardExpiry: async ({}, use) => {
        await use(faker.date.future().toISOString().split('T')[0].slice(0, 7)); // YYYY-MM
    },
    CVC: async ({}, use) => {
        await use(faker.finance.creditCardCVV());
    },
    Country: async ({}, use) => {
        await use(faker.location.country());
    },
    Zip: async ({}, use) => {
        await use(faker.location.zipCode());
    },
});

export const CreatedTestUser = CreateUser;