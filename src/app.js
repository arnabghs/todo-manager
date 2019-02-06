const fs = require("fs");
const express = require("express");
const app = express();
const form = require("../public/form.js");

const { INDEXPATH, ENCODING, FORMPLACEHOLDER } = require("./constants");
const { Todo } = require("./model/todo.js");
const { Item } = require("./model/item.js");
const { User } = require("./model/user.js");

let session = new Object();

//-------------------------Server Handlers-------------------------//

const send = function (res, content, statusCode = 200) {
	res.statusCode = statusCode;
	res.write(content);
	res.end();
};

const getUserData = function (req, res) {
	const userId = retrieveUserId(req);
	send(res, JSON.stringify(session[userId]), 200);
};

const retrieveUserId = function (req) {
	return req.headers.cookie.split("=")[1];
};

const setCookie = function (req, res) {
	const { USERID } = parseLoginData(req);
	res.setHeader("Set-Cookie", `username=${USERID}`);
};

const readBody = function (req, res, next) {
	let content = "";
	req.on("data", chunk => (content += chunk));
	req.on("end", () => {
		req.body = content;
		next();
	});
};

const getRequest = function (url) {
	if (url == "/") return INDEXPATH;
	return "./public" + url;
};

//-------------------------TODO Handlers-------------------------//

const writeData = function (req, res) {
	const userId = retrieveUserId(req);
	const filePath = `./private_data/${userId}.json`;
	const data = JSON.stringify(session[userId]);

	fs.writeFile(filePath, data, err => {
		if (err) throw err;
		res.write(data);
		res.end();
	});
};

const logUserOut = function (req, res) {
	let expiryDate = "Thu, 01 Jan 1970 00:00:00 UTC;";
	res.setHeader("Set-Cookie", `username=;expires=${expiryDate};`);
	res.writeHead(302, { Location: "/" });
	res.end();
};

const deleteItem = function (req, res) {
	const { itemId, listId } = JSON.parse(req.body);
	const userId = retrieveUserId(req);

	const listIndex = session[userId].todoLists.findIndex(
		list => list.id == listId
	);
	session[userId].todoLists[listIndex].deleteItem(itemId);
	writeData(req, res);
};

const saveItems = function (req, res) {
	const {
		listId,
		newTitle,
		newDescription,
		checkBoxesStatus,
		editedItems
	} = JSON.parse(req.body);

	const userId = retrieveUserId(req);
	const listIndex = session[userId].todoLists.findIndex(
		list => list.id == listId
	);
	const savedItems = session[userId].todoLists[listIndex].items;

	editedItems.forEach(editedItem => {
		let editedItemId = editedItem.id.substring(4);

		savedItems.forEach(savedItem => {
			if (savedItem.id == editedItemId) {
				savedItem.setDescription(editedItem.value);
			}
		});
	});

	let index = 0;
	savedItems.forEach(savedItem => {
		savedItem.setStatus(checkBoxesStatus[index]);
		index++;
	});

	session[userId].todoLists[listIndex].editTitle(newTitle);
	session[userId].todoLists[listIndex].editDescription(newDescription);
	session[userId].todoLists[listIndex].items = savedItems;
	writeData(req, res);
};

const addItem = function (req, res) {
	const { id, desc } = JSON.parse(req.body);
	let item = { id: 0, description: desc, status: false };
	const userId = retrieveUserId(req);

	const matchedList = session[userId].todoLists.filter(
		list => list.id == id
	)[0];
	if (matchedList.items.length > 0) {
		item.id = matchedList.items[0].id + 1;
	}
	let listIndex = session[userId].todoLists.findIndex(item => item.id == id);

	let newItem = new Item(item);
	session[userId].todoLists[listIndex].addItem(newItem);
	writeData(req, res);
};

const deleteList = function (req, res) {
	const todoId = req.body;
	const userId = retrieveUserId(req);
	session[userId].deleteTodo(todoId);
	writeData(req, res);
};

const addList = function (req, res) {
	const { listTitle, listDescription } = JSON.parse(req.body);
	const userId = retrieveUserId(req);
	let listId = 0;
	if (session[userId].todoLists.length > 0) {
		listId = session[userId].todoLists[0].id + 1;
	}

	const todo = {
		id: listId,
		title: listTitle,
		description: listDescription,
		items: []
	};

	let list = new Todo(todo);
	session[userId].addTodo(list);
	writeData(req, res);
};

