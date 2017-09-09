'use strict'

/* npm modules */
const chai = require('chai')
const sinon = require('sinon')

/* application modules */
const ImmutableCoreService = require('../lib/immutable-core-service')

/* chai config */
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core-service', function () {

    var sandbox

    beforeEach(function () {
        // clear global data
        ImmutableCoreService.reset()
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        // reset stubs
        sandbox.restore()
    })

    it('should initialize new service', async function () {
        // create stubs
        var fooStub = sandbox.stub().resolves()
        var initializeStub = sandbox.stub().resolves({foo: true})
        // create new instance
        var fooService = new ImmutableCoreService({
            initialize: initializeStub,
            name: 'foo',
            methods: {
                foo: fooStub,
            },
            reinitializeInterval: 2,
        })
        // wait for all initialize functions to complete
        await ImmutableCoreService.initializeAll()
        // check that initialize called
        assert.calledOnce(initializeStub)
        // check that initialize data set
        assert.deepEqual(fooService.data, {foo: true})
        // check that data id set
        assert.strictEqual(fooService.dataId, '')
        fooService.data.foo = false
        // check that data is immutable
        assert.throws(function () {
            fooService.data.foo = false
        })
    })

})