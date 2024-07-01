import { test as base } from '@playwright/test';
import { MoveInPage }  from '../../resources/page_objects/move_in_page';


type pages = {
    moveInpage: MoveInPage
}


const testPages = base.extend<pages>({

    moveInpage: async ({page},use) => {
        await use(new MoveInPage(page));
    }

})

export const test = testPages;
export const expect = testPages.expect;