const MyPromise = require('./promise.js');

const p = new MyPromise((resolve, reject) => {
	// throw 123;
	setTimeout(() => {
		resolve('success');
		// reject('error');
	}, 1000);
});

console.log(p);

p.then(
	(value) => {
		console.log('fulfilled', value);
		return new MyPromise((resolve, reject) => {
			reject('reject2');
		});
	},
	(err) => {
		console.log('rejected', err);
	}
)
	.then(
		(value) => {
			console.log('fulfilled2', value);
			throw 'success3';
		},
		(err) => {
			console.log('rejected2', err);
			throw 'error3';
		}
	)
	.then(
		(value) => {
			console.log('fulfilled3', value);
		},
		(err) => {
			console.log('rejected3', err);
			throw 'error4';
		}
	)
	.catch((err) => {
		console.log('catch', err);
		return 222;
	})
	.then((res) => {
		console.log('then', res);
		return 222;
	})
	.finally(() => {
		console.log('finally');
		return 333;
	})
	.then((res) => {
		console.log('finally then', res);
	})
	.catch((err) => {
		console.log('finally catch', err);
	});

// async function test() {
// 	const result = await p.catch((err) => {
// 		return err + ' catch';
// 	});
// 	console.log(result);
// }

// test();

// p.then(null, null)
// 	.then((res) => {
// 		console.log(res);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});
