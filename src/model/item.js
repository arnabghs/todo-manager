class Item {
  constructor(item) {
    this.description = item.description || "";
    this.status = item.status;
    this.id = item.id;
  }

  setStatus(isDone) {
    this.status = isDone;
  }

  setDescription(description) {
    this.description = description;
  }
}

module.exports = { Item };
