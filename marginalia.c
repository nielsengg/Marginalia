#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>
#include <stdbool.h>
#include <curl/curl.h>
#include <unistd.h>

#include "cJSON.h"
#include "marginalia.h"

static char input[80];

// Functions prototype
void logBook(int *cursor, int *menuShow);

// Print white lines to "clean the terminal"
void cleanTerminal(){
    printf("\033[2J\033[H");
}

void invalidOption(){
    printf("!!! Invalid chosen option !!!\n");
    fflush(stdout);
    sleep(1);
    cleanTerminal();
}
   
// Show a message and catch the local where the user want to go
void menuInput(char *inputMessage, int validation, int *cursor, int *menuShow){
    printf("\n");
    printf("%s: ", inputMessage);
    fgets(input, sizeof input, stdin);
    sscanf(input, "%ld", cursor);

    // printf("Cursor: %d\n*Cursor = %d", cursor, *cursor);

    if ((*cursor > 0) && (*cursor < 3)){
        if (validation == 1) // Verification if the menuShow can be changed
            *menuShow = *cursor; // Change the menu that is showing to the user
    }

    *cursor = 0;// Stop the loop

    cleanTerminal(); // "clean" the terminal
}

void profileInput(char *inputMessage, int validation, int *cursor, int *menuShow){
    printf("\n");
    printf("Choose a option: ");

    int select;
    fgets(input, sizeof input, stdin);
    sscanf(input, "%ld", &select);

    cleanTerminal();
    switch (select){
    case 1:
        /* code */
        break;
    case 2:
        showDataBook(menuShow);
        break;
    case 3:
        *menuShow = 0; // Return Menu
        break;
    default:
        invalidOption();
    }

    *cursor = 0;// Stop the loop

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
    char temp[160] = "https://openlibrary.org/search.json?title=";
    strcat(temp, string);

    // Return the link to the initial string
    strcpy(string, temp);

    string[strcspn(string, "\n")] = '\0';
}


// Write a page with options
void writePage(const char *menuTitle, int optionsNumber, stru_screen screen){ 
    printf("=== %s ===\n", menuTitle);
    for (int i = 0; i < screen.amount; i++)
        printf("%d. %s\n", i + 1, screen.options[i]);
}

// Manage memory to getBook()
static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp){
  size_t realsize = size * nmemb;
  struct MemoryStruct *mem = (struct MemoryStruct *)userp;
 
  char *ptr = realloc(mem->memory, mem->size + realsize + 1);
  if(!ptr) {
    /* out of memory! */
    printf("not enough memory (realloc returned NULL)\n");
    return 0;
  }
 
  mem->memory = ptr;
  memcpy(&(mem->memory[mem->size]), contents, realsize);
  mem->size += realsize;
  mem->memory[mem->size] = 0;
 
  return realsize;
}

