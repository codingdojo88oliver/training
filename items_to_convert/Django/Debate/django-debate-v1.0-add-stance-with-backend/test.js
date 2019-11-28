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

var user7 = {
    name: "Kim Domingo",
    email: "kim@datacompass.com",
    password: "password",
    c_password: "password", 
}

var user8 = {
    email: "kim@datacompass.com",
    password: "password",
}

describe('(1 pt) When the user tries submitting a form with an Argument that has less than 10 characters, the page reloads and a message that says “Argument should be at least 10 characters” should be displayed on the validation error section.', function(){
    before(function(done) {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
        this.timeout(30000);
        // register 2 default users:
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {

            })
            .catch(err =>{
                return done(err);
            })
        });
        this.timeout(30000);
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {

            })
            .catch(err =>{
                return done(err);
            })
        });   
        this.timeout(30000);
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
        });
    });
    this.timeout(30000);    

    it("When the user tries submitting a form with an Argument that has less than 10 characters, the page reloads and a message that says “Argument should be at least 10 characters” should be displayed on the validation error section.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user6)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.fresh-topic").attr('href');
                request.get(base_url + '/topics/1')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument = {
                        stance: "agree",
                        argument: "Argument",
                        topic_id: topic_id
                    };
                    argument.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-argument')
                    .type('form')
                    .send(argument)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string(href);
                        expect(res.text).to.have.string("Argument should be at least 10 characters");
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
        });
    });
});

describe('(1 pt) When the user submitted a valid Stance and Argument, the data should be saved under the arguments table on the database. The page also reloads. Under the validation message section, display the message “You said:  <stance> on this topic”', function(){
    this.timeout(30000);  
    it("When the user submitted a valid Stance and Argument, the data should be saved under the arguments table on the database. The page also reloads. Under the validation message section, display the message “You said:  <stance> on this topic”", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user6)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.fresh-topic").attr('href');
                request.get(base_url + '/topics/1')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument = {
                        stance: "agree",
                        argument: "My first argument to a topic",
                        topic_id: topic_id
                    };
                    argument.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-argument')
                    .type('form')
                    .send(argument)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string(href);
                        expect(res.text).to.have.string("You said: agree on this topic");
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
        });
    })    
})

describe('(1 pt) When a user already submitted a Stance and tried submitting another Stance different from the initial stance the user submitted, the page reloads and a validation error message “You should stick to your original Stance” should be displayed.', function(){
    this.timeout(30000);  
    it("When a user already submitted a Stance and tried submitting another Stance different from the initial stance the user submitted, the page reloads and a validation error message “You should stick to your original Stance” should be displayed.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user6)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.fresh-topic").attr('href');
                request.get(base_url + '/topics/1')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument = {
                        stance: "agree",
                        argument: "An invalid argument",
                        topic_id: topic_id
                    };
                    argument.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-argument')
                    .type('form')
                    .send(argument)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string(href);
                        expect(res.text).to.have.string("You should stick to your original Stance");
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
        });
    })    
})

describe('(1 pt) When the new Stance and Arguments are successfully submitted, the page reloads. The data is then appended and displayed on the Individual Topic page. It should be displayed on the correct Stance group.', function(){
    this.timeout(30000);  
    it("When the new Stance and Arguments are successfully submitted, the page reloads. The data is then appended and displayed on the Individual Topic page. It should be displayed on the correct Stance group.", function(done){
        this.timeout(30000);
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user7)
            .then(res => {
                var $html = jQuery(res.text);
                user8.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user8)
                .then(res => {
                    var $html = jQuery(res.text);
                    var href = $html.find("a.fresh-topic").attr('href');
                    request.get(base_url + '/topics/1')
                    .end(function(err, res){
                        var $html = jQuery(res.text);
                        var topic_id = $html.find('input[name=topic_id]').val();
                        var argument = {
                            stance: "agree",
                            argument: "My second argument to a topic",
                            topic_id: topic_id
                        };
                        argument.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                        request.post(base_url + '/create-argument')
                        .type('form')
                        .send(argument)
                        .then(res => {
                            var $html = jQuery(res.text);
                            var agree_item = $html.find('.agree_item').length;
                            let redirect_url = res != undefined ? res.redirects[0] : "";
                            expect(redirect_url).to.have.string(href);
                            expect(agree_item).to.equal(2);
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
        });   
        this.timeout(30000);

    })    
})

