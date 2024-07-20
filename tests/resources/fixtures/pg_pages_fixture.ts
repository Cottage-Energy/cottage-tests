import { test as base } from '@playwright/test';
import { MoveInPage }  from '../page_objects/move_in_page';
import { HomePage } from '../page_objects/homepage';


type pages = {
    moveInpage: MoveInPage
    homepage: HomePage
}


const testPages = base.extend<pages>({
    
    homepage: async ({page},use) => {
        await use(new HomePage(page));
    },

    moveInpage: async ({page},use) => {
        await use(new MoveInPage(page));
    }

})

export const test = testPages;
export const expect = testPages.expect;