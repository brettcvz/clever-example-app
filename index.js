const express = require('express');
const session = require('express-session');
const path = require('path')

// Making use of a lightweight library to wrap common Clever requests
// For Clever libraries in other languages, see https://dev.clever.com/docs/libraries
const clever = require("./clever");

const PORT = process.env.PORT || 5000

// We pull our Clever secrets out of the environment where the code is run, so that we don't check our secrets into version control
CLIENT_ID = process.env.CLEVER_CLIENT_ID;
CLIENT_SECRET = process.env.CLEVER_CLIENT_SECRET;
REDIRECT_URL = process.env.REDIRECT_URL;

// Set up a basic server
SESSION_SECRET = process.env.SESSION_SECRET;
var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
      secret: SESSION_SECRET,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days 
      resave: false,
      saveUninitialized: true,
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// For displaying errors
function Error(err, res) {
    console.error(err);
    res.send("Sorry, we encountered an error");
}

// The main page - if you're not logged in, it takes you to the signup page, otherwise it shows you your classes
app.get('/', (req, res) => {
  if (!req.session.token) {
    return res.redirect("/signup");
  }

  const { me, user_type, sections } = req.session;

  // Pass this data to the html template to show to the user
  return res.render("index", {
    me,
    user_type,
    sections,
  });
});

// The signup page - simply renders a button to sign up via Clever
app.get('/signup', (req, res) => {
  if (req.session.token) {
    return res.redirect("/");
  }

  // Constructing the login url, including the client_id & redirect url
  const login_url = "https://clever.com/oauth/authorize?"
    + "response_type=code"
    + "&redirect_uri=" + encodeURIComponent(REDIRECT_URL)
    + "&client_id=" + CLIENT_ID
    // IMPORTANT: We use this in the demo to always send the user to log in via the Clever SSO demo district. In your app, remove this!
    + "&district_id=5a59665012d93f00017f8740";

  // Rendering the signup page
  return res.render("signup", { login_url });
});

// Receiving the login back from Clever - we want to exchange the oauth code for a token that can be used to fetch
// information about the user, like their name and what classes they teach
app.get('/oauth', async (req, res) => {
  var code = req.query.code;
  const user = await clever.runOAuthFlow(code);

  // If we already have the user, log them in, otherwise create the new user
  if (userAlreadyExists(user)) {
    // Great! The user already exists, so log them in
    logInUser(req, user);
  } else {
    // We have a new user, create the user and log them in
    await createUserAndSaveToDB(req, user);
    logInUser(req, user);
  }

  // Now go back to the main page
  return res.redirect("/");
});

function userAlreadyExists(user) {
  // Here is where you would check your database to see if you already have a user
  // with Clever ID of `user.id`. In our case, we don't have a database, so we always return `false`
  return false;
}

// Here is where you would create a valid, logged in session for this user in your app
// In this demo app, we just store the user ID and Clever token in the session
// Remember, you *don't* want to save the Clever token in long-term storage like a database,
// because the token is only valid for 2 hours.
function logInUser(req, user) {
  req.session.user_type = user.type;
  req.session.user_id = user.id;
  req.session.token = user.token;
}

// Here is where you would create the user, and save it in your database.
// In our case, we don't have a database, so we put information onto the session
async function createUserAndSaveToDB(req, user) {
  // Fetch information (name, etc.) about the current user
  const me = await clever.getMyInfo(user.id, user.type, user.token);
  req.session.me = me;

  // Fetch the sections that the student is in, or that the teacher teaches, along with student information
  const sections = await clever.getMySectionsWithStudents(user.id, user.type, user.token);
  req.session.sections = sections;
}

// Log-out. Note that this only logs the user out of the current app, and does not log the user out of Clever
app.get('/logout', (req, res) => {
  req.session.destroy();
  return res.redirect("/");
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
