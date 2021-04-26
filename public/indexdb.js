let db;

// create a db request for a "budgetTracker" database with a version of 1
const request = indexedDB.open("budgetTracker", 1);

request.onupgradeneeded = (event) => {
  // create object store called "pending" and set autoIncrement to true
  db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = (event) => {
  db = event.target.result;
  // checks if the app is online before reading from our db
  if (navigator.onLine) {
    checkDb();
  }
};

request.onerror = (event) => {
  console.log("Error" + event.target.errorCode);
};

function saveRecord(record) {
  // Saves a record of our transactions to a pending database
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

function checkDb() {
  // Opens our DB and accesses our current pending transactions
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const pendingTransactions = store.getAll();

  pendingTransactions.onsuccess = function () {
    //   if we have any pending transactions, do a bulk post.
    if (pendingTransactions.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(pendingTransactions.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
            // after we post all of our pending transactions, then we clear them
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}

// listen for coming back online event to push our transactions
window.addEventListener("online", checkDb);
