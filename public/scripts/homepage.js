let selectedListId;

const deleteItem = function (event) {
	let itemId = event.target.id;

	fetch("/deleteItem", {
		method: "POST",
		body: `itemId=${itemId}&listId=${selectedListId}`,
		headers: { "content-type": "application/x-www-form-urlencoded" }
	})
		.then(response => response.text())
		.then(data => getItems(data, selectedListId))
		.then(details => createItemBox(details));
};

const addItem = function () {
	const itemDescElement = document.getElementById("addItemTextBox");
	let itemDesc = itemDescElement.value;
	if (itemDesc == "") {
		itemDescElement.placeholder = "Task description required";
		return;
	}

	const event = { target: { id: selectedListId } };
	fetchItems(event, "/newItem", {
		method: "POST",
		body: `desc=${itemDesc}&id=${selectedListId}`,
		headers: { "content-type": "application/x-www-form-urlencoded" }
	});
};

const createHtmlElement = function (
	tag,
	text = "",
	id = "",
	method = "",
	type = ""
) {
	const element = document.createElement(tag);
	element.innerText = text;
	element.id = id;
	element.onclick = method;
	element.type = type;
	return element;
};

const createHeadDiv = function (itemDetails) {
	const headDiv = createHtmlElement("div");
	headDiv.className = "item-area-head";
	const titleDiv = createHtmlElement("div");
	const descriptionDiv = createHtmlElement("div");
	const addItemDiv = createHtmlElement("div");
	const title = createHtmlElement("p", itemDetails.title, "todoTitle");

	title.contentEditable = true;
	addItemDiv.className = "additem-div";

	const description = createHtmlElement(
		"p",
		itemDetails.description,
		"todoDescription"
	);
	description.contentEditable = true;

	const inputBox = createHtmlElement("input", "", "addItemTextBox", "", "text");

	const addItemButton = createHtmlElement("button", "Add", "", addItem);

	titleDiv.appendChild(title);
	descriptionDiv.appendChild(description);

	addItemDiv.appendChild(inputBox);
	addItemDiv.appendChild(addItemButton);

	headDiv.appendChild(titleDiv);
	headDiv.appendChild(descriptionDiv);
	headDiv.appendChild(addItemDiv);
	return headDiv;
};

const createBodyDiv = function (itemDetails) {
	const bodyDiv = createHtmlElement("div", "", "item-area-body");

	itemDetails.items.forEach(item => {
		const itemDiv = createHtmlElement("div");
		itemDiv.className = "task-div";

		const dualElementDiv = createHtmlElement("div");

		const checkBox = createHtmlElement("input", "", "", "", "checkbox");
		checkBox.className = "checkBoxes";
		checkBox.checked = item.status;

		const itemDescription = createHtmlElement(
			"p",
			item.description,
			`item${item.id}`
		);
		itemDescription.className = "task-desc";
		itemDescription.contentEditable = true;

		dualElementDiv.appendChild(checkBox);
		dualElementDiv.appendChild(itemDescription);

		const button = createHtmlElement("button", "Delete", item.id, deleteItem);

		itemDiv.appendChild(dualElementDiv);
		itemDiv.appendChild(button);
		itemDescription.style.display = "inline";
		bodyDiv.appendChild(itemDiv);
	});
	return bodyDiv;
};

const saveItems = function () {
	const checkBoxes = Object.values(
		document.getElementsByClassName("checkBoxes")
	);
	const checkBoxesStatus = checkBoxes.map(checkBox => checkBox.checked);

	const editedItems = Object.values(
		document.getElementsByClassName("task-desc")
	);
	const editedItemValues = editedItems.map(item => {
		return { id: item.id, value: item.innerText };
	});

	const newTitle = document.getElementById("todoTitle").innerText;
	const newDescription = document.getElementById("todoDescription").innerText;

	let details = {
		method: "POST",
		body: JSON.stringify({
			listId: selectedListId,
			newTitle: newTitle,
			newDescription: newDescription,
			checkBoxesStatus: checkBoxesStatus,
			editedItems: editedItemValues
		})
	};

	fetchLists("/data");
	fetch("/saveTodo", details)
		.then(response => response.text())
		.then(data => getItems(data, selectedListId))
		.then(details => createItemBox(details));
};

const createBottomDiv = function () {
	const bottomDiv = createHtmlElement("div");
	bottomDiv.className = "item-area-bottom";

	const saveButton = createHtmlElement(
		"button",
		"Save",
		"savetodo-button",
		saveItems
	);
	const deleteButton = createHtmlElement(
		"button",
		"Delete Todo",
		"deletetodo-button",
		deleteList
	);
	bottomDiv.appendChild(saveButton);
	bottomDiv.appendChild(deleteButton);
	return bottomDiv;
};

const createItemBox = function (itemDetails) {
	const itemAreaDiv = document.getElementById("itemArea");
	itemAreaDiv.innerHTML = "";

	const headDiv = createHeadDiv(itemDetails);
	const bodyDiv = createBodyDiv(itemDetails);
	const bottomDiv = createBottomDiv();

	itemAreaDiv.appendChild(headDiv);
	itemAreaDiv.appendChild(bodyDiv);
	itemAreaDiv.appendChild(bottomDiv);
};

const getItems = function (data, clickedListId) {
	const todoLists = JSON.parse(data).todoLists;
	const matchedLists = todoLists.filter(list => list.id == clickedListId);

	selectedListId = +matchedLists[0].id;
	return {
		items: matchedLists[0].items,
		description: matchedLists[0].description,
		title: matchedLists[0].title
	};
};

const fetchItems = function (event, url = "/data", details) {
	clickedListId = event.target.id;
	fetch(url, details)
		.then(response => response.text())
		.then(data => getItems(data, clickedListId))
		.then(details => createItemBox(details));
};

const deleteList = function () {
	fetchLists("/deleteTodo", {
		method: "POST",
		body: selectedListId
	});
	document.getElementById("itemArea").innerHTML = "";
};

const addList = function () {
	const listTitleElement = document.getElementById("todoTitleBox");
	const listDescriptionElement = document.getElementById("todoDescriptionBox");
	let listTitle = listTitleElement.value;
	let listDescription = listDescriptionElement.value;

	if (listTitle == "") {
		listTitleElement.placeholder = "Title name required";
		listDescriptionElement.value = "";
		return;
	}

	if (listDescription == "") {
		listDescription = "Todo Description";
	}

	listTitleElement.value = "";
	listDescriptionElement.value = "";
	fetchLists("/newTodo", {
		method: "POST",
		body: `listTitle=${listTitle}&listDescription=${listDescription}`,
		headers: { "content-type": "application/x-www-form-urlencoded" }
	});
};

const createListsHtml = function (lists) {
	const listAreaDiv = document.getElementById("listArea");
	listAreaDiv.className = "list-area";
	listAreaDiv.innerHTML = "";

	lists.forEach(list => {
		let listDiv = document.createElement("div");
		listDiv.id = list.id;
		listDiv.innerText = list.title;
		listDiv.onclick = fetchItems;
		listAreaDiv.appendChild(listDiv);
	});
};

const getLists = function (data) {
	const userData = JSON.parse(data);
	return userData.todoLists;
};

const fetchLists = function (url, details) {
	fetch(url, details)
		.then(response => response.text())
		.then(data => getLists(data))
		.then(lists => createListsHtml(lists));
};

window.onload = fetchLists.bind(null, "/data");
