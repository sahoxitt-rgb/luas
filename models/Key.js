const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true },
    keyId: { type: String, required: true, unique: true }, // HWID sıfırlamak için özel ID
    type: { type: String, enum: ['free', 'premium'], required: true },
    username: { type: String },
    password: { type: String },
    hwid: { type: String, default: null },
    isUsed: { type: Boolean, default: false },
    createdBy: { type: String },
    createdById: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Key', keySchema);