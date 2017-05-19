var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Settings = new Schema({
    app: {type: String, index: true, unique: true},
    type: {type: String, default: "settings"},
    data: {type: {}},
    created: {type: Date, default: Date.now},
    updated: {type: Date}
});

Settings.pre('save', function (next) {
    this.updated = Date.now();

    next();
});

module.exports = mongoose.model('settings', Settings);