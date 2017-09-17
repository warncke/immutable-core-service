'use strict'

/* npm modules */
const ImmutableCore = require('immutable-core')
const Promise = require('bluebird')
const _ = require('lodash')
const defined = require('if-defined')

/* exports */
module.exports = ImmutableCoreService

/**
 * @function ImmutableCoreService
 *
 * create new service
 *
 * @param {object} args
 *
 * @returns {ImmutableCoreService}
 *
 * @throws {Error}
 */
function ImmutableCoreService (args) {
    // require valid args
    this.assert(typeof args === 'object', 'args must be object')
    // require name for service
    this.assert(typeof args.name === 'string', 'name required')
    // set service name
    this.name = args.name
    // build module name from name
    this.moduleName = `${this.name}Service`
    // instantiate module - will throw error if name already defined
    this.module = ImmutableCore.module(this.moduleName, {})
    // require initialize function
    this.assert(typeof args.initialize === 'function', 'initialize function required')
    // create initialize method
    this.module.method('initialize', args.initialize)
    // make sure service not already registered
    this.assert(!this.hasService(this.name), 'service ${this.name} already registered')
    // add service to global register
    this.getServices()[this.name] = this
    // add any additional methods
    _.each(args.methods, (method, methodName) => {
        // add immutable method to service
        this[methodName] = this.module.method(methodName, method)
    })
    // if reinitialize interval is set then validate
    if (defined(args.reinitializeInterval)) {
        // validate
        this.assert(!Number.isNaN(parseInt(args.reinitializeInterval)), 'reinitializeInterval must be integer')
        // set value
        this.reinitializeInterval = parseInt(args.reinitializeInterval)
    }
    // default to 0 - do not reinitialize
    else {
        this.reinitializeInterval = 0
    }
}

/* public methods */
ImmutableCoreService.prototype = {
    assert: assert,
    error: error,
    getData: getData,
    getDataId: getDataId,
    getGlobal: getGlobal,
    getService: getService,
    getServices: getServices,
    hasService: hasService,
    // class properties
    class: 'ImmutableCoreService',
    ImmutableCoreService: true,
}

/* static methods */
ImmutableCoreService.assert
ImmutableCoreService.error
ImmutableCoreService.getGlobal = getGlobal
ImmutableCoreService.getService = getService
ImmutableCoreService.getServices = getServices
ImmutableCoreService.getTimeSeconds = getTimeSeconds
ImmutableCoreService.hasService = hasService
ImmutableCoreService.initializeAll = initializeAll
ImmutableCoreService.reinitializeCheck = reinitializeCheck
ImmutableCoreService.reinitializeStart = reinitializeStart
ImmutableCoreService.reinitializeStop = reinitializeStop
ImmutableCoreService.reset = reset

/**
 * @function assert
 *
 * throw error if value is not true
 *
 * @param {boolean} assertValue
 * @param {string} message
 * @param {Error|undefined} error
 *
 * @throws {Error}
 */
function assert (assertValue, message, err) {
    if (!assertValue) {
        throw defined(this) ? this.error(message, err) : error(message, err)
    }
}

/**
 * @function error
 *
 * create/update error object with query data
 *
 * @param {string} message
 * @param {Error|undefined} error
 *
 * @returns {Error}
 */
function error (message, error) {
    // make sure message is string
    if (typeof message === 'string') {
        message = ': ' + message
    }
    else {
        message = ''
    }
    // set class and instance info for message
    if (defined(this) && defined(this.name)) {
        message = 'ImmutableCoreService.'+this.name+' error'+message
    }
    else {
        message = 'ImmutableCoreService error'+message
    }
    // use error object passed in
    if (defined(error)) {
        // create data object with original message
        error.data = {
            error: {
                code: error.code,
                message: error.message,
            },
        }
    }
    // create new error message
    else {
        error = new Error(message)
        error.data = {}
    }

    return error
}

/**
 * @function getData
 *
 * return service data
 *
 * @returns {object}
 */
function getData () {
    return this.module.meta.data
}

/**
 * @function getDataId
 *
 * return service data id
 *
 * @returns {object}
 */
function getDataId () {
    return this.module.meta.dataId
}

/**
 * @function getGlobal
 *
 * return global data - initialize of not defined
 *
 * @returns {object}
 */
