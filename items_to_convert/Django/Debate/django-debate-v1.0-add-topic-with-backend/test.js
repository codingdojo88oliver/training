const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
const $ = global.jQuery = require('jquery')(window);
var superagent = require('superagent');
request = superagent.agent();

var chai = require('chai');  
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

var base_url = "http://localhost:8000";

var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",  
};

var user3 = {
    name: "Brian Buckshank",
    email: "brian@datacompass.com",
    password: "password",
    c_password: "password",
}

// is just user2 login creds
var user5 = {
    email: "jack@tacktheritrix.com",
    password: "password"
};

var user6 = {
    email: "brian@datacompass.com",
    password: "password",
}

describe('(1 pt) Topic and description should be at least 6 characters', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });
    this.timeout(15000);
    it("Topic should be at least 6 characters", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                var $html = jQuery(res.text);
                user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user5)
                .then(res => {
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
                        var $html = jQuery(res.text);
                        var topic = {
                            title: "test",
                            description: "testtestestsetsetsetsetsetsetsetsetset",
                        };
                        topic.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                        request.post(base_url + '/create-topic')
                        .type('form')
                        .send(topic)
                        .then(res => {
                            expect(res.text).to.have.string("Title should be at least 6 characters");
                            done();
                        })
                        .catch(err =>{
                            return done(err);
                        })
                    })
                })
                .catch(err =>{
                    return done(err);
                })
            })
            .catch(err =>{
                return done(err);
            })
        })
    })    
})

describe('(1 pt) Description should be at least 6 characters', function(){
    this.timeout(15000);
    it("Description should be at least 6 characters", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/dashboard')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var topic = {
                        title: "testsetsetsetsetsetsetsetsetsetsetsetsetsetset",
                        description: "test",
                    };
                    topic.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-topic')
                    .type('form')
                    .send(topic)
                    .then(res => {
                        expect(res.text).to.have.string("Description should be at least 6 characters");
                        done();
                    })
                    .catch(err =>{
                        return done(err);
                    })
                })
            })
            .catch(err =>{
                return done(err);
            })
        })
    })    
})

describe('(2 pts) Should redirect user back to /dashboard page upon successful topic creation with the newly created topic to be listed under the “Debate Topics I Created” table', function(){
    this.timeout(15000);
    it("Should redirect user back to /dashboard page upon successful topic creation with the newly created topic to be listed under the “Debate Topics I Created” table", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/dashboard')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var topic = {
                        title: "Topic Title 1",
                        description: "Topic Description 1"
                    };
                    topic.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-topic')
                    .type('form')
                    .send(topic)
                    .then(res => {
                        var $html = jQuery(res.text);
                        var my_topics = $html.find('.my-topics');
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string("/dashboard");
                        expect(my_topics.text()).to.have.string(topic.title);
                        done();
                    })
                    .catch(err =>{
                        return done(err);
                    })
                })
            })
            .catch(err =>{
                return done(err);
            })
        })        
    })    
})

describe('(1 pt) When another user logs in, the user is redirected to the /dashboard page. The newly created Topic above should be listed under ‘Debate Topics Created by Other Users” table.', function(){
    this.timeout(15000);
    it("When another user logs in, the user is redirected to the /dashboard page. The newly created Topic above should be listed under ‘Debate Topics Created by Other Users” table.", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {
                var $html = jQuery(res.text);
                user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user6)
                .then(res => {
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
                        var $html = jQuery(res.text);
                        var other_topics = $html.find('.other-topics');
                        expect(other_topics.text()).to.have.string("Topic Title 1");
                        done();
                    })
                })
                .catch(err =>{
                    return done(err);
                })
            })
            .catch(err =>{
                return done(err);
            })
        })
    })    
})