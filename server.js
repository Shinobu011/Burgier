const express = require("express")
const session = require('express-session')
const path = require("path")
const app = express();
require('dotenv').config();
const PORT = 8795;
app.use(session({
    secret: 'aejgneajgneufneufn31g8317fn13f713hf137fhn712nf178fn217fn137f13h',
    resave: false,
    saveUninitialized: true
}))

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({apiKey: process.env.apiKey});

app.use(express.urlencoded({extended: true}))
app.use(express.json())

const { Database } = require('st.db');

const db = new Database({path: "data.json"})
app.use("/public", express.static(path.join(__dirname, "assets")))
app.use(express.static(__dirname))

app.get("/home", (req, res) => {
    if(!req.session.user) return res.sendFile(path.join(__dirname, "home.html"))
    res.sendFile(path.join(__dirname, "home2.html"))
})

app.get("/login", (req, res) => {
    if(req.session.user) return res.redirect('/home')
    res.sendFile(path.join(__dirname, "login.html"))
})

app.post('/signup', async (req, res) => {
    let email = req.body.email
    let username = req.body.username
    let password = req.body.password
    const exists = (await db.get("accounts")).find(acc => acc.email === email)
    if (exists) {
        return res.json('This email already exists.')
    }
    await db.push("accounts", {
        email: email,
        username: username,
        password: password
    })
    req.session.user = { username: username, email: email }
    res.redirect('/')
})

app.post("/login", async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    const accounts = await db.get("accounts") || [];
    const user = accounts.find(acc => acc.email === email && acc.password === password)

    if(!user) {
        return res.json("Invalid email or password.")
    }

    let username = user.username

    req.session.user = {
        username: username,
        email: user.email
    }
    res.redirect("/")
})

app.post("/ai", async (req, res) => {
    const message = req.body.message
    console.log(message)
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
            systemInstruction: "You are an expert chef, and your name is burgier.",
        },
    });
    console.log(response.text)
    res.json({ reply: response.text });
})

app.post("/ai-search", async (req, res) => {
    const message = req.body.ingredients
    console.log(message)
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
            systemInstruction: "You are an expert chef, your name is burgier, you are using the ingredients of food sent for you to determine the best recipe and food.",
        },
    });
    console.log(response.text)
    res.json({ reply: response.text });
})

app.get("/signout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/home");
    });
});

app.use((req, res) => {
    res.redirect('/home');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});