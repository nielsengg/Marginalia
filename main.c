#include <stdio.h>
#include <string.h>
#include <ctype.h>

#include <curl/curl.h>

#include "marginalia.h"

int cursor; // Global Cursor to change the screens
int menuShow = 0; // Screen to show

int main(void){
    cleanTerminal();
    // Definite the Option1s of the Menus
    stru_screen menuScreen = {{"Log +", "Profile", "Exit"}, 3};
    stru_screen logScreen = {{""}, 0};
    stru_screen profileScreen = {{"Favorite books", "Recent activity", "Return menu"}, 3};

    // Choose what to show in the terminal
    while (menuShow != 3){
        if (menuShow == 0){
            showMenu(&cursor, &menuShow, menuScreen);
        }else if (menuShow == 1){
            showLog(&cursor, &menuShow);
        }else if (menuShow == 2){
            showProfile(&cursor, &menuShow, profileScreen);
        }else{ // When the user write an unexpected number
            // getInput(0, cursor, &menuShow);
          
        }
    }

    return 0;
}