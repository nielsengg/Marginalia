/*
 === Marginalia ===

 * Requires: C compiler (like GCC/Clang), cURL and cJSON libraries, cacert.pem file, internet connection.
 * Ensures: Cataloging and management of read books (notes, ratings, reviews), persistent local data storage, and external book searches via API through a simple terminal interface.
 
 * Nielsen, G.G.
 * 2025 - CAP
 */

#include <stdio.h> // Standard input and output
#include <string.h> // String manipulation functions
#include <ctype.h> // Character classification and transformation
#include <stdbool.h> // Boolean type support
#include <curl/curl.h> // For making HTTP requests and interacting with URLs

#include "marginalia.h"

int cursor; // Global Cursor to change the screens
int menuShow = 0; // Screen to show

int main(void){
    bool exit = false;
    cleanTerminal();
    // Definite the Option1s of the Menus
    stru_screen menuScreen = {{"Log +", "Profile", "Exit"}, 3};
    stru_screen logScreen = {{""}, 0};
    stru_screen profileScreen = {{"Favorite books", "Recent activity", "Return menu"}, 3};

    // Choose what to show in the terminal
    do {
        if (menuShow == 0){
            showMenu(&cursor, &menuShow, menuScreen);
        }else if (menuShow == 1){
            showLog(&cursor, &menuShow);
        }else if (menuShow == 2){
            showProfile(&cursor, &menuShow, profileScreen);
        }else if (menuShow == 3)
            exit = true;
        else{ // When the user write an unexpected number
            showMessageOnTerminal("Invalid option chosen");
            cleanTerminal();
            cursor = 0;
            menuShow = 0;
        }
    } while (!exit);

    return 0;
}