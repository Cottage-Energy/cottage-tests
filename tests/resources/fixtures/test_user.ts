import { faker } from '@faker-js/faker';


interface TestUser {
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
    ElectricAmount: number;
    ElectricUsage: number;
    GasAmount: number;
    GasUsage: number;
}


export async function generateTestUserData(): Promise<TestUser> {
    const firstname = faker.person.firstName();
    const lastname = faker.person.lastName();
    
    const today = new Date();
    const tomorrow = today.getDate() + 1;

    const futureDate = faker.date.future({ years: 5 }).toISOString().split('T')[0]; // "YYYY-MM-DD"
    const yearMonth = futureDate.slice(0, 7).split('-'); // ["YYYY", "MM"]
    const cardExpiry = `${yearMonth[1]}/${yearMonth[0].slice(2)}`; // "MM/YY"

    const AmountElectric = faker.finance.amount({ min: 1000, max: 50000 });
    const UsageElectric = faker.finance.amount({ min: 10, max: 500 });
    const AmountGas = faker.finance.amount({ min: 5, max: 9999 });
    const UsageGas = faker.finance.amount({ min: 1, max: 99 });
  
    const userData: TestUser = {
      FirstName: firstname,
      LastName: lastname,
      PhoneNumber: faker.phone.number(),
      Email: faker.internet.email({ firstName: 'pgtest+' + firstname, lastName: lastname, provider: 'joinpublicgrid.com'}),
      UnitNumber: faker.location.buildingNumber(),
      Today: today.getDate().toString(),
      Tomorrow: tomorrow.toString(),
      BirthDate: faker.date.birthdate({ min: 18, max: 99, mode: 'age' }).toISOString().split('T')[0],
      SSN: faker.string.numeric({ length: 9 }),
      CardExpiry: cardExpiry,
      CVC: faker.finance.creditCardCVV(),
      Country: faker.location.countryCode(),
      Zip: faker.location.zipCode(),
      ElectricAmount: parseInt(AmountElectric),
      ElectricUsage: parseInt(UsageElectric),
      GasAmount: parseInt(AmountGas),
      GasUsage: parseInt(UsageGas),
    };
  
    return userData;
  }

  

