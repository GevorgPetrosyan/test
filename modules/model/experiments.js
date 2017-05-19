var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Variant = new Schema({
    code: {type: String, required: true}
});

var Experiments = new Schema({
    name: {type: String, required: true},
    description: {type: String},
    created: {type: Date, default: Date.now},
    updated: {type: Date},
    uuid: {type: String, required: true, index: {unique: true}},
    app: {type: String, required: true},
    percentage: {type: Number, default: 5},
    segment: {
        name: {type: String},
        uuid: {type: String},
        oid: {type: String}
    },
    variants: [{
        code: {type: String}
    }]
});

Experiments.pre('save', function (next) {
    this.updated = Date.now();

    next();
});


module.exports = mongoose.model('experiments', Experiments);
