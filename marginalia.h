#ifndef MARGINALIA_H
#define MARGINALIA_H

#include <stdbool.h>

typedef struct {
    char *options[10];
    int amount;
} stru_screen;

typedef struct {
    int id;
    char title[160], author[80], year[40];
    
    char review[360];
    int rating;

    int regDay, regMon, regYear; // The data that the user saved the book
    
} infoBook;


struct MemoryStruct {
  char *memory;
  size_t size;
};

bool bookAlreadyFavorited(infoBook *addBook); // Verify if the book is already in the favorite archive

int lowText (char vector[]); // Transform a text to lowcase text
int urlToSearch (char string[]); // Transform User's input in a url to the API
int getBook(const char *url, infoBook booksToShow[], int amountToShow); // Request book in the API.
int amountBooksFile(char *fileName); // Calcule how much books have in the data archive

void cleanTerminal(); // Print white lines to "clean the terminal"
void showMessageOnTerminal(char *message); // Show Message on Terminal
void writePage(const char *menuName, int optionsNumber, stru_screen options); // Write a page with options
void searchBook(int *validation, infoBook bookList[], int amountList, int *cursor, int *menuShow); // Call functions to the Book's Search in LOG +
void selectSearchedBook(int *validation, infoBook bookList[], int amountList, int *cursor, int *menuShow); // Select a book to log
void logBook(int *cursor, int *menuShow); // Log the selected book in the data
void saveBook(infoBook *bookLog); // Save read book
void showRecentActivity(int *profileOption); // Show read books
void searchingMessage(bool *searching); // Show animate message "Searching..."
void showFavoriteBooks(int *profileOption); // Show a list of the favorite books
void rateBook(infoBook *bookLog); // Rate eread books
void menuInput(char *inputMessage, int *cursor, int *menuShow); // Show a message and catch the local where the user want to go
void profileInput(char *inputMessage, int validation, int *cursor, int *menuShow); // Profile Navigation
void showMenu(int *cursor, int *menuShow, stru_screen screen);
void showProfile(int *cursor, int *menuShow, stru_screen screen);
void showLog(int *cursor, int *menuShow);

static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp); // Manage memory to getBook()

#endif
