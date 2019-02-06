class Todo {
  constructor(todo) {
    this.id = todo.id;
    this.title = todo.title;
    this.description = todo.description;
    this.items = todo.items;
  }

  editTitle(title) {
    this.title = title;
  }

  editDescription(description) {
    this.description = description;
  }

  addItem(item) {
    this.items.unshift(item);
  }

  deleteItem(itemId) {
    this.items = this.items.filter(item => item.id != itemId);
  }
}

module.exports = { Todo };
