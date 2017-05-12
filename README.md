# Project Chess: Node.js Server

## Prequesites

1. Install [Node.js](https://nodejs.org/en/)
2. If you plan to use Database features, setup a [MySQL Server](https://www.mysql.com/downloads/) (optional)
    * Follow the installation instructions provided by MySQL
    * Setup a user with sufficient permissions to read and write to the database
    * Execute the [db_schema.sql](database/db_schema.sql) script to create the database and tables needed

## Installation

1. Clone this project
2. Run `npm install` in a command prompt in the root folder of the project
3. Copy `config.js.example` and rename the copy to `config.js`. Change its contents accordingly.

## Run the project

### With a database connected
1. Make sure your database service is running
2. Run `node server.js` in a command prompt
3. To stop the running server, hit `Ctrl-C`

### Without a database
1. Run `node server.js --mock` in a command prompt
2. To stop the running server, hit `Ctrl-C`
