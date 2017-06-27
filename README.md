# aplc:subsready

Meteor exposes a `DDP._allSubscriptionsReady` method, but it does not run reactively. This package wraps `Meteor.subscribe` and exposes a `allSubsReady` method which will return whether or not all of your subscriptions are ready.

A use case for this package is to display a progress bar (such as [NProgress](https://github.com/rstacruz/nprogress)) when your app is fetching data.

**Note**: Only subscriptions to your app will be checked by this package. If you are e.g. connecting to a secondary DDP server, then those subscriptions will be ignored.

## Usage

### Installation

```
$ meteor add aplc:subsready
```

### Usage with `react-meteor-data`

```js
import { allSubsReady } from 'meteor/aplc:subsready';

const MyComponent = ({ loading, ...rest }) => {
    // ...
};

export default createContainer(
    () => ({ loading: !allSubsReady() }),
    MyComponent
);
```

### Ignoring certain subscriptions

```js
import { subscribeUntracked } from 'meteor/aplc:subsready';

// used the same way as Meteor.subscribe
// allSubsReady() will ignore this subscription's status
subscribeUntracked(/* ... */);
```

## Configuration

By default, `allSubsReady` will update right away when a new subscription is created, or when an existing subscription is marked as ready. Depending on your use case, this behavior may not be what you desire. You can change this via the `setUpdateTimeout(timeout)` function, which will prevent `allSubsReady` transitioning from `false` to `true` before `timeout` milliseconds have elapsed since the last subscription finished.

### Example

```js
import {
    allSubsReady,
    setUpdateTimeout,
} from 'meteor/aplc:subsready';

// set a 500ms timeout
setUpdateTimeout(500);

const log = (...msg) => {
    const now = new Date();
    console.log(`[${now.getSeconds()}.${now.getMilliseconds()}]:`, ...msg);
}

Tracker.autorun(() => log('are all subs ready?', allSubsReady()));

// allSubsReady() will now return false
log('subscribing to pub1...');
Meteor.subscribe('pub1', () => log('pub1 has loaded'));
```

The output of the above will look something like:

```
[6.167]: are all subs ready? true
[6.167]: subscribing to pub1...
[6.169]: are all subs ready? false
[6.203]: pub1 has loaded
[6.704]: are all subs ready? true
```

Note that the function supplied to `Tracker.autorun` was rerun as soon as the call to `Meteor.subscribe` was made, but then was only rerun again 500ms after the subscription fetched its data.