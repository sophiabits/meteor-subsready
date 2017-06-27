Package.describe({
    name: 'aplc:subsready',
    version: '1.0.0',
    summary: 'Allows you to reactively check if all subscriptions are ready.',
    git: 'https://github.com/zwjcarter/meteor-subsready',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3');
    api.use([
        'ddp-client',
        'ecmascript',
        'reactive-var',
        'underscore',
    ]);

    api.mainModule('main.client.js', 'client');
});
