#ifndef MARGINALIA_H
#define MARGINALIA_H

typedef struct {
    char *options[10];
    int amount;
} stru_screen;

void cleanTerminal();
void getInput(char *inputMessage, int validation, int *cursor, int *menuShow);
int lowText (char vector[]);
void writePage(const char *menuName, int optionsNumber, stru_screen options);
void showMenu(int *cursor, int *menuShow, stru_screen options);
void showProfile(int *cursor, int *menuShow, stru_screen screen);


#endif
