# Property Viewer

This application uses its own server (located at backend/server.js)

Firstly, in order to run the app you start the backend server:

### `cd backend`

### `node server`

Then, build the React App:

### `npm run build`

You may need to install react-scripts:

### `npm install react-scripts --save`

If you want to change the endpoints in the backend/setup.json file, these are send to the public/setup.json file when you run the backend. That is the reason you might run the backend before the React build, since the build copies the public/setup.json file.

The database Credentials

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

================================================

Frontend dependencies:

npm install react-router-dom

Backend dependencies:
express, pg, nodemailer, bcrypt

================================================

To install dependencies:

### `cd backend`

and then:

### `npm install express`

### `npm install pg`

### `npm install nodemailer`

### `npm npm install bcryptjs`
