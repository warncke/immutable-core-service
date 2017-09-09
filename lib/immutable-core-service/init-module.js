'use strict'

/* npm modules */
const ImmutableCore = require('immutable-core')

/* exports */
module.exports = initModule

/**
 * @function initModule
 *
 * create ImmutableCore module and methods
 *
 * @param {object} args
 *
 * @throws {Error}
 */
function initModule (args) {
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
}