# antartica

1. How to run the project?
    a. Clone the project from GitHub, https://github.com/nmimsportalteam/antartica.
    b. Find .env file in the attcahed zipped project (in the root project folder).
    c. Copy paste the .env file in the project root directory.
    d. Make changes to DB_HOST, DB_NAME, DB_USER, DB_PASS depending on your database setup. 
    e. Run 'npm install' command. make sure NodeJS and npm is installed.
    f. Run 'node server' command to start the project.

2. How to run database locally?
    a. PostgreSQL must be installed and running in the PC.
    b. Find the database.sql file available in the zipped project file.
    c. Execute the sql file.


3. Folder Structure:
    -app
        -api
            -controllers # application logic
            -routers # endpoints
            -utils # JWT and other middleware functions
    -config # database config file
    -public #static files like css, js and images
    - views #frontend template files
        -partials #reuasable templates like header, footer, sidebar
        
4. Implementations:
    - NodeJS with ExpressJS Framework.
    - JWT for authentication.
    - PostgreSQL database.
    - Three PostgreSQL functions for unique employee id generation, user registration and searching user data with filter and sorting.
    - pm2 service for running NodeJS application.