function getGlobal () {
    // return global data if defined
    if (defined(global.__immutable_core_service__)) {
        return global.__immutable_core_service__   
    }
    // initialize global data
    var GLOBAL = global.__immutable_core_service__ = {
        services: {}
    }
    // return global data
    return GLOBAL
}

/**
 * @function getService
 *
 * get a service by name - throws error if name not defined
 *
 * @param {string} name
 *
 * @returns {ImmutableCoreService}
 *
 * @throws {Error}
 */
function getService (name) {
    // get service from global register
    var service = getGlobal().services[name]
    // require service to be defined
    assert(defined(service), `service ${name} not defined`)
    // return service
    return service
}

/**
 * @function getServices
 *
 * get global services register
 *
 * @returns {object}
 */
function getServices () {
    // return global services register
    return getGlobal().services
}

/**
 * @function getTimeSeconds
 *
 * get time in seconds
 *
 * @returns {number}
 */
function getTimeSeconds () {
    return new Date().getTime() / 1000
}

/**
 * @function hasService
 *
 * return true if service identified by name is defined
 *
 * @param {string} name
 *
 * @returns {boolean}
 */
function hasService (name) {
    // return true if service is defined
    return defined(getGlobal().services[name]) ? true : false
}

/**
 * @function initializeAll
 *
 * call initialize methods for all services
 *
 * @returns {Promise}
 */
function initializeAll () {
    // initialize all services
    return servicesAll(initializeService)
    // after all services initialized start the global reinitialize check
    .then(() => {
        reinitializeStart()
    })
}

/**
 * @function initializeService
 *
 * initialize or reinitialize service
 *
 * @param {ImmutableCoreService} service
 *
 * @returns {Promise}
 */
function initializeService (service) {
    // if service is already being initialized then return existing promise
    if (defined(service.initializePromise)) {
        return service.initializePromise
    }
    // if service is already initialized then check if needs reinitialize
    if (defined(service.lastInitialized) && getTimeSeconds() - service.lastInitialized < service.reinitializeInterval) {
        return
    }
    // execute initialize - store promise on service instance
    service.initializePromise = service.module.initialize({
        session: {},
    })
    // set data once initialized
    .then(data => {
        // clear initialize promise so initialize can be retried
        service.initializePromise = undefined
        // set time in seconds that service was initialized
        service.lastInitialized = getTimeSeconds()
        // set data on module
        service.module.meta.data = data
    })
    // catch any errors
    .catch(err => {
        // clear initialize promise so initialize can be retried
        service.initializePromise = undefined
        // log error
        console.error(service.error('initialize error', err))
    })
    // return promise that will be resolved once service initialized
    return service.initializePromise
}

/**
 * @function reinitializeCheck
 *
 * check if any services need to be reinitialized
 *
 * @returns {ImmutableCoreService}
 */
function reinitializeCheck () {
    // initialize all services
    return servicesAll(initializeService)
}

/**
 * @function reinitializeStart
 *
 * start interval check to reinitialize services
 *
 * @returns {ImmutableCoreService}
 */
function reinitializeStart () {
    // clear reinitialize interval if set
    reinitializeStop()
    // set reinitalize check to run every second
    getGlobal().interval = setInterval(reinitializeCheck, 1000)
}

/**
 * @function reinitializeStop
 *
 * stop interval check to reinitialize services
 *
 * @returns {ImmutableCoreService}
 */
function reinitializeStop () {
    // get existing interval
    var interval = getGlobal().interval
    // clear interval if defined
    if (defined(interval)) {
        clearInterval(interval)
    }
}

/**
 * @function reset
 *
 * clear global data
 *
 * @returns {ImmutableCoreService}
 */
function reset () {
    // clear reinitialize interval if set
    reinitializeStop()
    // clear global data
    global.__immutable_core_service__ = undefined
    // reinitialize global data
    getGlobal()
    // return class
    return ImmutableCoreService
}

/**
 * @function servicesAll
 *
 * call callback function for each service - return promise that will be
 * resolved once all callbacks resolve
 *
 * @param {function} callback
 *
 * @returns {Promise}
 *
 * @throws {Error}
 */
function servicesAll (callback) {
    // callback must be a function
    assert(typeof callback === 'function', 'servicesAll callback must be function')
    // call callback for each service
    return Promise.all(_.map(_.keys(getServices()), name => {
        // get service
        var service = getService(name)
        // call callback and return promise
        return callback(service)
    }))
}