#ifndef MARGINALIA_H
#define MARGINALIA_H

#include <stdbool.h>

typedef struct {
    char *options[10];
    int amount;
} stru_screen;

typedef struct {
    int id;
    char title[160], author[80];
    char year[40];
} bookInfo;


struct MemoryStruct {
  char *memory;
  size_t size;
};

void cleanTerminal();
void getInput(char *inputMessage, int validation, int *cursor, int *menuShow);
int lowText (char vector[]);
void writePage(const char *menuName, int optionsNumber, stru_screen options);
void showMenu(int *cursor, int *menuShow, stru_screen screen);
void showProfile(int *cursor, int *menuShow, stru_screen screen);
void showLog(int *cursor, int *menuShow);
int urlToSearch (char string[]);
int getBook(const char *url, bookInfo booksToShow[], int amountToShow);
void searchBook(int *validation, bookInfo bookList[], int amountList, int *cursor, int *menuShow);
static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp);
void chooseSearchedBook(int *validation, bookInfo bookList[], int amountList, int *cursor, int *menuShow);
void logBook(int *cursor, int *menuShow);
void saveBook(bookInfo *bookLog);
void showDataBook(int *menuShow);
void searchingMessage(bool *searching);
int amountBooksSaved();


#endif
