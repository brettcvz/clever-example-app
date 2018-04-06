# Example Clever App

A barebones app that implements SIgn Up With Clever, using [Node.js](http://nodejs.org/) and [Express 4](http://expressjs.com/).

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
$ git clone git@github.com:brettcvz/clever-example-app.git # or clone your own fork
$ cd clever-example-app
$ npm install
```

Then, edit the `.env` file to add your Clever Client ID and Clever Client Secret. These can be found on your [Clever Dashboard](https://apps.clever.com/) under the "Settings" tab.

Now, run the app:
```sh
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Implementing "Sign Up with Clever"
The basic sequence to implement Sign Up with Clever is as follows:

1. Add a "Sign Up with Clever" button to your application's signup page, that directs the user to the Clever `/oauth/authorize` endpoint with the correct parameters for your app. You can also add a "Log In with Clever" button that points to the same URL.  Button assets can be found in the [Clever Dev Docs](https://dev.clever.com/docs/identity-api#section-liwc-button-assets)
2. Implement a route in your app to handle when the OAuth request returns from Clever, that dose the following:
    a. Exchanges a single-use `code` for a longer-lived `token` that can be used with the Clever API.
    b. Hits the `/v2.0/me` endpoint to get the user's Clever ID
    c. Checks to see a user with that Clever ID already exists. If so, log the user in to your app. If not, hit the Clever API to request the user's name, classes, etc. and create the corresponding user in your app.
3. Send the now logged in user to your app's home page.

At step 2.c., you may want to ask the user if they already have an existing account, and if so, if they want to associate their Clever ID with their existing account.

For more details on how to perform an OAuth connection with Clever, see the [Clever Dev Docs](https://dev.clever.com/docs/identity-api#section-log-in-with-clever), or look at the `runOAuthFlow` method in the `clever.js` file.

To access information about the currently Clever user, you can use the [Clever API](https://dev.clever.com/reference#schema), making user's [Instant Login Bearer Token](https://dev.clever.com/docs/api-overview#section-instant-login-bearer-tokens).
