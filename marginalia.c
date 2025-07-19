#include <stdio.h> // Standard input and output
#include <string.h> // String manipulation functions
#include <ctype.h> // Character classification and transformation
#include <stdlib.h> // Memory allocation, conversions, and general utilities
#include <stdbool.h> // Boolean type support
#include <curl/curl.h> // For making HTTP requests and interacting with URLs
#include <unistd.h> // Sleep feature   
#include <time.h> // Functions for working with date and time
#include "cJSON.h" // Parsing and creating JSON data

#include "marginalia.h" 

static char input[80]; // Global input

// Functions prototype
void logBook(int *cursor, int *menuShow);

// Print white lines to "clean the terminal"
void cleanTerminal(){
    printf("\033[2J\033[H");
}

// Show Message on Terminal
void showMessageOnTerminal(char *message){
    cleanTerminal();
    printf("=== %s ===\n", message);
    fflush(stdout);
    sleep(1);
    cleanTerminal();
}
   
// Calcule how much books have in the data archive
int amountBooksFile(char *fileName){
    FILE *dataArchive = fopen(fileName, "rb");
    if (dataArchive == NULL) {
        perror("Error to open the data");
    }

    fseek(dataArchive, 0, SEEK_END);
    int size = ftell(dataArchive);

    fclose(dataArchive);

    infoBook bookStruct;

    return (size / sizeof bookStruct);
}

// Show a message and catch the local where the user want to go
void menuInput(char *inputMessage, int *cursor, int *menuShow){
    printf("\n");
    printf("%s: ", inputMessage);
    fgets(input, sizeof input, stdin);
    sscanf(input, "%ld", cursor);

    *menuShow = *cursor; // Change the menu that is showing to the user

    cleanTerminal(); // "clean" the terminal
}

// Show a list of the favorite books
void showFavoriteBooks(int *profileOption){
    if ((amountBooksFile("favorite.dat") == 0)){
        printf("!!! There is no Favorite Book !!!\n");
        fflush(stdout);
        sleep(1);
        cleanTerminal();

        *profileOption = 0; // Return Menu
    }else{
        do{
            FILE *favoriteArchive = fopen("favorite.dat", "r");
            if (favoriteArchive == NULL)
                perror("Failed to open the data\n");
            
            infoBook favBook;
            while (fread(&favBook, sizeof favBook, 1, favoriteArchive) > 0){
                printf("> %s (%s), %s | Read on %d-%d-%d\n", favBook.title, favBook.year, favBook.author, favBook.regYear, favBook.regMon, favBook.regDay);
            }

            printf("\n> Return Profile (p): ");
            fgets(input, sizeof input, stdin);

            switch (input[0]){
                case 'p':
                    *profileOption = 0;
                    break;
                
                default:
                    showMessageOnTerminal("Invalid option chosen");
            }

            fclose(favoriteArchive);
        } while (*profileOption == 1);
    }
};

// Profile Navigation
void profileInput(char *inputMessage, int validation, int *cursor, int *menuShow){
    printf("\n");
    printf("%s: ", inputMessage);

    int profileOption = -1;
    fgets(input, sizeof input, stdin);
    sscanf(input, "%ld", &profileOption);

    cleanTerminal();
    switch (profileOption){
        case 0:
            profileInput(inputMessage, validation, cursor, menuShow);
            break;
        case 1:
            showFavoriteBooks(&profileOption);
            break;
        case 2:
            showRecentActivity(&profileOption);
            break;
        case 3:
            *menuShow = 0; // Return Menu
            break;
        default:
            showMessageOnTerminal("Invalid option chosen");
    }

    *cursor = 0;// Stop the loop

    cleanTerminal(); // "clean" the terminal
}

// Transform a text to lowcase text
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
        printf("not enough memory (realloc returned NULL)\n");
        return 0;
    }
    
    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;
    
    return realsize;
}

