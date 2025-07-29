const STATE = Object.freeze({
	PENDING: 'pending',
	FULFILLED: 'fulfilled',
	REJECTED: 'rejected',
});

class MyPromise {
	/** @type {typeof STATE[keyof typeof STATE]} */
	#state = STATE.PENDING;
	#result = void 0;
	#thenables = [];
	#catchables = [];

	#changeState(state, value, cb) {
		if (this.#state !== STATE.PENDING) {
			return;
		}
		this.#state = state;
		this.#result = value;
		cb();
	}

	#resolve(e) {
		this.#changeState(STATE.FULFILLED, e, () => {
			this.#thenables.splice(0).forEach(({ cb, resolve, reject }) => {
				this.#useCallback(cb, resolve, reject);
			});
		});
	}

	#reject(e) {
		this.#changeState(STATE.REJECTED, e, () => {
			this.#catchables.splice(0).forEach(({ cb, resolve, reject }) => {
				this.#useCallback(cb, resolve, reject);
			});
		});
	}

	#useCallback(cb, resolve, reject) {
		Promise.resolve().then(async () => {
			try {
				const result = await cb(this.#result);
				if (typeof result?.then === 'function') {
					result.then(resolve, reject);
				} else {
					resolve(result);
				}
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @param {typeof STATE[keyof typeof STATE]} state
	 */
	#thenable(cb, resolve, reject, state) {
		if (this.#state === STATE.PENDING) {
			const ables =
				state === STATE.FULFILLED ? this.#thenables : this.#catchables;
			ables.push({ cb, resolve, reject });
		} else if (state === this.#state) {
			this.#useCallback(cb, resolve, reject);
		}
	}

	/**
	 * @param {(resolve: Function, reject: Function) => any} fn
	 */
	constructor(executor) {
		this.#state = STATE.PENDING;
		try {
			executor(this.#resolve.bind(this), this.#reject.bind(this));
		} catch (error) {
			this.#reject(error);
		}
	}

	#use(cb, resolve, reject, state) {
		if (typeof cb === 'function') {
			this.#thenable(cb, resolve, reject, state);
		} else {
			const settled = state === STATE.FULFILLED ? resolve : reject;
			this.#thenable(
				(e) => settled(e),
				resolve,
				reject,
				state
			);
		}
	}

	then(onFulfilled, onRejected) {
		return new MyPromise((resolve, reject) => {
			this.#use(onFulfilled, resolve, reject, STATE.FULFILLED);
			this.#use(onRejected, resolve, reject, STATE.REJECTED);
		});
	}

	catch(onRejected) {
		return new MyPromise((resolve, reject) => {
			this.#use(null, resolve, reject, STATE.FULFILLED);
			this.#use(onRejected, resolve, reject, STATE.REJECTED);
		});
	}

	finally(onFinally) {
		return new MyPromise((resolve, reject) => {
			this.#use(
				async (e) => {
					await onFinally();
					resolve(e);
				},
				resolve,
				reject,
				STATE.FULFILLED,
				true
			);
			this.#use(
				async (e) => {
					await onFinally();
					reject(e);
				},
				resolve,
				reject,
				STATE.REJECTED,
				true
			);
		});
	}
}

module.exports = MyPromise;
