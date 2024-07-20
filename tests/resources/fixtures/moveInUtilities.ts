// Import the functions
import { 
    COMED_New_User_Move_In,
    CON_ED_New_User_Move_In_Payment_Added, 
    EVERSOURCE_New_User_Move_In_Payment_Added, 
    CON_ED_New_User_Move_In_Skip_Payment, 
    EVERSOURCE_New_User_Move_In_Skip_Payment
} from '../../../tests/e2e_tests/move_in/workflows/move_in_new_user.spec';

// Encapsulate them in a module/object
export const MoveInUtilities = {
    COMED_New_User_Move_In,
    CON_ED_New_User_Move_In_Payment_Added, 
    EVERSOURCE_New_User_Move_In_Payment_Added, 
    CON_ED_New_User_Move_In_Skip_Payment, 
    EVERSOURCE_New_User_Move_In_Skip_Payment
};