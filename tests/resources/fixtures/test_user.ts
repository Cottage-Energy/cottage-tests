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
    ElectricAmountActual: string;
    ElectricServiceFee: string;
    ElectricAmountTotal: string;
    ElectricUsage: number;
    GasAmount: number;
    GasAmountActual: string;
    GasServiceFee: string;
    GasAmountTotal: string;
    GasUsage: number;
}


export async function generateTestUserData(serviceFeePercentage?: number): Promise<TestUser> {
    const firstname = faker.person.firstName();
    const lastname = faker.person.lastName();
    
    const today = new Date();
    const tomorrow = today.getDate() + 1;

    const futureDate = faker.date.future({ years: 5 }).toISOString().split('T')[0]; // "YYYY-MM-DD"
    const yearMonth = futureDate.slice(0, 7).split('-'); // ["YYYY", "MM"]
    const cardExpiry = `${yearMonth[1]}/${yearMonth[0].slice(2)}`; // "MM/YY"

    const AmountElectric = faker.finance.amount({ min: 100, max: 9999 });
    const UsageElectric = faker.finance.amount({ min: 10, max: 999 });
    const AmountGas = faker.finance.amount({ min: 100, max: 9999 });
    const UsageGas = faker.finance.amount({ min: 1, max: 99 });

    const feePercentage = serviceFeePercentage || 0.03;

    const electricAmountActual = (parseInt(AmountElectric) / 100).toFixed(2);
    const electricServiceFee = (Math.ceil(((parseInt(AmountElectric) * (feePercentage))+(0.3*100)))/100).toFixed(2);
    const electricAmountTotal = (parseFloat(electricAmountActual) + parseFloat(electricServiceFee)).toFixed(2);
    const gasAmountActual = (parseInt(AmountGas) / 100).toFixed(2);
    const gasServiceFee = (Math.ceil(((parseInt(AmountGas) * (feePercentage))+(0.3*100)))/100).toFixed(2);
    const gasAmountTotal = (parseFloat(gasAmountActual) + parseFloat(gasServiceFee)).toFixed(2);
  
    const userData: TestUser = {
      FirstName: firstname,
      LastName: lastname,
      PhoneNumber: faker.phone.number(),
      Email: faker.internet.email({ firstName: 'PGTest+' + firstname, lastName: lastname, provider: 'joinpublicgrid.com'}),
      UnitNumber: faker.location.buildingNumber() + faker.string.alpha({ length: 1 }),
      Today: today.getDate().toString(),
      Tomorrow: tomorrow.toString(),
      BirthDate: faker.date.birthdate({ min: 18, max: 99, mode: 'age' }).toISOString().split('T')[0],
      SSN: faker.string.numeric({ length: 9 }),
      CardExpiry: cardExpiry,
      CVC: faker.finance.creditCardCVV(),
      Country: faker.location.countryCode(),
      Zip: faker.location.zipCode(),
      ElectricAmount: parseInt(AmountElectric),
      ElectricAmountActual: electricAmountActual,
      ElectricServiceFee: electricServiceFee,
      ElectricAmountTotal: electricAmountTotal,
      ElectricUsage: parseInt(UsageElectric),
      
      GasAmount: parseInt(AmountGas),
      GasAmountActual: gasAmountActual,
      GasServiceFee: gasServiceFee,
      GasAmountTotal: gasAmountTotal,
      GasUsage: parseInt(UsageGas),
    };
  
    return userData;
  }

  

