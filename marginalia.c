#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>
#include <curl/curl.h>

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

    string[strcspn(string, "\n")] = '\0';
}


// Write a page with options
void writePage(const char *menuName, int optionsNumber, stru_screen screen){ 
    printf("=== %s ===\n", menuName);
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

// Request book in the API
void getBook(const char *url){
    printf("URL: [%s]", url);

    CURL *curl_handle;
    CURLcode res;
    
    struct MemoryStruct chunk;
    
    chunk.memory = malloc(1);  /* grown as needed by the realloc above */
    chunk.size = 0;    /* no data at this point */
    
    curl_global_init(CURL_GLOBAL_ALL);
    
    /* init the curl session */
    curl_handle = curl_easy_init();
    
    /* specify URL to get */
    curl_easy_setopt(curl_handle, CURLOPT_URL, url);
    
    /* send all data to this function  */
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
    
    /* we pass our 'chunk' struct to the callback function */
    curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, (void *)&chunk);
    
    /* some servers do not like requests that are made without a user-agent
        field, so we provide one */
    curl_easy_setopt(curl_handle, CURLOPT_USERAGENT, "libcurl-agent/1.0");

    curl_easy_setopt(curl_handle, CURLOPT_CAINFO, "cacert.pem");
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYHOST, 2L);
    
    /* get it! */
    res = curl_easy_perform(curl_handle);
    
    /* check for errors */
    if(res != CURLE_OK) {
        fprintf(stderr, "curl_easy_perform() failed: %s\n",
                curl_easy_strerror(res));
    }
    else {
        /*
        * Now, our chunk.memory points to a memory block that is chunk.size
        * bytes big and contains the remote file.
        *
        * Do something nice with it!
        */
    
        printf("%lu bytes retrieved\n", (unsigned long)chunk.size);
    }
    
    /* cleanup curl stuff */
    curl_easy_cleanup(curl_handle);
    
    free(chunk.memory);
    
    /* we are done with libcurl, so clean it up */
    curl_global_cleanup();
}


void searchBook(){
    // Request Book's name;
    char input[80];
    printf("Search for book: ");
    fgets(input, sizeof input, stdin);

    // Transform input in lowcase
    char lowInput[80]; 
    strcpy(lowInput, input);
    lowText(lowInput);
    
    // Transform input to URL
    urlToSearch(lowInput);

    // Request URL
    getBook(lowInput);

    // show list of serach
    


}

// SHOW SCREEENS
void showMenu(int *cursor, int *menuShow, stru_screen screen){
    writePage("MARGINALIA", screen.amount, screen);
    getInput("Choose an option", 1, cursor, menuShow);
}

void showLog(int *cursor, int *menuShow, stru_screen screen){
    writePage("I read...", screen.amount, screen);
    searchBook();
}

void showProfile(int *cursor, int *menuShow, stru_screen screen){
    writePage("USERNAME", screen.amount, screen);
    getInput("Choose an option", 1, cursor, menuShow);
}
