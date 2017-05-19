var Promise = require('bluebird');
var request = require('request');

module.exports = SettingsService;

function SettingsService(app, cacheService) {
    this.getDeviceSettings = getSettings;
    this.getSegmentsAndExperiments = getSegmentsAndExperiments;
    this.getAppSegmentsAndExperiments = getAppSegmentsAndExperiments;
    this.getSetting = getSetting;
    this.updateSetting = updateSetting;
    this.createSetting = createSetting;
    this.removeSetting = removeSetting;

    if (cacheService) {
        cacheService.registerExpirationHandler('settings:*', function (expiredKey) {
            return new Promise(function (resolve, reject) {
                app.db1.settings.findOne({'app': expiredKey.split(':')[1]}, function (err, doc) {
                    if (err) {
                        return reject(err);
                    }
                    cacheService.setObject(expiredKey, doc, 120);
                    return resolve(doc);
                })
            })
        });
    }

    function settingsGenerator (segmentsAndExperiments, doc) {
        var settingData = doc.data;
        var segments = segmentsAndExperiments.segmentIds;
        var experiments = segmentsAndExperiments.experiments;
        var experimentVariants = {};
        for(var k in experiments) {
            if(experiments.hasOwnProperty(k)) {
                experimentVariants[experiments[k].name] = experiments[k].variant;
            }
        }

        var settings = {};

        for (var prop in settingData) {
            if (settingData.hasOwnProperty(prop)) {
                var experiment_value = settingData[prop].experiment_value;
                if(experiment_value) {
                    for(var i = experiment_value.length - 1; i >= 0; --i) {
                        var experimentSettingObject = experiment_value[i];
                        var experimentVariant = experimentVariants[experimentSettingObject.experiment_uid];
                        if(experimentVariant) {
                            var variantValues = experimentSettingObject.values;
                            for(var e_idx = 0; e_idx < variantValues.length; e_idx++) {
                                if(variantValues[e_idx].name == experimentVariant) {
                                    settings[prop] = variantValues[e_idx].value;
                                }
                            }
                            if(settings[prop]) {
                                break;
                            }
                        }
                    }
                }

                if(!settings[prop]) {
                    var segment_value = settingData[prop].segement_value;
                    for (i = segment_value.length - 1; i >= 0; --i) {
                        var segmentSettingObject = segment_value[i];
                        if (segments.indexOf(segmentSettingObject.segment_uid) > -1) {
                            settings[prop] = segmentSettingObject.value;
                            break;
                        }
                    }
                }
            }
        }

        settings['segments'] = segmentsAndExperiments.segmentIds;
        settings['experiments'] = segmentsAndExperiments.experiments;

        return settings;
    }

    function getSettings (appID, deviceid, attributes) {
        if(!appID) {
            return Promise.reject(new Error('Application ID is not specified'));
        }

        return new Promise(function (resolve, reject) {
            getSegmentsAndExperiments(deviceid, attributes)
            .then(function (segmentsAndExperiments) {
                return cacheService.getObject('settings:' + appID)
                    .then(function(doc) {
                        if(!doc) {
                            return resolve({});
                        }
                        return resolve(settingsGenerator(segmentsAndExperiments, doc));
                    })
            }).catch(function (err) {
                return reject(err);
            });
        })

    }

    function getSegmentsAndExperiments (deviceid, attributes) {
        if(!deviceid) {
            return Promise.reject(new Error('deviceId is not specified'));
        }

        return new Promise(function (resolve, reject) {
            request.post({
                url: app.segmentationService + '/segmentation/devices/' + deviceid + '/resolve/',
                json: true,
                timeout:2000,
                body: {
                    "attributes": attributes
                }
            }, function(e, r, json) {
                if(e) {
                    console.error(e);
                    return reject(new Error('Segmentation service error ' + e));
                }

                if (!json || !json.segments || !json.segments.length) {
                    console.error('Couldn\'t retrieve segments', json);
                    return reject(new Error('Segmentation service error, Invalid response'));
                }

                var segments = [], segmentIds = [];
                json.segments.forEach(function (s) {
                    segments.push(s.description);
                    segmentIds.push(s.id);
                });

                var experiments = [];
                if(json.experimentVariants) {
                    json.experimentVariants.forEach(function (el) {
                        if (el && el !== null) {
                            experiments.push({name: el.experimentId, variant: el.code});
                        }
                    })
                }

                return resolve({
                    segments: segments || [],
                    segmentIds: segmentIds || [],
                    experiments: experiments || []
                });
            })
        })

    }

    /**
     * Admin
     * Get settings, segments2, experiments
     *
     * @returns {new Promise}
     */
    function getAppSegmentsAndExperiments() {
        return Promise.all([
            app.db1.settings.distinct('app'),
            app.db1.segments2.find(),
            app.db1.experiments.find()
        ]).then(function (data) {
            return new Promise(function (resolve, reject) {
                resolve({
                    apps: data[0] || [],
                    segments: data[1] || [],
                    experiments: data[2] || []
                });
            });
        });
    }

    /**
     * Admin
     * Get settings, segments2, experiments
     *
     * @param object
     * @returns {new Promise}
     */
    function getSetting(params) {
        return new Promise(function (resolve, reject) {
            app.db1.settings.findOne(params || {})
                .exec(function (err, doc) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(doc);
                });
        });
    }

    /**
     * Admin
     * Update settings
     *
     * @param {Object}
     * @returns {new Promise}
     */
    function updateSetting(params) {
        return new Promise(function (resolve, reject) {
            app.db1.settings.findOne(params.query || {})
                .exec(function (err, doc) {
                    doc.app = params.app;

                    var old_data = doc.data;

                    doc.data = JSON.parse(params.data || '{}') || {};

                    doc.markModified('data');
                    doc.save(function (err, doc) {
                        if (err) {
                            return reject(err);
                        }

                        resolve({ 
                            settings: doc, 
                            old_data: old_data
                         });
                    });
                });
        });
    }

    /**
     * Admin
     * Create settings
     *
     * @param {Object}
     * @returns {new Promise}
     */
    function createSetting(params) {
        return new Promise(function (resolve, reject) {
            var setting = new app.db1.settings();
            setting.app = params.app;
            setting.data = JSON.parse(params.data || '{}') || {};

            setting.markModified('data');
            setting.save(function (err, doc) {
                if (err) {
                    return reject(err);
                }

                resolve(doc);
            });
        });
    }

    /**
     * Admin
     * Remove setting
     *
     * @param params
     * @returns {new Promise}
     */
    function removeSetting(id) {
        return new Promise(function (resolve, reject) {
            if (!id) {
                return reject(new Error('Id is not passed'));
            }

            app.db1.settings.findOne({_id: id}).exec(function (err, doc) {
                if (err) {
                    return reject(err);
                }

                if (!doc) {
                    return reject(new Error('Setting not found'));
                }

                doc.remove(function (err, doc) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(doc);
                });
            });
        });
    }
}
