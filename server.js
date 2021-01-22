require('dotenv').config()

// HTTPS configuration
const express = require('express')
const https = require('https');
const app = express()
const fs = require('fs');
const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');
const server = https.createServer({
	key: key,
	cert: cert
}, app);
server.listen(443, () => {
	console.log('listening on 443')
});

// Socket configuration
const io = require('socket.io').listen(server);

// JWT configuration
const jwt = require('jsonwebtoken')


// Setting render engine to EJS
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(express.urlencoded({
	extended: true
}))


// Peer server configuration. Works on port 3000
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use('/peerjs', peerServer);

// MongoDB configuration
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Room = require('./models/room');
mongoose.connect('mongodb+srv://may:marcin.piotrowski01@talk-to-me.80a59.mongodb.net/<dbname>?retryWrites=true&w=majority', {
	useNewUrlParser: true,
	useUnifiedTopology: true
})


/*
    Defining server behaviour
                                */

// Render 'menu' view
app.get('/', (req, res) => {
	res.render('menu');
})

// Creating room
app.post('/rooms/create', async(req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10)
		const room = new Room({
			_id: new mongoose.Types.ObjectId(),
			name: req.body.name,
			password: hashedPassword
		})
		room.save().then(result => {
			res.status(201)
			res.render('room', {
				roomId: room._id
			})
		}).catch(err => console.log(err))
	} catch {
		res.status(500).send()
	}
})

// Joining room
app.post('/rooms/join', genToken, (req, res) => {
	const token = req.body
	if (!token) res.sendStatus(401)
	jwt.verify(token, process.env.ACCESS_TOKEN, (err, room) => {
		if (err) res.sendStatus(403)
		res.render('room', {
			roomId: room._id
		})
	})
})

// Generating JWT in order to authenticate user
function genToken(req, res, next) {
	const id = req.body._id
	const pass = req.body.password
	console.log('id ' + id)
	Room.findById(id)
		.exec()
		.then(async doc => {
			if (doc == null) {
				return res.status(400).send('Cannot find room');
			} else {
				try {
					if (await bcrypt.compare(pass, doc['password'])) {
						const room = {
							_id: doc['_id']
						}
						const accesToken = jwt.sign(room, process.env.ACCESS_TOKEN)
						req.body = accesToken
						next()
					} else {
						res.send('Not allowed')
					}
				} catch {}
			}
		}).catch(err => {
			console.log(err)
		})
}


// Socket behaviour on basic user activities.
io.on('connection', socket => {
	socket.on('join-room', (roomId, userId) => {
		socket.join(roomId)
		socket.to(roomId).broadcast.emit('user-connected', userId)

		socket.on('message', (msg) => {
			socket.to(roomId).broadcast.emit('message', msg)
		})

		socket.on('disconnect', () => {
			socket.to(roomId).broadcast.emit('user-disconnected', userId)
		})
	})
})