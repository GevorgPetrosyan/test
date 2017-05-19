var mongoose = require('mongoose');
var Promise = require('bluebird');


var cdn15 = mongoose.createConnection('mongodb://' + (process.env.CDN15 || '173.244.201.98:27017') + '/CDN');
app.cdn15 = gridfs(cdn15.db, mongoose.mongo);
var cdn16 = mongoose.createConnection('mongodb://' + (process.env.CDN16 || '173.244.201.102:27017') + '/CDN');
app.cdn16 = gridfs(cdn16.db, mongoose.mongo);
var cdn17 = mongoose.createConnection('mongodb://' + (process.env.CDN17 || '173.244.201.99:27017') + '/CDN');
app.cdn17 = gridfs(cdn17.db, mongoose.mongo);

var cdn18 = mongoose.createConnection('mongodb://' + (process.env.CDN18 || '173.244.201.98:27017') + '/CDN');
app.cdn18 = gridfs(cdn18.db, mongoose.mongo);
var cdn19 = mongoose.createConnection('mongodb://' + (process.env.CDN19 || '173.244.201.102:27017') + '/CDN');
app.cdn19 = gridfs(cdn19.db, mongoose.mongo);

require('./models/settings');
require('./models/segments2');
require('./models/experiments');
process.on('uncaughtException', function (err) {
    console.log('ERROR: ', {
        error_type: 'exception',
        error_message: err.message || err,
        stack: err.stack
    });
    app.log({
        error_type: 'exception',
        error_message: err.message || err,
        stack: err.stack
    });
});
if (process.env.NODE_ENV == 'production') {
    app.settings.port = parseInt(process.env.NODE_PORT || 3001);
    app.settings.domain = 'picsart.com';
    app.settings.cdn = 'http://cdn.picsart.com';
    app.settings.root_path = process.env.ROOT_PATH || "";
    app.settings.protocol = "https://";
    mongoose.app = app;
    app.locals.app = app;
    app.locals.segments = {
        CATCH_ALL : '4d7aaf27-e8c8-4f98-ab14-77630c64285e'
    };
    app.locals.segments.DEFAULTS = [app.locals.segments.CATCH_ALL];
    app.locals.PA_USER_ID = 68538451;

    // MongoDB
    var opts = {
        replset: {
            strategy: 'ping',
            readSecondary: true,
            socketOptions: {
                keepAlive: 1
            }
        },
        server: {
            readPreference: 'secondary',
            auto_reconnect: true,
            socketOptions: {
                keepAlive: 1
            }
        },
        db: {readPreference: 'secondaryPreferred'}
    };

    var mongoConnectionString1 = 'mongodb://' + (process.env.MONGO1_CONNECTION_STRING || '10.40.51.101:27017,10.86.108.33:27017,10.62.105.250:27017') + '/PICSART';
    var mongoNotifications = 'mongodb://' + (process.env.MONGO_NOTIFICATIONS_CON_STRING || '169.45.9.227:27017/PICSART');
    var dbEditorConString = 'mongodb://' + (process.env.MONGO_DBEDITOR_CON_STRING || '173.244.209.99:27018') + '/PICSART';

    mongoose.Promise = Promise;
    var db1 = mongoose.createConnection(mongoConnectionString1, opts);
    var dbNotifications = mongoose.createConnection(mongoNotifications, opts);
    var dbEditor = mongoose.createConnection(dbEditorConString, opts);
    //var cdn6 = mongoose.createConnection('mongodb://' + (process.env.CDN6 || '10.86.108.104:27017') + '/CDN');
    //app.cdn6 = gridfs(cdn6.db, mongoose.mongo);



    app.connection1 = db1;
    app.db1 = {
        settings: db1.model('settings'),
        segments2: db1.model('segments2'),
        experiments: db1.model('experiments'),
    };

    app.segmentationService = 'http://' + (process.env.SEGMENTATION_SERVICE || '75.126.5.130');

}
require('./controllers/api')(app);