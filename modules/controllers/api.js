var SettingsService = require('../modules/settings-service.js');
var CacheService = require('../modules/cache-service.js');

module.exports = function (app) {
    var cacheService = new CacheService(app);
    var settingsService = new SettingsService(app, cacheService);

    app.get('/api/settings', function (req, res) {
        var attributes = [];
        var appName = req.headers['app'];
        var deviceId = req.headers['deviceid'];
        for (var k in req.headers) {
            if (req.headers.hasOwnProperty(k) && req.headers[k]) {
                attributes.push({
                    "name": k,
                    "value": req.headers[k]
                });
            }
        }

        settingsService
            .getDeviceSettings(appName, deviceId, attributes)
            .then(function (settings) {
                settings['status'] = 'success';
                res.send(settings);
            })
            .catch(function (error) {
                console.error('ERROR ' + error.message + " " + error.stack);
                res.status(500).send({
                    'status': 'error',
                    'message': error && error.message ? error.message : "Something went wrong"
                });
            });
    });
}