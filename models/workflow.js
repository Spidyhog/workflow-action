const mongoose = require('mongoose');

const workflowSchema = mongoose.Schema({
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'level',
        unique: true,
        required: true
    },
    levels: []
})

module.exports = mongoose.model('workflow', workflowSchema);