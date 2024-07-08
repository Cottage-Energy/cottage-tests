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
}


export async function generateTestUserData(): Promise<TestUser> {
    const firstname = faker.person.firstName();
    const lastname = faker.person.lastName();
    
    const today = new Date();
    const tomorrow = today.getDate() + 1;

    const futureDate = faker.date.future({ years: 5 }).toISOString().split('T')[0]; // "YYYY-MM-DD"
    const yearMonth = futureDate.slice(0, 7).split('-'); // ["YYYY", "MM"]
    const cardExpiry = `${yearMonth[1]}/${yearMonth[0].slice(2)}`; // "MM/YY"
  
    const userData: TestUser = {
      FirstName: firstname,
      LastName: lastname,
      PhoneNumber: faker.phone.number(),
      Email: faker.internet.email({ firstName: 'pgtest+' + firstname, lastName: lastname, provider: 'autotest.pg'}),
      UnitNumber: faker.location.buildingNumber(),
      Today: today.getDate().toString(),
      Tomorrow: tomorrow.toString(),
      BirthDate: faker.date.birthdate({ min: 18, max: 99, mode: 'age' }).toISOString().split('T')[0],
      SSN: faker.string.numeric({ length: 9 }),
      CardExpiry: cardExpiry,
      CVC: faker.finance.creditCardCVV(),
      Country: faker.location.countryCode(),
      Zip: faker.location.zipCode(),
    };
  
    return userData;
  }

  

