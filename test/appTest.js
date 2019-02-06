const request = require('supertest');
const { app } = require('../src/app');

describe('GET /', function () {
	it('responds with status code 200 and content type text/html', function (done) {
		request(app).get('/').expect(200).end(done);
	})
})