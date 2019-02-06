const chai = require("chai");

const { getRequest, parseData, parseLoginData } = require("../src/app.js");

describe("getRequest", function() {
  it("should return index file path for '/' ", function() {
    const expected = "./public/htmls/index.html";
    chai.expect(getRequest("/")).to.equal(expected);
  });

  it("should return given string after adding ./public except for '/' ", function() {
    const expected = "./public/favicon.ico";
    chai.expect(getRequest("/favicon.ico")).to.equal(expected);
  });
});

describe("parseData", function() {
  const userDetails = "userId=vprince001&password=12345";
  it("should return value of userId from userDetails", function() {
    const expected = "vprince001";
    chai.expect(parseData(userDetails, 0)).to.equal(expected);
  });

  it("should return value of password from userDetails", function() {
    const expected = "12345";
    chai.expect(parseData(userDetails, 1)).to.equal(expected);
  });
});

describe("parseLoginData", function() {
  const req = { body: "userId=vprince001&password=12345" };

  it("should return userId and password in object for userDetails", function() {
    const expected = { USERID: "vprince001", PASSWORD: "12345" };
    chai.assert.deepEqual(parseLoginData(req), expected);
  });
});
