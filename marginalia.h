#ifndef MARGINALIA_H
#define MARGINALIA_H

struct stru_option{
    char textShow[160];
    int position;
};

void cleanTerminal();
void getInput(int validation, int cursor, int *menuShow);
int lowText (char vector[]);
int showBookList(const char* dataName, char* inputName, char* line, struct stru_option vector[]);
void writePage(const char *menuName, int optionsNumber, int isVector, struct stru_option vector[], const char *stringOption);
int getBookName();

#endif
