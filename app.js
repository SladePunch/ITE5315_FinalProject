/****************************************************************************** * 
ITE5315 – Project * I declare that this assignment is my own work in accordance with Humber Academic Policy. 
* No part of this assignment has been copied manually or electronically from any other source * (including web sites) or distributed to other 
students. * * 
Group member Name: Slade Sahoye | Student IDs: N01680074 | Date: December 8th, 2024 
******************************************************************************/

const express = require('express');
const exphbs = require('express-handlebars');
const restaurantRoute = require('./routes/restaurant');
const db = require('./db');
const mongoose = require('./db');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const app = express();
const port = process.env.PORT || 3000;
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000
    }
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log("Deserializing user with ID:", id);
    User.findById(id)
        .then(user => done(null, user))
        .catch(err => done(err));
});

app.use(flash());

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));

passport.use(new LocalStrategy(async (username, password, done) => {
    try {

        const user = await User.findOne({ username: username });

        if (!user) {
            console.log('Incorrect username');
            return done(null, false, { message: 'Incorrect username.' });
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Incorrect password');
            return done(null, false, { message: 'Incorrect password.' });
        }

        console.log('Authentication successful for user:', username);
        return done(null, user);
    } catch (err) {
        console.error('Error during authentication:', err);
        return done(err);
    }
}));

function ensureAuthenticated(req, res, next) {
    console.log("User authenticated:", req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Dummy user creation for testing purposes
async function createDummyUser() {
    try {
        const existingUser = await User.findOne({ username: 'testuser' });
        if (!existingUser) {
            const dummyUser = new User({
                username: 'testuser',
                password: 'password123'
            });

            const hashedPassword = await bcrypt.hash(dummyUser.password, 10);
            dummyUser.password = hashedPassword;

            await dummyUser.save();
            console.log('Dummy user created');
        } else {
            console.log('User already exists');
        }
    } catch (err) {
        console.error('Error checking or saving dummy user:', err);
    }
}

createDummyUser();

// Routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            console.error('Error during authentication:', err);
            return res.redirect('/login');
        }

        if (!user) {
            console.log('Authentication failed');
            return res.redirect('/login');
        }

        console.log('User authenticated:', user.username);

        req.logIn(user, async (err) => {
            if (err) {
                console.error('Error during login:', err);
                return res.redirect('/login');
            }

            const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.cookie('auth_token', token, { httpOnly: true, secure: false });

            res.redirect('/form');
        });
    })(req, res, next);
});


// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = decoded;
        next();
    });
}

app.get('/form', verifyToken, (req, res) => {
    res.render('form', { username: req.user.username });
})

// Logout route
app.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
});

// Initialize database and routes
db.initialize(process.env.MONGO_URI).then(() => {
    console.log('Database connection successful');


    app.use('/api/restaurants', restaurantRoute);

    app.get('/', async (req, res) => {
        res.render('login', { layout: 'main' });
    });

    app.post('/restaurants', async (req, res) => {
        const { page, perPage, borough, cuisine } = req.body;
        try {
            const restaurants = await db.getAllRestaurants(
                parseInt(page),
                parseInt(perPage),
                borough,
                cuisine
            );
            res.render('results', { layout: 'main', restaurants });
        } catch (err) {
            res.status(500).send('Unable to fetch restaurants.');
        }
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch((err) => {
    console.error(`Failed to connect to the database: ${err}`);
});