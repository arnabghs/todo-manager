class User {
  constructor(userData) {
    this.name = userData.name;
    this.USERID = userData.USERID;
    this.PASSWORD = userData.PASSWORD;
    this.todoLists = userData.todoLists;
  }

  addTodo(todo) {
    this.todoLists.unshift(todo);
  }
  deleteTodo(todoId) {
    this.todoLists = this.todoLists.filter(todo => todo.id != todoId);
  }
}

module.exports = { User };
