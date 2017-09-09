'use strict'

/* npm modules */
const ImmutableCore = require('immutable-core')
const Promise = require('bluebird')
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
        ImmutableCore.reset()
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
            reinitializeInterval: 1,
        })
        // wait for all initialize functions to complete
        await ImmutableCoreService.initializeAll()
        // check that initialize called
        assert.calledOnce(initializeStub)
        // check that initialize data set
        assert.deepEqual(fooService.getData(), {foo: true})
        // check that data id set
        assert.strictEqual(fooService.getDataId(), 'ce35fd691fe6c26448191f4528e1ffef')
        // check that data is immutable
        assert.throws(function () {
            fooService.getData().foo = false
        })
        // check that method created
        assert.isFunction(fooService.foo)
        // check that reinitializeInterval set
        assert.strictEqual(fooService.reinitializeInterval, 1)
    })

    it('should reinitialize at defined interval', async function () {
        // set longer timeout to allow reinitialize to run
        this.timeout(4000)
        // create stubs
        var initializeStub = sandbox.stub()
        // first call
        initializeStub.onCall(0).resolves({foo: true})
        // second call
        initializeStub.onCall(1).resolves({foo: false})
        // create new instance
        var fooService = new ImmutableCoreService({
            initialize: initializeStub,
            name: 'foo',
            reinitializeInterval: 1,
        })
        // wait for all initialize functions to complete
        await ImmutableCoreService.initializeAll()
        // check that initialize called
        assert.calledOnce(initializeStub)
        // check that initialize data set
        assert.deepEqual(fooService.getData(), {foo: true})
        // check that data id set
        assert.strictEqual(fooService.getDataId(), 'ce35fd691fe6c26448191f4528e1ffef')
        // wait for reinitialize
        await Promise.delay(1500)
        // initalize should be called again
        assert.calledTwice(initializeStub)
        // data should be updated
        assert.deepEqual(fooService.getData(), {foo: false})
        // data id should be updated
        assert.strictEqual(fooService.getDataId(), '4da787ba25545ca80765298be5676370')
    })

    it('should throw error on missing initialize argument', function () {
        // create new instance - should throw
        assert.throws(() => {
            var fooService = new ImmutableCoreService({
                initialize: undefined,
                name: 'foo',
                reinitializeInterval: 1,
            })
        }, 'initialize function required')
    })

    it('should throw error on invalid initialize argument', function () {
        // create new instance - should throw
        assert.throws(() => {
            var fooService = new ImmutableCoreService({
                initialize: 'initialize',
                name: 'foo',
                reinitializeInterval: 1,
            })
        }, 'initialize function required')
    })

    it('should throw error on invalid initialize reinitializeInterval', function () {
        // create new instance - should throw
        assert.throws(() => {
            var fooService = new ImmutableCoreService({
                initialize: () => {},
                name: 'foo',
                reinitializeInterval: 'test',
            })
        }, 'reinitializeInternal must be integer')
    })

})