// Request book in the API.
int getBook(const char *url, bookInfo booksToShow[], int amountToShow) {
    CURL *curl_handle;
    CURLcode res;
    
    struct MemoryStruct jsonBooks; // Keep the API's answer
    jsonBooks.memory = malloc(1); 
    jsonBooks.size = 0;

    curl_global_init(CURL_GLOBAL_ALL);
    curl_handle = curl_easy_init();

    // Configure do CURL
    curl_easy_setopt(curl_handle, CURLOPT_URL, url); // Which URL acess
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, WriteMemoryCallback); // Define how to it will be write
    curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, (void *)&jsonBooks); // Where to write the request

    //  Define the SSL certificate
    curl_easy_setopt(curl_handle, CURLOPT_CAINFO, "cacert.pem");
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYHOST, 2L);

    // Request the HTTP
    res = curl_easy_perform(curl_handle); // Request the HTTP
    if (res != CURLE_OK) { // Error verification
        fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        free(jsonBooks.memory);
        curl_easy_cleanup(curl_handle);
        curl_global_cleanup();
        return 1;
    }

    // Parse the JSON (Extract)
    cJSON *root = cJSON_Parse(jsonBooks.memory); // string JSON -> cJSON struct
    if (!root) {
        fprintf(stderr, "Failed to parse JSON. Data received: %.*s\n", (int)jsonBooks.size, jsonBooks.memory);
        free(jsonBooks.memory);
        curl_easy_cleanup(curl_handle);
        curl_global_cleanup();
        return 1;
    }

    // Get the HTTP Info
    cJSON *docs = cJSON_GetObjectItemCaseSensitive(root, "docs");
    if (!docs || !cJSON_IsArray(docs)) {
        fprintf(stderr, "No 'docs' array found in JSON\n");
        cJSON_Delete(root);
        free(jsonBooks.memory);
        curl_easy_cleanup(curl_handle);
        curl_global_cleanup();
        return 1;
    }

    // Extract specifics Infos
    int num_books = cJSON_GetArraySize(docs);
    if (num_books > amountToShow) {
        num_books = amountToShow;
    }

    for (int i = 0; i < num_books; i++) {
        cJSON *book = cJSON_GetArrayItem(docs, i);
        cJSON *title = cJSON_GetObjectItemCaseSensitive(book, "title");
        cJSON *author = cJSON_GetObjectItemCaseSensitive(book, "author_name");
        cJSON *year = cJSON_GetObjectItemCaseSensitive(book, "first_publish_year");

        if (title && cJSON_IsString(title)) {
            strncpy(booksToShow[i].title, title->valuestring, sizeof(booksToShow[i].title) - 1);
            booksToShow[i].title[sizeof(booksToShow[i].title) - 1] = '\0';
        }
    
        if (author && cJSON_IsArray(author)) {
            cJSON *first_author = cJSON_GetArrayItem(author, 0);
            if (first_author && cJSON_IsString(first_author)) {
                strncpy(booksToShow[i].author, first_author->valuestring, sizeof(booksToShow[i].author) - 1);
                booksToShow[i].author[sizeof(booksToShow[i].author) - 1] = '\0';
            }
            }
        
        if (year && cJSON_IsNumber(year)) {
            snprintf(booksToShow[i].year, sizeof(booksToShow[i].year), "%d", year->valueint);
        }
    }
        

    cJSON_Delete(root);
    free(jsonBooks.memory);
    curl_easy_cleanup(curl_handle);
    curl_global_cleanup();

    return 0;
}

// Show animate message "Searching..."
void searchingMessage(bool *searching){
    const char *base = "Searching";
    char message[32];
    int dots = 0;

    cleanTerminal();
    for (int i = 0; i < 4; i++) {
        snprintf(message, sizeof(message), "%s%.*s", base, dots, "...");
        printf("=== %s ===\r", message);

        // Wait a second to chnage the string
        fflush(stdout);
        sleep(1); 

        dots++;
    }
    printf("\n");
}


// Call functions to the Book's Search in LOG +
void searchBook(int *validation, bookInfo bookList[], int amountList, int *cursor, int *menuShow){
    // Request Book's title;
    char input[80];
    printf("> Search for a book: ");
    fgets(input, sizeof input, stdin);

    int select = 0;
    sscanf(input, "%d", &select);
    cleanTerminal();

    if (select == -1){
        *menuShow = 0; // Back to MENU
    }else{      
        bool searching = true;
        
        // Transform input in lowcase
        char lowInput[160]; 
        strcpy(lowInput, input);
        lowText(lowInput);
        
        // Transform input to URL
        urlToSearch(lowInput);

        // Show searching message once
        searchingMessage(&searching);

        // Request URL
        *validation = getBook(lowInput, bookList, amountList);

        cleanTerminal();

        // Show list of search
        printf("=== I read... ===\n");
        for (int i = 0; i < amountList; i++){
            printf("%d. %s (%s), %s\n", i+1, bookList[i].title, bookList[i].year, bookList[i].author);
        }
        printf("6. Search for another book\n");
        printf("7. Return Menu\n\n");
    }
    
}

