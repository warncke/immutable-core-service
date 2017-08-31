# immutable-core-service

Immutable Core Service integrates with the
[Immutable App](https://www.npmjs.com/package/immutable-app) ecosystem to
provide persistent global services backed by shared immutable data state that
can be reinitialized on a periodic basis.

Immutable Core Service is designed to support use cases like app configuration
and access control that use data from
[Immutable Core Models](https://www.npmjs.com/package/immutable-core-model)
but that data does not change from one request to the next.

Immutable Core Service requires native async/await support.

## Creating a new service

    var fooService = new ImmutableCoreService({
        name: 'foo',
        methods: {
            foo: function (args) { ... },
        },
        initialize: function (args) { .. },
        reinitializeInterval: 10,
    })

In this example a service named `foo` is defined with a single `foo` method.

This will create an
[Immutable Core](https://www.npmjs.com/package/immutable-core) module with the
module name `fooService` and two methods: `foo` and `initialize`.

The `initialize` method is called once when the service is first created and is
then called at an interval defined by `reinitializeInterval` which is in
seconds.

The data object returned by `initialize` will become the shared state for the
service.

