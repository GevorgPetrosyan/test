var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Segments = new Schema({
    name: {type: String, required: true},
    filters: {type: String},
    created: {type: Date, default: Date.now},
    updated: {type: Date},
    uuid: {type: String, required: true, index: {unique: true}},
    description: {type: String},
    order:{type: Number},
    expression:{type: String}
});

Segments.pre('save', function (next) {
    this.updated = Date.now();

    next();
});


module.exports = mongoose.model('segments2', Segments);