import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

const subscribe = Meteor.subscribe;
const _ignoredSubIds = [];
const _subsReady = new ReactiveVar(false);

const calculateSubs = () => {
    for (const subId of Object.keys(Meteor.connection._subscriptions)) {
        if (_ignoredSubIds.indexOf(subId) !== -1)
            continue;

        const sub = Meteor.connection._subscriptions[subId];
        if (!sub.ready) {
            // bail out
            _subsReady.set(false);
            return;
        }
    }

    _subsReady.set(true);
};

let debouncedCalculateSubs;

const setUpdateTimeout = (timeout) => {
    debouncedCalculateSubs = _.debounce(calculateSubs, timeout, false);
};
setUpdateTimeout(0);

const noop = () => {};
const extractSubscribeCallbacks = (subscribeArgs) => {
    const lastParam = subscribeArgs[subscribeArgs.length - 1];
    const param = lastParam || {};

    // remove passed callbacks from the args object
    if (lastParam &&
        (_.isFunction(lastParam) ||
        _.any([lastParam.onReady, lastParam.onError, lastParam.onStop], _.isFunction))
    ) {
        subscribeArgs.pop();
    }

    return {
        onError: param.onError || param.onStop || noop,
        onReady: _.isFunction(param)
            ? param
            : param.onReady || noop,
        onStop: param.onStop || noop,
    };
};

Meteor.subscribe = (publicationName, ...args) => {
    const lastParam = args[args.length - 1] || {};
    const callbacks = extractSubscribeCallbacks(args);
    const oldSubIds = Object.keys(Meteor.connection._subscriptions);

    const handle = subscribe(publicationName, ...args, {
        onReady() {
            debouncedCalculateSubs();
            callbacks.onReady();
        },

        onStop(error) {
            debouncedCalculateSubs();

            if (error) {
                callbacks.onError(error);
            } else {
                callbacks.onStop();
            }
        },
    });

    if (oldSubIds.indexOf(handle.subscriptionId) === -1) {
        // this is a new subscription
        _subsReady.set(false);
    }

    return handle;
};

const allSubsReady = () => _subsReady.get();

const subscribeUntracked = (publicationName, ...args) => {
    const callbacks = extractSubscribeCallbacks(args);

    // wrap onStop so that the sub id gets removed from _ignoredSubIds
    const onStop = callbacks.onStop;
    callbacks.onStop = function(...args) {
        const index = _ignoredSubIds.indexOf(this.id);
        if (index >= 0) {
            _ignoredSubIds.splice(index, 1);
        }

        onStop(...args);
    };

    const handle = subscribe(publicationName, ...args);
    _ignoredSubIds.push(handle.subscriptionId);

    return handle;
};

export {
    allSubsReady,
    setUpdateTimeout,
    subscribeUntracked,
};
