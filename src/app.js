const fs = require("fs");
const express = require("express");
const app = express();
const form = require("../public/form.js");

const { INDEXPATH, ENCODING, FORMPLACEHOLDER } = require("./constants");
const { Todo } = require("./model/todo.js");
const { Item } = require("./model/item.js");
const { User } = require("./model/user.js");

const cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')


let session = new Object();

//-------------------------Server Handlers-------------------------//
const getUserData = function (req, res) {
	const { username } = req.cookies;
	res.send(JSON.stringify(session[username]));
};

const setCookie = function (req, res) {
	const { USERID } = parseLoginData(req);
	res.setHeader("Set-Cookie", `username=${USERID}`);
};

const getRequest = function (url) {
	if (url == "/") return INDEXPATH;
	return "./public" + url;
};

//-------------------------TODO Handlers-------------------------//

const writeData = function (req, res) {
	const { username } = req.cookies;
	const filePath = `./private_data/${username}.json`;
	const data = JSON.stringify(session[username]);

	fs.writeFile(filePath, data, err => {
		if (err) throw err;
		res.write(data);
		res.end();
	});
};

const logUserOut = function (req, res) {
	res.clearCookie("username");
	res.redirect("/");
};

const deleteItem = function (req, res) {
	const { itemId, listId } = req.body;
	const { username } = req.cookies;

	const listIndex = session[username].todoLists.findIndex(
		list => list.id == listId
	);
	session[username].todoLists[listIndex].deleteItem(itemId);
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

	const { username } = req.cookies;
	const listIndex = session[username].todoLists.findIndex(
		list => list.id == listId
	);
	const savedItems = session[username].todoLists[listIndex].items;
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

	session[username].todoLists[listIndex].editTitle(newTitle);
	session[username].todoLists[listIndex].editDescription(newDescription);
	session[username].todoLists[listIndex].items = savedItems;
	writeData(req, res);
};

const addItem = function (req, res) {
	const { id, desc } = req.body;
	let item = { id: 0, description: desc, status: false };
	const { username } = req.cookies;

	const matchedList = session[username].todoLists.filter(list => list.id == id)[0];
	if (matchedList.items.length > 0) {
		item.id = matchedList.items[0].id + 1;
	}
	let listIndex = session[username].todoLists.findIndex(item => item.id == id);

	let newItem = new Item(item);
	session[username].todoLists[listIndex].addItem(newItem);
	writeData(req, res);
};

const deleteList = function (req, res) {
	const todoId = req.body;
	const { username } = req.cookies;

	session[username].deleteTodo(todoId);
	writeData(req, res);
};

const addList = function (req, res) {
	const { listTitle, listDescription } = req.body;
	const { username } = req.cookies;

	let listId = 0;
	if (session[username].todoLists.length > 0) {
		listId = session[username].todoLists[0].id + 1;
	}

	const todo = {
		id: listId,
		title: listTitle,
		description: listDescription,
		items: []
	};

	let list = new Todo(todo);
	session[username].addTodo(list);
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

const parseLoginData = function (req) {
	const userId = req.body.username;
	const password = req.body.password;
	return { USERID: userId, PASSWORD: password };
};

const parseSignUpData = function (req) {
	const name = req.body.name;
	const userId = req.body.username;
	const password = req.body.password;
	const confirmPassword = req.body.confirm_password;
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

		if (!req.cookies.username) {
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
		const { username } = req.cookies;
		const filePath = `./private_data/${username}.json`;
		loadHomePage(req, res, filePath, username);
		return;
	}
	loadIndexPage(req, res, nameOfForm);
};

app.use(bodyParser.text())
app.use(bodyParser.urlencoded({ extended: true }))


app.use(cookieParser());
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
	parseLoginData,
};
