import { faker } from '@faker-js/faker';

/**
 * Test user data interface with all generated fields
 * Used throughout the test suite for consistent test data
 */
interface TestUser {
    /** User's first name */
    FirstName: string;
    /** User's last name */
    LastName: string;
    /** User's phone number (default: 111-111-1111) */
    PhoneNumber: string;
    /** Generated email with PGTest prefix */
    Email: string;
    /** Generated unit number */
    UnitNumber: string;
    /** Today's date as day number string */
    Today: string;
    /** Tomorrow's date as day number string */
    Tomorrow: string;
    /** Date 4 days from now as day number string */
    FourDaysFromNow: string;
    /** Date 2 days ago as day number string */
    TwoDaysAgo: string;
    /** Birth date in ISO format (YYYY-MM-DD) */
    BirthDate: string;
    /** 9-digit SSN for testing */
    SSN: string;
    /** Card expiry in MM/YY format */
    CardExpiry: string;
    /** Card CVC (3 digits) */
    CVC: string;
    /** Country code */
    Country: string;
    /** ZIP code */
    Zip: string;
    /** Electric bill amount in cents */
    ElectricAmount: number;
    /** Electric bill amount formatted as dollars */
    ElectricAmountActual: string;
    /** Electric service fee in cents */
    ElectricServiceFee: number;
    /** Electric service fee formatted as dollars */
    ElectricServiceFeeActual: string;
    /** Total electric amount with fee in cents */
    ElectricAmountTotal: number;
    /** Total electric amount with fee formatted as dollars */
    ElectricAmountActualTotal: string;
    /** Electric usage in kWh */
    ElectricUsage: number;
    /** Gas bill amount in cents */
    GasAmount: number;
    /** Gas bill amount formatted as dollars */
    GasAmountActual: string;
    /** Gas service fee in cents */
    GasServiceFee: number;
    /** Gas service fee formatted as dollars */
    GasServiceFeeActual: string;
    /** Total gas amount with fee in cents */
    GasAmountTotal: number;
    /** Total gas amount with fee formatted as dollars */
    GasAmountActualTotal: string;
    /** Gas usage in therms */
    GasUsage: number;
    /** Combined electric + gas amount in cents */
    CombinedAmount: number;
    /** Combined amount formatted as dollars */
    CombinedAmountActual: string;
    /** Combined service fee in cents */
    CombinedServiceFee: number;
    /** Combined service fee formatted as dollars */
    CombinedServiceFeeActual: string;
    /** Total combined amount with fee in cents */
    CombinedAmountTotal: number;
    /** Total combined amount with fee formatted as dollars */
    CombinedAmountActualTotal: string;
}

/**
 * Generates comprehensive test user data with randomized values
 * 
 * @param serviceFeePercentage - Optional service fee percentage (default: 0.03 for 3%)
 * @returns Promise resolving to TestUser object with all fields populated
 * 
 * @example
 * const user = await generateTestUserData();
 * console.log(user.Email); // "PGTest+John_SmithABC123@joinpublicgrid.com"
 * 
 * @example
 * // With custom service fee
 * const user = await generateTestUserData(0.05); // 5% fee
 */
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

    // Calculate combined totals
    const combinedAmount = parseInt(AmountElectric) + parseInt(AmountGas);
    const combinedAmountActual = (combinedAmount / 100).toFixed(2);
    const combinedServiceFee = (Math.round(((combinedAmount * (feePercentage))+(0.3*100))));
    const combinedServiceFeeActual = (combinedServiceFee / 100).toFixed(2);
    const combinedAmountTotal = combinedAmount + combinedServiceFee;
    const combinedAmountActualTotal = (combinedAmountTotal / 100).toFixed(2);
    

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

      CombinedAmount: combinedAmount,
      CombinedAmountActual: combinedAmountActual,
      CombinedServiceFee: combinedServiceFee,
      CombinedServiceFeeActual: combinedServiceFeeActual,
      CombinedAmountTotal: combinedAmountTotal,
      CombinedAmountActualTotal: combinedAmountActualTotal,
    };
  
    return userData;
  }

  