void showDataBook(int *menuShow){
    char input[5];
    int select = -1;

    int SMIndice = 6; // Show More default option indice
    int RMIndice = 7; // Return Menu default option indice

    FILE *dataArchive = fopen("data.dat", "r");
    if (dataArchive == NULL)
        perror("Failed to load the data\n");

    do{
        cleanTerminal();
        printf("=== Recent Activity ===\n");

        // Show saved books
        bookInfo bookShow;
        while (fread(&bookShow, sizeof bookShow, 1, dataArchive) > 0) {
            // printf("name: %s\n year: %s", bookShow.title, bookShow.year);
            printf("%d. %s (%s), %s\n", bookShow.id, bookShow.title, bookShow.year, bookShow.author);
        }

        // Decide where to put the control options 
        if (amountBooksSaved() < 6){ // If the amount of saved books suprases the number to show
            SMIndice = amountBooksSaved() + 1;
            RMIndice = amountBooksSaved() + 2;
        }
        
        printf("%d. Show more\n", SMIndice);
        printf("%d. Return Menu\n\n", RMIndice);

        // User input
        printf("> Choose an options: ");
        fgets(input, sizeof input, stdin);
        sscanf(input, "%d", &select);
        
        if (select == SMIndice)
            printf("oi");
        else if (select == RMIndice){
            *menuShow = 2;
        } else{
            cleanTerminal();
            invalidOption();
            rewind(dataArchive);
        }

    } while (select != RMIndice);

    fclose(dataArchive);
}

void saveBook(bookInfo *bookLog){
    FILE *dataArchive = fopen("data.dat", "ab");
    if (dataArchive == NULL) {
        perror("Error to open the data");
    }

    fwrite(bookLog, sizeof *bookLog, 1, dataArchive);

    fclose(dataArchive);
}

int amountBooksSaved(){
    FILE *dataArchive = fopen("data.dat", "rb");
    if (dataArchive == NULL) {
        perror("Error to open the data");
    }

    fseek(dataArchive, 0, SEEK_END);
    int size = ftell(dataArchive);

    fclose(dataArchive);

    bookInfo bookStruct;

    return (size / sizeof bookStruct);
}

void chooseSearchedBook(int *validation, bookInfo bookList[], int amountList, int *cursor, int *menuShow){
    if (*menuShow == 1){
        char input[5];
        printf("> Select a book: ");
        fgets(input, sizeof input, stdin);

        cleanTerminal();

        int select;
        bool choseList;
        sscanf(input, "%d", &select);

        //Verify if the user chose a book instead to research or return menu
        if (select > 0 && select < 6)
            choseList = true;


        if (choseList){
            printf("=== %s (%s) ===\n", bookList[select - 1].title, bookList[select - 1].year);
            printf("Do you want to Log this book? (y/n): ");
            fgets(input, sizeof input, stdin);

            bookInfo choseBook;
            choseBook = bookList[select - 1];

            choseBook.id = amountBooksSaved() + 1;

            if (strcmp(input, "y\n") == 0){
                saveBook(&choseBook);
            }
            else if (strcmp(input, "n\n") == 0){
                cleanTerminal();
                showLog(cursor, menuShow);
            }
        }else{
            cleanTerminal();
            switch (select){
                case 6: // Research option
                    printf("=== I read... ===\n");
                    searchBook(validation, bookList, amountList, cursor, menuShow);
                    break;

                case 7: // Return menu
                    *menuShow = 0;
                    break;
                default:
                    invalidOption();
            }
        }
    }
}

void logBook(int *cursor, int *menuShow){
    if (*menuShow == 1){
        int amountToShow = 5;
        bookInfo booksTitlesToShow[amountToShow];

        // Verify if the search was correct;
        int searchOk = 0; // 0 -> OK \\ 1 -> Wrong 
        searchBook(&searchOk, booksTitlesToShow, amountToShow, cursor, menuShow);

        if (searchOk == 0)
            chooseSearchedBook(&searchOk, booksTitlesToShow, amountToShow, cursor, menuShow);
    }
}

// SHOW SCREEENS
void showMenu(int *cursor, int *menuShow, stru_screen screen){
    writePage("MARGINALIA", screen.amount, screen);
    menuInput("> Choose an option", 1, cursor, menuShow);
}

void showLog(int *cursor, int *menuShow){
    if (*menuShow == 1){
        printf("=== I read... ===\n");
        logBook(cursor, menuShow); 
    }
}

void showProfile(int *cursor, int *menuShow, stru_screen screen){
    if (*menuShow == 2){
        writePage("USERNAME", screen.amount, screen);
        profileInput("> Choose an option", 1, cursor, menuShow);
    }
}
