const port = 5003;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt"); // Add bcrypt for password hashing
const User = require("../back-end/User"); // Import User model

app.use(express.json());
app.use(cors);

// Database Connection with MongoDB
mongoose.connect("mongodb+srv://gurveerkaur:77667766@cluster0.2hbborp.mongodb.net/aoi");

// API creation
app.get("/", (req, res) => {
    res.send("Express App is Running");
});


// Schema for storing contact form data
const ContactFormEntry = mongoose.model("ContactFormEntry", {
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    inquiry: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// API endpoint to handle form submissions
app.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, inquiry } = req.body;
        const contactFormEntry = new ContactFormEntry({ name, email, phone, inquiry });
        await contactFormEntry.save();
        res.json({ success: true, message: "Form submitted successfully." });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

app.get('/contact', async (req, res) => {
    try {
        const entries = await ContactFormEntry.find().sort({ date: -1 });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching contact form entries:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// User Model

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists with this email address" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.json({ success: true, message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);  // This will help track issues
        res.status(500).json({ success: false, message: "An error occurred while registering. Please try again later." });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ userId: user._id }, 'secret_key');
        res.json({ success: true, token });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ success: false, message: "An error occurred while logging in. Please try again later." });
    }
});


// API endpoint for user login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        // If password matches, generate JWT token
        const token = jwt.sign({ userId: user._id }, 'secret_key', { expiresIn: '1h' });

        res.json({ success: true, token });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ success: false, message: "An error occurred while logging in. Please try again later." });
    }
});

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running On Port" + port);
    } else {
        console.log("Error : " + error);
    }
});