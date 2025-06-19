#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "marginalia.h"

int cursor;
int menuShow = 0; 

int main(void){
    // Definite the Options of the initial MENU
    struct stru_option menuOptions[3];
    menuOptions[0] = (struct stru_option){"Log +", 1}; // Go to the local to addbook
    menuOptions[1] = (struct stru_option){"Profile", 2}; // Go to the PROFILE
    menuOptions[2] = (struct stru_option){"Exit", 3};// Exit the program

    //Definite the Option of the PROFILE
    struct stru_option profileOptions[3];
    profileOptions[0] = (struct stru_option){"Favorite books", 1}; // Show User's Favorite Books
    profileOptions[1] = (struct stru_option){"Recent activities", 2}; // Show User's recent activities
    profileOptions[2] = (struct stru_option){"Return to Menu", 3}; // Return to the MENU


    // Choose what to show in the terminal
    while (menuShow != 3){
        if (menuShow == 0){
            writePage("MARGINALIA", (sizeof(menuOptions) / sizeof(menuOptions[0])), 1, menuOptions, 0);
            getInput(1, cursor, &menuShow);
            printf("Cursor: %d\nMenu: %d\n", cursor, menuShow);
        }else if (menuShow == 1){
            writePage("I read...", 1, 0, 0, "Search for a book");
            getBookName();
        }else if (menuShow == 2){
            writePage("USERNAME", (sizeof(profileOptions) / sizeof(profileOptions[0])), 1, profileOptions, 0);
            getInput(1, cursor, &menuShow);
        }else{ // When the user write an unexpected number
            getInput(0, cursor, &menuShow);
          
        }
    }

    return 0;
}