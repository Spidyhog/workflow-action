const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongoose');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());     //Parsing the body as JSON
app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, application/json');
    next();
})


app.use('/api/v1', require('./routes'));       //API routes
const PORT = process.env.PORT || 3000;

var url = process.env.DB_URI; // add your mongoDB URL

mongodb.connect(url, { useUnifiedTopology: true, useNewUrlParser: true })
.then(s => console.log('Connected to DB'))
.catch(err => console.error(err))

app.listen(PORT, (success, err) => {
    if(err) console.log(err);
    else console.log(`listening on PORT ${PORT}`);
})