// Request book in the API
int getBook(const char *url, infoBook booksToShow[], int amountToShow) {
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
void searchBook(int *validation, infoBook bookList[], int amountList, int *cursor, int *menuShow){
    // Request Book's title;
    char input[80];
    printf("What is the title of the book you read?\nWrite 'b' to cancel search\n\n");
    printf("> Search for a book: ");
    fgets(input, sizeof input, stdin);

    cleanTerminal();

    if (strcmp(input, "b\n") == 0){
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

// Verify if the book is already in the favorite archive
bool bookAlreadyFavorited(infoBook *addBook){
    bool favorited = false;

    FILE *favoriteArchive = fopen("favorite.dat", "a");
    if (favoriteArchive == NULL)
        perror("Failed to open the data\n");
    
    infoBook favBook;
     while (fread(&favBook, sizeof favBook, 1, favoriteArchive) > 0){
        if (favBook.author == addBook->author || favBook.title == addBook->title)
            favorited = true;
     }

    fclose(favoriteArchive);

    return favorited;
}

// Show read books
void showRecentActivity(int *profileOption){
    char input[5];
    int select = -1;

    bool editMode = false;
    int editionOption = 0;

    int editSavedBooksIndice; // Edit option indice
    int cancelEditingModeIndice; // Cancel Edition option indice
    int showMoreSavedBooksIndice; // Show More option indice
    int returnProfileSavedBooksIndice; // Return Menu option indice
    
    // Save saved books in a vector
    FILE *dataArchive = fopen("data.dat", "r");
    if (dataArchive == NULL)
        perror("Failed to load the data\n");

    // Show saved books
    int page = 0;
    infoBook recentActivity[100];
    infoBook bookShow;
    
    
    // Verify if the file is empty
    if ((amountBooksFile("data.dat") == 0)){
        printf("!!! There is no Recent Activity !!!\n");
        fflush(stdout);
        sleep(1);
        cleanTerminal();

        *profileOption = 0; // Return Menu
    }else{ 
        do{
            int activityID = 0;
            while (fread(&bookShow, sizeof bookShow, 1, dataArchive) > 0) {
                recentActivity[activityID] = bookShow;
                activityID++;
            }

            fclose(dataArchive);

            if (editMode){
                cleanTerminal();
                printf("=== Recent activity ===\n");

                printf("1. Delete a read book\n"
                "2. Delete all read books\n"
                "3. Favorite a book\n"
                "4. Exit\n\n");
                
                printf("> Choose an edit option: ");
                fgets(input, sizeof input, stdin);
                sscanf(input, "%d", &editionOption);

                switch (editionOption){
                    case 1:
                        break;
                    case 2:
                        break;
                    case 3:
                        break;
                    case 4:
                        break;

                    default:
                        showMessageOnTerminal("Invalid option chosen");
                }
            }

            cleanTerminal();
            printf("=== Recent activity ===\n");

            // Define how much saved books will be showed
            int maxBookShow = 4; 
            int amountBooksToShow = maxBookShow;
            
            // Calcule how much saved books will be showed in the last page
            if ((page == (amountBooksFile("data.dat") / maxBookShow)) || (amountBooksFile("data.dat") < maxBookShow)) // if is the last page
                amountBooksToShow = (page > 0) ? (amountBooksFile("data.dat") % (page * maxBookShow)) : amountBooksFile("data.dat");
            
            //Show saved books
            if ((amountBooksFile("data.dat") + 1) >= maxBookShow){
                for (int i = 0; i < amountBooksToShow; i++){
                    int indice = i + (page * maxBookShow); // Calcule which book to show in function of the page
                    printf("%d. %s (%s), %s | Read on %d-%d-%d\n", recentActivity[indice].id, recentActivity[indice].title, recentActivity[indice].year, recentActivity[indice].author, recentActivity[indice].regYear, recentActivity[indice].regMon, recentActivity[indice].regDay);
                }
            }else{
            for (int i = 0; i < amountBooksFile("data.dat"); i++){
                    int indice = i + (page * maxBookShow); // Calcule which book to show in function of the page
                    printf("%d. %s (%s), %s | Read on %d-%d-%d\n", recentActivity[indice].id, recentActivity[indice].title, recentActivity[indice].year, recentActivity[indice].author, recentActivity[indice].regYear, recentActivity[indice].regMon, recentActivity[indice].regDay);
                }
            }
        
            // Define the commands numbers
            
            int lastIDShowed = (amountBooksToShow - 1) + (page * maxBookShow); 
            int lastSavedBookIndice = recentActivity[lastIDShowed].id;

            if (!editMode){
                editSavedBooksIndice = lastSavedBookIndice + 1;
                printf("%d. Edit read books\n", editSavedBooksIndice);
            
                if ((amountBooksFile("data.dat") > lastSavedBookIndice)){ // Verify if have more saved books to show
                    // Decide where to put the control options 
                    showMoreSavedBooksIndice = lastSavedBookIndice + 2;
                    returnProfileSavedBooksIndice = lastSavedBookIndice + 3;
                    
                    printf("%d. Show more\n", showMoreSavedBooksIndice);
                } else  // If there is no more page to show
                    returnProfileSavedBooksIndice = lastSavedBookIndice + 2;

                printf("%d. Return Profile\n\n", returnProfileSavedBooksIndice);

                // printf("Page: %d\nAmout To Show: %d\nLast Id: %d\nlastSavedBookIndice: %d\namountBooksFile(): %d\nrecentActivity[lastIDShowed].id: %d\n", page, amountBooksToShow, lastIDShowed, lastSavedBookIndice, amountBooksFile(), recentActivity[lastIDShowed].id);
                // printf("amountBooksFile() / maxBookShow = %d", amountBooksFile() / maxBookShow);
            } else if (editionOption != 2) { // != delete file option
                cancelEditingModeIndice = lastSavedBookIndice + 1; 
                printf("%d. Cancel editing\n", cancelEditingModeIndice);
            }
            // Catch the user's input
            if (editionOption != 2){ // != delete file option
                printf("> Choose an option: ");
                fgets(input, sizeof input, stdin);
                sscanf(input, "%d", &select);
            }
            
            //Edit read books function
            if (!editMode){
                if (select == editSavedBooksIndice)
                    editMode = true;
                else if ((select == showMoreSavedBooksIndice) && ((amountBooksFile("data.dat") + 1) > lastSavedBookIndice)) // If user chose Show More && if there are still more books to be shown
                    page++;
                else if (select == returnProfileSavedBooksIndice)// Return Profile function
                    *profileOption = 0;
                else{ // If the user iserted a invalid option
                    showMessageOnTerminal("Invalid option chosen");
                    rewind(dataArchive);
                }
            } else {
                if (editionOption == 1){ // Delete a read book
                    bool edited = false;

                    do {
                        if (select == showMoreSavedBooksIndice || select == returnProfileSavedBooksIndice){
                            showMessageOnTerminal("Invalid option chosen");
                        } else {
                            if (select == ((maxBookShow) + (page * maxBookShow) + 1))// If select is the next number of the last book, this is the Cancel editing option
                                edited = true;
                            else if (select > ((maxBookShow) + (page * maxBookShow) + 1) || select < (page * maxBookShow)){ // Checks whether the selected book is being showed
                                showMessageOnTerminal("Invalid option chosen");
                                edited = true;
                                select = cancelEditingModeIndice;
                            } else { // If the selected number is a book
                                FILE *dataArchive = fopen("data.dat", "r");
                                if (dataArchive == NULL)
                                    perror("Failed to open the data\n");

                                FILE *tempArchive = fopen("temp.dat", "w");
                                if (dataArchive == NULL)
                                    perror("Failed to copy the data\n");

                                int activityID = 0;
                                bool deletedBook = false;
                                while (fread(&recentActivity[activityID], sizeof recentActivity[activityID], 1, dataArchive) > 0) {
                                    if (recentActivity[activityID].id != select){
                                        if (deletedBook)
                                            recentActivity[activityID].id = recentActivity[activityID].id - 1; // Reorganize the IDs

                                        fwrite(&recentActivity[activityID], sizeof recentActivity[activityID], 1, tempArchive);
                                    }else{
                                        deletedBook = true;
                                    }
                                    activityID++;
                                }

                                fclose(dataArchive);
                                fclose(tempArchive);

                                remove("data.dat");
                                rename("temp.dat", "data.dat");
                                printf("changed\n");

                                showMessageOnTerminal(">>> The book was deleted <<<");
                                edited = true;
                            }
                        }
                    } while (!edited);
                    *profileOption = 0; // Return Profile
                } else if (editionOption == 2){ // Delete the file
                    bool validation = false;

                    do{
                        cleanTerminal();
                        printf("!!! WARNING !!!\n");
                        printf("Do you want to clear your reading history? This will also clear your favorite books\n\n");
                        printf("> Choose an option (y/n): ");
                        char deleteFile[5];
                        fgets(deleteFile, sizeof deleteFile, stdin);
                        
                        if (strcmp(deleteFile, "y\n") == 0){
                            FILE *dataArchive = fopen("data.dat", "w");
                            if (dataArchive == NULL)
                                perror("Failed to delete the data\n");
                        
                            fclose(dataArchive);
                            showMessageOnTerminal(">>> The data was deleted <<<");

                            validation = true;
                        } else if (strcmp(deleteFile, "n\n") == 0)
                            validation = true;
                         else
                            showMessageOnTerminal("Invalid option chosen");
                    } while (!validation);

                    *profileOption = 0; // Return Profile
                } else if (editionOption == 3){ // Add favorite book
                    if (select > ((maxBookShow) + (page * maxBookShow)) || select < (page * maxBookShow)){ // Checks whether the selected book is being showed
                        showMessageOnTerminal("Invalid option chosen");
                        select = cancelEditingModeIndice;
                    } else if (!bookAlreadyFavorited(&recentActivity[select])) { // If the selected number is a book
                        FILE *favoriteArchive = fopen("favorite.dat", "ab");
                        if (favoriteArchive == NULL)
                            perror("Failed to open the data\n");
                        
                        fwrite(&recentActivity[select - 1], sizeof recentActivity[select - 1], 1, favoriteArchive);

                        fclose(favoriteArchive);

                        showMessageOnTerminal(">>> The book was favorited <<<");
                    }

                    *profileOption = 0; // Return Profile
                } else if (editionOption == 4)
                    *profileOption = 0; // Return Profile
                else 
                    showMessageOnTerminal("Invalid option chosen");

                editMode = false;
            }

        } while (*profileOption == 2); // While the user do not selected the Return Menu option
    }
}

// Save read book
void saveBook(infoBook *bookLog){
    printf("ok");
    FILE *dataArchive = fopen("data.dat", "ab");
    if (dataArchive == NULL) {
        perror("Error to open the data");
    }
    fwrite(bookLog, sizeof *bookLog, 1, dataArchive);
    

    fclose(dataArchive);

    showMessageOnTerminal(">>> Book saved <<<");
}

// Rate eread books
void rateBook(infoBook *bookLog){
    int bookRating;
    
    do { // Catch book rating
        cleanTerminal();

        printf("=== Rating %s ===\n", bookLog->title);

        printf("Only whole or half-point values are allowed (e.g., 0, 0.5, 1, 1.5, ..., 5)\n\n");
        printf("> Rating: ");
        fgets(input, sizeof input, stdin);
        sscanf(input, "%d", &bookRating);
    } while (bookRating < 0 || bookRating > 5 || ((int)(bookRating * 2) != bookRating * 2)); // Ensures that the rate is a whole or half-point number;
    
    cleanTerminal();

    // Catch book review
    printf("=== Review %s ===\n", bookLog->title);
    char bookReview[360];
    printf("What did you think of the book?\n\n");
    printf("> Review: ");
    fgets(bookReview, sizeof bookReview, stdin);

    cleanTerminal();

    bookLog->rating = bookRating;
    strcpy(bookLog->review, bookReview);

    saveBook(bookLog);
}

// Select a book to log
void selectSearchedBook(int *validation, infoBook bookList[], int amountList, int *cursor, int *menuShow){
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
            infoBook choseBook;
            choseBook = bookList[select - 1];

            choseBook.id = amountBooksFile("data.dat") + 1;

            time_t atualTime = time(NULL);
            struct tm *infoTime= localtime(&atualTime);
            choseBook.regDay = infoTime->tm_mday;
            choseBook.regMon = infoTime->tm_mon + 1;
            choseBook.regYear = infoTime->tm_year + 1900;

            bool validation = false;
            do{
                printf("=== %s (%s) ===\n", bookList[select - 1].title, bookList[select - 1].year);
                printf("\n> Do you want to Log this book? (y/n): ");
                fgets(input, sizeof input, stdin);

                if (strcmp(input, "y\n") == 0){
                    rateBook(&choseBook);
                    cleanTerminal();
                    *menuShow = 0;
                }
                else if (strcmp(input, "n\n") == 0){
                    cleanTerminal();
                    showLog(cursor, menuShow);
                } else
                    showMessageOnTerminal("Invalid option chosen");
            } while (!validation);
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
                    showMessageOnTerminal("Invalid option chosen");
            }
        }
    }
}

// Log the selected book in the data
void logBook(int *cursor, int *menuShow){
    if (*menuShow == 1){
        int amountToShow = 5;
        infoBook booksTitlesToShow[amountToShow];

        // Verify if the search was correct;
        int searchOk = 0; // 0 -> OK \\ 1 -> Wrong 
        searchBook(&searchOk, booksTitlesToShow, amountToShow, cursor, menuShow);

        if (searchOk == 0)
            selectSearchedBook(&searchOk, booksTitlesToShow, amountToShow, cursor, menuShow);
    }
}

//-------------------------------- SHOW SCREEENS --------------------------------

void showMenu(int *cursor, int *menuShow, stru_screen screen){
    writePage("MARGINALIA", screen.amount, screen);
    menuInput("> Choose an option", cursor, menuShow);
}

void showLog(int *cursor, int *menuShow){
    if (*menuShow == 1){
        printf("=== I read... ===\n");
        logBook(cursor, menuShow); 
    }
}

void showProfile(int *cursor, int *menuShow, stru_screen screen){
    if (*menuShow == 2){
        writePage("PROFILE", screen.amount, screen);
        profileInput("> Choose an option", 1, cursor, menuShow);
    }
}
