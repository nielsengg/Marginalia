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
void getInput(int validation, int cursor, int *menuShow){
    printf("Choose a option: ");
    fgets(input, sizeof input, stdin);

    sscanf(input, "%ld", &cursor);
    if ((cursor >= 0) && (cursor < 3)){
        if (validation == 1) // Verification if the menuShow can be changed
            *menuShow = cursor; // Change the menu that is showing to the user
    }

    cursor = -1;// Stop the loop

    cleanTerminal(); // "clean" the terminal
}

//Transform a text to lowcase text
int lowText (char vector[]){
    for (int i = 0; vector[i]; i++) {
            vector[i] = tolower(vector[i]);
        }
}

// Show a list of search match
int showBookList(const char* dataName, char* inputName, char* line, struct stru_option vector[]){
    int lineNumber = 1;

    if (strstr(dataName, inputName) != NULL){ // Search compare to show
        strcpy(vector[lineNumber].textShow, line);
        vector[lineNumber].position = lineNumber;
        
        printf("%d. %s", vector[lineNumber].position, vector[lineNumber].textShow);
        lineNumber++;
    }
}

// Write a page with options
void writePage(const char *menuName, int optionsNumber, int isVector, struct stru_option vector[], const char *stringOption){ 
    printf("=== %s ===\n", menuName);

    if (isVector == 1){
            for (int i = 0; i < optionsNumber; i++) // i < how many itens in the array
            printf("%d. %s\n", i + 1, vector[i].textShow);
    }else
        printf("%s: ", stringOption);
}

// Search the book's name
int getBookName(){ 
    int maxBookShow = 5; // Max book in a list to show in the search
    char bookSelectedName[160];
    int bookSelectedCursor = 1;
    struct stru_option bookOptions[maxBookShow];

    fgets(input, sizeof input, stdin);
    input[strlen(input)-1] = '\0'; 

    FILE *bookData = fopen("data.txt", "r");
    if(bookData == NULL ){
        perror("Error 404");
        return 1;
    }

    char line[160];
    int lineNumber = 1;
    while(fgets(line, sizeof line, bookData) != NULL){
        char bookInputName[160];
        char bookDataName[160];

        sscanf(input, "%[^\n]", bookInputName); // bookInputName receives all words of the Input's line
        sscanf(line, "%[^\n]", bookDataName); // bookDataName receives all words of the Data's line

        // Transform the input's and data's words to lowcase
        lowText(bookInputName);
        lowText(bookDataName);

        showBookList(bookDataName, bookInputName, line, bookOptions);
    }

    int found = 0;
    // While user no type an expected number of the list
    while (found == 0){ 
        printf("Choose a book: ");
        fgets(input, sizeof *input, stdin);
        input[strlen(input)-1] = '\0'; 

        sscanf(input, "%d", &bookSelectedCursor);

        // Catch the booknName of the selected book
        for (int i = 0; i < maxBookShow; i++){
            if (bookSelectedCursor == bookOptions[i].position){
                strcpy(bookSelectedName, bookOptions[i].textShow);
                found = 1;
                break;
            }
        }

        // If user type an unexpected number
        if (!found){ 
            printf("\n");
            writePage("I read...", 1, 0, 0, "No valid book selected.\nResearch for a book");
            getBookName();
        }
    }

    fclose(bookData);

    return 0;
}

