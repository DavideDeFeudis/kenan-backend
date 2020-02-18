const express = require('express')
const app = express()
const sendMail = require('./mail')
const mongoose = require('mongoose')
require('dotenv').config()

const port = process.env.PORT || 4000
const mongoUrl = process.env.MONGO

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection succeeded')
    } else {
        console.log('Error on DB connection: ' + err)
    }
});

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
})

const Admin = mongoose.model('Admin', adminSchema);

const Customer = mongoose.model('Customer', new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    messages: [{ subject: String, text: String }],
    workshops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workshop'
    }]
}));

const Workshop = mongoose.model('Workshop', new mongoose.Schema({
    secondaryID: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    address: { type: String, required: true },
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
    customers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }]
}));

app.use(express.json())

app.use((req, res, next) => {
    res.set('ACCESS-CONTROL-ALLOW-ORIGIN', process.env.CORS_ORIGIN)
    res.set('ACCESS-CONTROL-ALLOW-HEADERS', '*')
    res.set('ACCESS-CONTROL-ALLOW-METHODS', 'GET, POST, PATCH, DELETE')
    next()
})

app.get('/ping', (req, res) => {
    res.json({ message: 'ok' })
})

app.post('/contact', (req, res) => {
    const { email, name, subject, text } = req.body

    sendMail(email, name, subject, text, (err, data) => {
        if (err) {
            res.status(500).json({ message: 'Error sending message. Try again later.' })
        }
        else {
            res.json({ message: 'Your message has been successfully sent!' })
        }
    })
})

app.post('/workshops', (req, res) => {
    let { email, firstName, lastName, subject, text } = req.body
    const name = `${firstName} ${lastName}`
    if (!text) {
        text = `From: ${name} ${email}`
    }
    sendMail(email, name, subject, text, (err, data) => {
        if (err) {
            res.status(500).json({ message: 'Error signing up. Try again later.' })
        }
        else {
            res.json({ message: 'You signed up successfully!' })
        }
    })
})

app.get('/seed', (req, res) => {
    const workshop1 = new Workshop({
        secondaryID: 'afhrh44389rfhjrke43',
        title: 'Flow Acrobatics Dresden',
        date: '11-12.04.2020 11:00-15:00',
        address: 'Dresdener Str. 24, 10445 Dresden',
        info: 'For professional dancers',
        priceLabel1: 'Early bird until 04.04.2020: two days €',
        priceLabel2: '/ one day: €',
        priceLabel3: 'Normal price: two days €',
        priceLabel4: '/ one day: €',
        price1: 80,
        price2: 50,
        price3: 100,
        price4: 60,
    })
    const workshop2 = new Workshop({
        secondaryID: 'srt4565rgkjhw45kjh',
        title: 'Flow Acrobatics Hamburg',
        date: '11-12.05.2020 11:00-15:00',
        address: 'Hamburger Str. 24, 53465 Hamburg',
        info: 'For professional dancers and acrobats',
        priceLabel1: 'Early bird until 04.05.2020: two days €',
        priceLabel2: '/ one day: €',
        priceLabel3: 'Normal price: two days €',
        priceLabel4: '/ one day: €',
        price1: 80,
        price2: 50,
        price3: 100,
        price4: 60,
    })
    const workshop3 = new Workshop({
        secondaryID: 'sfgkjsrtgkjkj5439fdf',
        title: 'Flow Acrobatics Barcelona',
        date: '11-12.06.2020 11:00-15:00',
        address: 'Calle Barcelona 24, 54325 Barcelona',
        info: 'For acrobats',
        priceLabel1: 'Early bird until 04.06.2020: two days €',
        priceLabel2: '/ one day: €',
        priceLabel3: 'Normal price: two days €',
        priceLabel4: '/ one day: €',
        price1: 70,
        price2: 40,
        price3: 90,
        price4: 50,
    })
    Workshop.insertMany([workshop1, workshop2, workshop3])
        .then(() => res.send([workshop1, workshop2, workshop3]))
        .catch(err => res.send(err))
})

app.get('/workshops', (req, res) => {
    Workshop.find()
        .then(workshops => res.send(workshops))
        .catch(err => {
            res.send(err)
        })
    // Workshop.find((err, workshops) => {
    //     if (err) {
    //         console.log(err)
    //         res.send(err)
    //     } else {
    //         mongoose.connection.close();
    //         res.send(workshops)
    //     }
    // })
})

app.post('/admin/workshop', (req, res) => {
    const {
        secondaryID,
        title,
        date,
        address,
        info,
        priceLabel1,
        priceLabel2,
        priceLabel3,
        priceLabel4,
        price1,
        price2,
        price3,
        price4 } = req.body
    const workshop = new Workshop({
        secondaryID,
        title,
        date,
        address,
        info,
        priceLabel1,
        priceLabel2,
        priceLabel3,
        priceLabel4,
        price1,
        price2,
        price3,
        price4
    })
    workshop.save()
        .then(() => res.json({ message: 'Workshop saved' }))
        .catch(err => res.send(err))
})

app.delete("/admin/workshop/:id", async (req, res) => {
    const id = req.params.id
    try {
        await Workshop.findOneAndDelete({ secondaryID: id })
        res.send({})
    } catch (err) {
        res.send(err)
    }
})

// ERROR HANDLER
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message || err })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
