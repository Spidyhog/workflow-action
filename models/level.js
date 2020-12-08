const mongoose = require('mongoose');

const levelSchema = mongoose.Schema({
    transaction: {
        type: 'String',
        required: true,
        unique: true
    },
    level: []
})

module.exports = mongoose.model('level', levelSchema);