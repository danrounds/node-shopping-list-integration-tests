const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

// lets us use THING.should.equal(CORRECT_ANSWER) idiom
const should = chai.should();

// This is what lets us do HTTP request testing
chai.use(chaiHttp);

describe('Recipes', function() {

    // activate server
    before(function() {
        return runServer();
    });

    // post-test close our server
    after(function() {
        return closeServer();
    });

    const expectedKeys = ['id', 'name', 'ingredients'];

    // GET request test -- strategy:
    //  1. make GET request
    //  2. inspect response to see if it has the right status and  keys
    it('should list recipes on GET', function() {
        // here we return the promise generated by 
        return chai.request(app)
            .get('/recipes')
            .then(function(res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');

                res.body.length.should.be.at.least(1);

                res.body.forEach(function(item) {
                    item.should.be.a('object');
                    item.should.include.keys(expectedKeys);
                });
            });
    });

    // POST request test -- strategy:
    //  1. make POST request with data for a new recipe entry
    //  2. examine response for status, correct keys, and that return JSON has
    //     a key
    it('should add an item on POST', function() {
        const newRecipe = {name: 'creamed corn', ingredients: ['cream', 'corn', 'salt']};
        return chai.request(app)
            .post('/recipes')
            .send(newRecipe)
            .then(function(res) {
                res.should.have.status(201);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.include.keys(expectedKeys);
                res.body.id.should.not.be.null;
                // `res.body' should be identical to `newRecipe', once we add
                // the relevant `id' to `newRecipe'  \/
                res.body.should.deep.equal(Object.assign(newRecipe, {id: res.body.id}));
            });
    });

    // PUT request test -- strategy:
    //  1. make a GET request, so we can get an item to update (the 0th item
    //     returned)
    //  2. add GET's `res.body[0].id' to `updateData'
    //  3. make the PUT request with our completed `updateData'
    //  4. inspect the response for status code and to make sure PUT's res.body
    //     is identical to `updateData'
    it('should update items on PUT', function() {
        const updateData = {
            name: 'test',
            ingredients: ['array', 'of', 'stuff']
        };
        return chai.request(app)
            .get('/recipes')
            .then(function(res) {
                updateData.id = res.body[0].id;
                return chai.request(app)
                    .put(`/recipes/${updateData.id}`)
                    .send(updateData);
            })
            .then(function(res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                // PUT's res.body needs to be identical to `updateData'
                res.body.should.deep.equal(updateData);
            });
    });

    // DELETE request test -- strategy:
    //  1. make a GET request, so we can get the `id' of an item to delete
    //     (0th item's `id')
    //  2. make DELETE request, with the relevant `id' as the resource, and
    //     check that status is 204
    it('should delete items on DELETE', function() {
        return chai.request(app)
            .get('/recipes')
            .then(function(res) {
                return chai.request(app)
                    .delete(`/recipes/${res.body[0].id}`);
            })
            .then(function(res) {
                res.should.have.status(204);
            });
    });
});
