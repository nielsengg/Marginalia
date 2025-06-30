#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "marginalia.h"

static char input[80];

// Print white lines to "clean the terminal"
void cleanTerminal(){
    printf("\033[2J\033[H");
}

// Show a message and catch the local where the user want to go
void getInput(char *inputMessage, int validation, int *cursor, int *menuShow){
    printf("%s: ", inputMessage);
    fgets(input, sizeof input, stdin);

    sscanf(input, "%ld", cursor);
    printf("Cursor: %d\n*Cursor = %d", cursor, *cursor);

    
    if ((*cursor >= 0) && (*cursor < 3)){
        if (validation == 1) // Verification if the menuShow can be changed
            *menuShow = *cursor; // Change the menu that is showing to the user
    }

    *cursor = -1;// Stop the loop

    cleanTerminal(); // "clean" the terminal
}

//Transform a text to lowcase text
int lowText (char string[]){
    for (int i = 0; string[i]; i++) {
            string[i] = tolower(string[i]);
        }
}

// Transform User's input in a url to the API
int urlToSearch (char string[]){
    for (int i = 0; string[i]; i++) {
        if (string[i] == ' ')
            string[i] = '+';
    }

    // Put the input in the link
    char temp[80] = "https://openlibrary.org/search.json?q=";
    strcat(temp, string);

    // Return the link to the initial string
    strcpy(string, temp);

    printf("url string: %s\n", string);
}


// Write a page with options
void writePage(const char *menuName, int optionsNumber, stru_screen screen){ 
    printf("=== %s ===\n", menuName);
    for (int i = 0; i < screen.amount; i++)
        printf("%d. %s\n", i + 1, screen.options[i]);
}

void searchBoook(){
    // Request book name;
    char input[80];
    printf("Search for book: ");
    fgets(input, sizeof input, stdin);

    // Transform input in lowcase
    char lowInput[80]; 
    strcpy(lowInput, input);
    lowText(lowInput);
    
    // Translate input to URL language
    urlToSearch(lowInput);
    

    printf("Input: %s\nlowInput wit +: %s", input, lowInput);
    // Mix URL with input

    // request url to http

    // show list of serach
    


}

// SHOW SCREEENS
void showMenu(int *cursor, int *menuShow, stru_screen screen){
    writePage("MARGINALIA", screen.amount, screen);
    getInput("Choose an option", 1, cursor, menuShow);
}

void showLog(int *cursor, int *menuShow, stru_screen screen){
    writePage("I read...", screen.amount, screen);
    searchBoook();
}

void showProfile(int *cursor, int *menuShow, stru_screen screen){
    writePage("USERNAME", screen.amount, screen);
    getInput("Choose an option", 1, cursor, menuShow);
}
