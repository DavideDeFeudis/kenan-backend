const express = require("express");
const app = express();
const sendMail = require("./mail");
const mongoose = require("mongoose");
require("dotenv").config();

const port = process.env.PORT;
const mongoUrl = process.env.MONGO;

mongoose.connect(
    mongoUrl,
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    },
    (err) => {
        if (!err) {
            console.log("MongoDB Connection succeeded");
        } else {
            console.log("Error on DB connection: " + err);
        }
    }
);

const CustomerSchema = new mongoose.Schema({
    workshopId: { type: String, required: false },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: false },
});

const Customer = mongoose.model("Customer", CustomerSchema);

const WorkshopSchema = new mongoose.Schema({
    title: { type: String, required: true },
    startDate: { type: String, required: true },
    startTime: { type: String },
    endDate: { type: String, required: true },
    endTime: { type: String },
    address: { type: String },
    info: { type: String },
    priceLabel1: { type: String, required: true },
    priceLabel2: String,
    priceLabel3: String,
    priceLabel4: String,
    priceLabel5: String,
    priceLabel6: String,
    price1: { type: Number, required: true },
    price2: Number,
    price3: Number,
    price4: Number,
    price5: Number,
    price6: Number,
    customers: [CustomerSchema],
});

const Workshop = mongoose.model("Workshop", WorkshopSchema);

app.use(express.json());

app.use((req, res, next) => {
    res.set("ACCESS-CONTROL-ALLOW-ORIGIN", process.env.CORS_ORIGIN);
    res.set("ACCESS-CONTROL-ALLOW-HEADERS", "*");
    res.set("ACCESS-CONTROL-ALLOW-METHODS", "GET, POST, PATCH, DELETE");
    next();
});

app.get("/ping", (req, res) => {
    res.json({ message: "version 4" });
});

app.post("/contact", (req, res) => {
    const { email, name, subject, text } = req.body;

    sendMail(email, name, subject, text, (err, data) => {
        if (err) {
            console.log("Error sending message", err);
            res.status(500).json({ success: false, message: "Error sending message.", err });
        } else {
            console.log("Message sent");
            res.json({ success: true, message: "Your message has been sent." });
        }
    });
});

app.post("/signup", async (req, res) => {
    let { email, firstName, lastName, subject, text } = req.body;
    const name = firstName + lastName;

    sendMail(email, name, subject, text, (err, data) => {
        if (err) {
            console.log("Error sending message", err);
            res.status(500).json({ success: false, message: "Error sending message.", err });
        } else {
            console.log("Message sent");
            res.json({ success: true, message: "Your message has been sent." });
        }
    });
});

app.get("/seed", (req, res) => {
    const workshop1 = new Workshop({
        title: "Flow Acrobatics Dresden",
        startDate: "2020-05-20",
        startTime: "11:00",
        endDate: "2020-05-21",
        endTime: "12:30",
        address: "Dresdener Str. 24, 10445 Dresden",
        info: "For professional dancers",
        priceLabel1: "Until 04.04.2020 two days €",
        priceLabel2: "Until 04.04.2020 one day €",
        priceLabel3: "Normal price two days €",
        priceLabel4: "Normal price one day €",
        price1: 80,
        price2: 50,
        price3: 100,
        price4: 60,
        customers: [
            {
                email: "customer1@gmail.com",
                firstName: "Jo",
                lastName: "Doe",
                subject: "Sign up for workshop",
                text: "hi, i want to sign up",
            },
            {
                email: "customer2@gmail.com",
                firstName: "Al",
                lastName: "Nap",
                subject: "Sign up for workshop 2",
                text: "i want to sign up",
            },
        ],
    });
    const workshop2 = new Workshop({
        title: "Flow Acrobatics Hamburg",
        startDate: "2020-04-20",
        startTime: "11:00",
        endDate: "2020-04-21",
        endTime: "12:30",
        address: "Hamburger Str. 24, 53465 Hamburg",
        info: "For professional dancers and acrobats",
        priceLabel1: "Until 04.04.2020 two days €",
        priceLabel2: "Until 04.04.2020 one day €",
        priceLabel3: "Normal price two days €",
        priceLabel4: "Normal price one day €",
        price1: 80,
        price2: 50,
        price3: 100,
        price4: 60,
        customers: [
            {
                email: "customer1@gmail.com",
                firstName: "Jo",
                lastName: "Doe",
                subject: "Sign up for workshop",
                text: "hi, i want to sign up",
            },
        ],
    });
    Workshop.insertMany([workshop1, workshop2])
        .then(() => res.send([workshop1, workshop2]))
        .catch((err) => res.send(err));
});

app.get("/drop", (req, res) => {
    Workshop.collection
        .drop()
        .then(() => res.send({ message: "collection dropped" }))
        .catch((err) => res.send(err));
});

app.get("/workshops", (req, res) => {
    Workshop.find()
        .then((workshops) => res.send(workshops))
        .catch((err) => {
            res.send(err);
        });
});

app.get("/customers", (req, res) => {
    Customer.find()
        .then((customers) => res.send(customers))
        .catch((err) => {
            res.send(err);
        });
});

app.post("/admin/workshop", (req, res) => {
    const workshop = new Workshop({
        ...req.body,
    });

    workshop
        .save()
        .then((workshop) => {
            console.log("Workshop created");
            res.json(workshop);
        })
        .catch((err) => {
            console.log("Create workshop failed - err:", err);
            res.send(err);
        });
});

app.delete("/admin/workshop/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await Workshop.findOneAndDelete({ _id: id });
        res.send({});
    } catch (err) {
        res.send(err);
    }
});

app.put("/admin/workshop/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const workshopToUpdate = await Workshop.findOneAndUpdate({ _id: id }, req.body);
        res.send({ success: true });
    } catch (err) {
        res.send(err);
    }
});

// ERROR HANDLER
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message || err });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
