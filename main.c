#include <stdio.h>

char input[10];
int cursor;
int menuShow = 0; 

struct stru_option{
    char textShow[80];
};

// Show a message and catch the local where the user want to go
void getInput(){
    printf("Choose a option: ");
    fgets(input, sizeof input, stdin);

    sscanf(input, "%ld", &cursor);
    if ((cursor >= 0) && (cursor < 3))
        menuShow = cursor; // Change the menu that is showing to the user

    printf("\033[2J\033[H"); // "clean" the terminal
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

int main(void){
    // Definite the Options of the initial MENU
    struct stru_option menuOptions[3];
    menuOptions[0] = (struct stru_option){"Log +"}; // Go to the local to addbook
    menuOptions[1] = (struct stru_option){"Profile"}; // Go to the PROFILE
    menuOptions[2] = (struct stru_option){"Exit"}; // Exit the program

    //Definite the Option of the PROFILE
    struct stru_option profileOptions[3];
    profileOptions[0] = (struct stru_option){"Favorite books"}; // Show User's Favorite Books
    profileOptions[1] = (struct stru_option){"Recent activities"}; // Show User's recent activities
    profileOptions[2] = (struct stru_option){"Return to Menu"}; // Return to the MENU


    // Choose what to show in the terminal
    while (cursor != 3){
        if (menuShow == 0){
            writePage("MARGINALIA", (sizeof(menuOptions) / sizeof(menuOptions[0])), 1, menuOptions, 0);
            getInput();
        }else if (menuShow == 1){
            writePage("I read...", 1, 0, 0, "The Book's names is");
            getInput();
        }else if (menuShow == 2){
            writePage("USERNAME", (sizeof(profileOptions) / sizeof(profileOptions[0])), 1, menuOptions, 0);
            getInput();
        }else{
            printf("!!! Invalid option !!!");
          
        }
    }

    return 0;
}