export class SubscriptionSet {
    constructor(subscriptions = new Set()) {
        this.subscriptions = subscriptions;
    }
    get size() {
        return this.subscriptions.size;
    }
    add(subscription) {
        subscription.add(() => {
            this.subscriptions.delete(subscription);
        });
        this.subscriptions.add(subscription);
    }
    unsubscribe() {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }
}
//# sourceMappingURL=subscription-set.js.map