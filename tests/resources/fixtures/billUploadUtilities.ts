import { faker } from '@faker-js/faker';
import path from 'path';
import { Page } from '@playwright/test';

export class BillUploadTestUtilities {
    
    static async generateBillUploadTestData(utility: string = 'Con Edison') {
        const uniqueKey = faker.string.alphanumeric(10);
        const testEmail = `pgtest+billupload+auto+${utility.toLowerCase().replace(/[^a-z0-9]/g, '')}+${uniqueKey}@joinpublicgrid.com`;
        const zipCode = this.getZipCodeForUtility(utility);
        const imgPath = path.join(__dirname, '../data', 'PGLogo002.jpg');
        
        return {
            uniqueKey,
            testEmail,
            zipCode,
            imgPath,
            utility
        };
    }

    static getZipCodeForUtility(utility: string): string {
        const utilityZipMap: { [key: string]: string } = {
            'Con Edison': '12249',
            'ConEd': '12249',
            'CON-EDISON': '12249',
            'Eversource': '02101',
            'EVERSOURCE': '02101',
            'ComEd': '60601',
            'COMED': '60601'
        };
        
        return utilityZipMap[utility] || '12249';
    }

    static async completeBillUploadFlow(
        page: Page, 
        zipCode?: string, 
        utility: string = 'Con Edison',
        fileType: string = 'jpg'
    ) {
        const testData = await this.generateBillUploadTestData(utility);
        
        // Use provided zipCode or get from utility mapping
        const actualZipCode = zipCode || testData.zipCode;
        
        // Select file based on type
        const fileName = fileType === 'pdf' ? 'PGsample.pdf' : 'PGLogo002.jpg';
        const filePath = path.join(__dirname, '../data', fileName);
        
        // Import BillUploadPage dynamically to avoid circular imports
        const { BillUploadPage } = await import('../page_objects/bill_upload_page');
        const billUploadPage = new BillUploadPage(page);
        
        await billUploadPage.completeBillUploadFlow(
            actualZipCode,
            filePath,
            testData.testEmail,
            utility
        );
        
        return {
            testEmail: testData.testEmail,
            uniqueKey: testData.uniqueKey,
            zipCode: actualZipCode,
            utility: utility,
            fileType: fileType
        };
    }

    static async completeBillUploadWithCustomEmail(
        page: Page,
        customEmail: string,
        zipCode: string = '12249',
        utility: string = 'Con Edison',
        fileType: string = 'jpg'
    ) {
        const fileName = fileType === 'pdf' ? 'PGsample.pdf' : 'PGLogo002.jpg';
        const filePath = path.join(__dirname, '../data', fileName);
        
        const { BillUploadPage } = await import('../page_objects/bill_upload_page');
        const billUploadPage = new BillUploadPage(page);
        
        await billUploadPage.completeBillUploadFlow(
            zipCode,
            filePath,
            customEmail,
            utility
        );
        
        return {
            testEmail: customEmail,
            zipCode: zipCode,
            utility: utility,
            fileType: fileType
        };
    }
}

export default BillUploadTestUtilities;
