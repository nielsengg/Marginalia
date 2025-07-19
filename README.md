# Marginalia

Marginalia is a simple command-line application developed in C for cataloging books. It lets readers track their current reads, add notes, rate books, and review their reading history.

## Features

  * **Book Logging**: Search for and log books you've read using the Open Library API.
  * **Notes and Ratings**: Add detailed notes and rate your books from 0 to 5 stars.
  * **Reading History**: Maintain a record of all the books you've completed.
  * **Favorite Books**: Mark and view your favorite books separately.
  * **Data Management**: Edit or delete book entries from your history.
  * **Simple Interface**: Intuitive menu navigation via the terminal.

## Requirements

To compile and run Marginalia, you'll need the following software and libraries:

  * **C Compiler**: A C compiler, such as GCC or Clang.
  * **LibcURL**: A client-side URL transfer library, used for making HTTP requests to the Open Library API.
  * **cJSON**: A lightweight JSON parsing and generation library, essential for processing API responses.
      * You'll need to include the `cJSON.h` and `cJSON.c` files in your project or have `cJSON` installed on your system.
  * **CA Certificate (`cacert.pem`)**: This file is necessary for cURL to verify SSL/TLS certificates when making HTTPS requests. You can usually download it from [curl.se/docs/caextract.html](https://curl.se/docs/caextract.html) or obtain it from your operating system. Make sure it's in the same directory as the executable.
  * **Internet Connection**: Required for the book search functionality via the Open Library API.

## Usage

When you start Marginalia, you'll see a main menu. Use the numerical options to navigate:

1.  **Log +**: Start the process to search for and log a new book you've read.
2.  **Profile**: Access your profile to view favorite books, recent activity, and editing options.
3.  **Exit**: Quit the application.

Within each section, follow the on-screen prompts to interact with the system.