const userExist = function (res, filePath) {
	if (!fs.existsSync(filePath)) {
		res.write("Account doesn't exist");
		res.end();
		return false;
	}
	return true;
};

const passwordMatched = function (res, PASSWORD = null, savedPassword = null) {
	if (PASSWORD != savedPassword) {
		res.write("Wrong Password");
		res.end();
		return false;
	}
	return true;
};

const reviveInstances = function (USERID) {
	session[USERID] = new User(session[USERID]);
	if (session[USERID].todoLists.length) {
		session[USERID].todoLists = session[USERID].todoLists.map(
			list => new Todo(list)
		);

		session[USERID].todoLists = session[USERID].todoLists.map(list => {
			list.items = list.items.map(item => new Item(item));
			return list;
		});
	}
};

const parseData = function (content, index) {
	return content.split("&")[index].split("=")[1];
};

const parseLoginData = function (req) {
	const userId = parseData(req.body, 0);
	const password = parseData(req.body, 1);
	return { USERID: userId, PASSWORD: password };
};

const parseSignUpData = function (req) {
	const name = parseData(req.body, 0);
	const userId = parseData(req.body, 1);
	const password = parseData(req.body, 2);
	const confirmPassword = parseData(req.body, 3);
	return {
		name: name,
		USERID: userId,
		PASSWORD: password,
		confirmPassword: confirmPassword
	};
};

const createPrivateDir = function () {
	if (!fs.existsSync('./private_data')) {
		fs.mkdirSync('./private_data');
	}
}

const registerNewUser = function (req, res) {
	const { name, USERID, PASSWORD, confirmPassword } = parseSignUpData(req);
	createPrivateDir();

	let filePath = `./private_data/${USERID}.json`;

	if (fs.existsSync(filePath)) {
		res.write("Account already Exists");
		res.end();
		return;
	}

	if (PASSWORD != confirmPassword) {
		res.write("passwords do not match");
		res.end();
		return;
	}

	const userDetails = {
		name: name,
		USERID: USERID,
		PASSWORD: PASSWORD,
		todoLists: []
	};

	fs.writeFile(filePath, JSON.stringify(userDetails), err => {
		if (err) throw err;
	});
	res.writeHead(302, { Location: "/" });
	res.end();
};

const logUserIn = function (req, res) {
	const { USERID, PASSWORD } = parseLoginData(req);
	const filePath = `./private_data/${USERID}.json`;

	if (!userExist(res, filePath)) return;
	loadHomePage(req, res, filePath, USERID, PASSWORD);
};

const loadIndexPage = function (req, res, nameOfForm) {
	fs.readFile(INDEXPATH, ENCODING, function (err, content) {
		res.write(content.replace(FORMPLACEHOLDER, form[nameOfForm]));
		res.end();
	});
};

const loadHomePage = function (req, res, filePath, USERID, PASSWORD) {
	fs.readFile(filePath, (err, content) => {
		if (err) throw err;

		let userData = JSON.parse(content);

		if (!req.headers.cookie) {
			if (!passwordMatched(res, PASSWORD, userData.PASSWORD)) return;
			setCookie(req, res);
		}

		session[USERID] = userData;
		reviveInstances(USERID);
		const filePath = "./public/htmls/homepage.html";

		fs.readFile(filePath, ENCODING, function (err, content) {
			if (err) throw err;
			res.write(content.replace("___userId___", session[USERID].name));
			res.end();
		});
	});
};

const renderMainPage = function (nameOfForm, req, res) {
	if (req.headers.cookie) {
		let userId = retrieveUserId(req);
		const filePath = `./private_data/${userId}.json`;
		loadHomePage(req, res, filePath, userId);
		return;
	}
	loadIndexPage(req, res, nameOfForm);
};

app.use(readBody);
app.get("/", renderMainPage.bind(null, "loginForm"));
app.post("/", logUserIn);
app.get("/signup", renderMainPage.bind(null, "signUpForm"));
app.post("/signup", registerNewUser);
app.get("/data", getUserData);
app.post("/newTodo", addList);
app.post("/newItem", addItem);
app.post("/deleteTodo", deleteList);
app.post("/deleteItem", deleteItem);
app.post("/saveTodo", saveItems);
app.post("/logout", logUserOut);
app.use(express.static("public"));

module.exports = {
	app,
	getRequest,
	parseData,
	parseLoginData,
	renderMainPage
};
