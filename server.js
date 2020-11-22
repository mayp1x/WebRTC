require('dotenv').config()

const { response } = require('express');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Room = require('./models/room');
const e = require('express');
const { render } = require('ejs');


app.use(express.json())
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({
    extended: true
}))



mongoose.connect('mongodb+srv://may:marcin.piotrowski01@talk-to-me.80a59.mongodb.net/<dbname>?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})


const rooms = []

app.get('/rooms', (req, res) => {
    res.json(rooms)
})

app.post('/rooms/create', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const room = new Room({ _id: new mongoose.Types.ObjectId(), name: req.body.name, password: hashedPassword })
        room.save().then(result => {
        res.status(201)
        res.redirect(`/${room.id}&${room.name}`)
        }).catch(err => console.log(err))
    }
    catch {
        res.status(500).send()
    }
})

app.get('/', (req, res) => {
    res.render('menu');
})

app.post('/rooms/join', genToken, (req, res) => {
    const token = req.body
    if (!token) res.sendStatus(401)
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, room) => {
        if (err) res.sendStatus(403)
        res.render('room', {roomId: room._id})
    })
})


app.get('/:id', auth, (req, res) => {
    if(req.room._id === req.params.id){
        res.render('room', { roomId: req.params.id});
    }
    else{
        res.redirect('/')
    }
})

function auth (req, res, next) {
    const token = req.body
    
}

function genToken (req, res, next) {
    const id = req.body._id
    const pass = req.body.password
    console.log('id ' + id)
    Room.findById(id)
        .exec()
        .then(async doc => {
            if (doc == null) {
                return res.status(400).send('Cannot find room');
            }else{
                try {
                    if (await bcrypt.compare(pass, doc['password'])) {
                        const room = { _id : doc['_id'] }
                        const accesToken = jwt.sign(room, process.env.ACCESS_TOKEN)
                        req.body = accesToken
                        next()
                    }
                    else {
                        res.send('Not allowed')
                    }
                }
                catch{
                }
            }
        }).catch(err => {
            console.log(err)
        })
}

server.listen(3030);