/*
    MongoDB Room object schema
                                */

const mongoose = require('mongoose')

const roomSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    password: String
})

module.exports = mongoose.model('Room', roomSchema)