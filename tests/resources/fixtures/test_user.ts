import { faker } from '@faker-js/faker';


interface TestUser {
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
    Email: string;
    UnitNumber: string;
    Today: string;
    Tomorrow: string;
    FourDaysFromNow: string;
    TwoDaysAgo: string;
    BirthDate: string;
    SSN: string;
    CardExpiry: string;
    CVC: string;
    Country: string;
    Zip: string;
    ElectricAmount: number;
    ElectricAmountActual: string;
    ElectricServiceFee: number;
    ElectricServiceFeeActual: string;
    ElectricAmountTotal: number;
    ElectricAmountActualTotal: string;
    ElectricUsage: number;
    GasAmount: number;
    GasAmountActual: string;
    GasServiceFee: number;
    GasServiceFeeActual: string;
    GasAmountTotal: number;
    GasAmountActualTotal: string;
    GasUsage: number;
}


export async function generateTestUserData(serviceFeePercentage?: number): Promise<TestUser> {
    const firstname = faker.person.firstName();
    const lastname = faker.person.lastName();
    const uniqueKey = faker.string.alphanumeric(10);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fourDaysFromNow = new Date(today);
    fourDaysFromNow.setDate(today.getDate() + 4);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const futureDate = faker.date.future({ years: 5 }).toISOString().split('T')[0]; // "YYYY-MM-DD"
    const yearMonth = futureDate.slice(0, 7).split('-'); // ["YYYY", "MM"]
    const cardExpiry = `${yearMonth[1]}/${yearMonth[0].slice(2)}`; // "MM/YY"

    const AmountElectric = faker.finance.amount({ min: 100, max: 9999 });
    const UsageElectric = faker.finance.amount({ min: 10, max: 999 });
    const AmountGas = faker.finance.amount({ min: 100, max: 9999 });
    const UsageGas = faker.finance.amount({ min: 1, max: 99 });

    const feePercentage = serviceFeePercentage || 0.03;

    const electricAmountActual = (parseInt(AmountElectric) / 100).toFixed(2);
    //const electricServiceFee = (Math.ceil(((parseInt(AmountElectric) * (feePercentage))+(0.3*100))));
    const electricServiceFee = (Math.round(((parseInt(AmountElectric) * (feePercentage))+(0.3*100))));
    const electricServiceFeeActual = (electricServiceFee / 100).toFixed(2);
    const electricAmountTotal = parseInt(AmountElectric) + electricServiceFee;
    const electricAmountActualTotal = ((parseInt(AmountElectric) + electricServiceFee)/100).toFixed(2);

    const gasAmountActual = (parseInt(AmountGas) / 100).toFixed(2);
    //const gasServiceFee = (Math.ceil(((parseInt(AmountGas) * (feePercentage))+(0.3*100))));
    const gasServiceFee = (Math.round(((parseInt(AmountGas) * (feePercentage))+(0.3*100))));
    const gasServiceFeeActual = (gasServiceFee / 100).toFixed(2);
    const gasAmountTotal = parseInt(AmountGas) + gasServiceFee;
    const gasAmountActualTotal = ((parseInt(AmountGas) + gasServiceFee)/100).toFixed(2);

    const userData: TestUser = {
      FirstName: firstname,
      LastName: lastname,
      PhoneNumber: "111-111-1111",
      Email: faker.internet.email({ firstName: 'PGTest+' + firstname, lastName: lastname + uniqueKey, provider: 'joinpublicgrid.com'}),
      UnitNumber: faker.location.buildingNumber() + faker.string.alpha({ length: 1 }),
      Today: today.getDate().toString(),
      Tomorrow: tomorrow.getDate().toString(),
      FourDaysFromNow: fourDaysFromNow.getDate().toString(),
      TwoDaysAgo: twoDaysAgo.getDate().toString(),
      BirthDate: faker.date.birthdate({ min: 18, max: 99, mode: 'age' }).toISOString().split('T')[0],
      SSN: faker.string.numeric({ length: 9 }),
      CardExpiry: cardExpiry,
      CVC: faker.finance.creditCardCVV(),
      Country: faker.location.countryCode(),
      Zip: faker.location.zipCode(),
      ElectricAmount: parseInt(AmountElectric),
      ElectricAmountActual: electricAmountActual,
      ElectricServiceFee: electricServiceFee,
      ElectricServiceFeeActual: electricServiceFeeActual,
      ElectricAmountTotal: electricAmountTotal,
      ElectricAmountActualTotal: electricAmountActualTotal,
      ElectricUsage: parseInt(UsageElectric),
      
      GasAmount: parseInt(AmountGas),
      GasAmountActual: gasAmountActual,
      GasServiceFee: gasServiceFee,
      GasServiceFeeActual: gasServiceFeeActual,
      GasAmountTotal: gasAmountTotal,
      GasAmountActualTotal: gasAmountActualTotal,
      GasUsage: parseInt(UsageGas),
    };
  
    return userData;
  }

  

