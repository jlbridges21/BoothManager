document.addEventListener("DOMContentLoaded", () => {
  const addItemBtn = document.getElementById("add-item-btn");
  const addItemFormModal = document.getElementById("item-form-modal");
  const closeFormBtn = document.querySelector(".close-button");
  const inventoryTabBtn = document.getElementById("inventory-tab-btn");
  const salesTabBtn = document.getElementById("sales-tab-btn");
  const salesTabBtn2 = document.getElementById("sales-total");
  const inventoryView = document.getElementById("inventory-view");
  const salesView = document.getElementById("sales-view");
  const addItemForm = document.getElementById("add-item-form");
  const inventoryList = document.getElementById("inventory-list");
  const salesList = document.getElementById("sales-list");
  const totalSalesDisplay = document.getElementById("total-sales");
  const totalDisplay2 = document.getElementById("total-display");
  const totalDisplay = document.getElementById("total-cost-display");
  const salesTotal = document.getElementById("sales-total");
  const boothFilter = document.getElementById("booth-filter");
  const saveResetSalesBtn = document.getElementById("save-reset-sales-btn");
  const salesLog = document.getElementById("sales-log");
  const clearSalesLogBtn = document.getElementById("clear-sales-log-btn");
  const nextItemBtn = document.getElementById("next-item");

  let isEditing = false;
  let editItemId = null;

  let inventoryItems = JSON.parse(localStorage.getItem("inventoryItems")) || [];
  let totalSales = parseFloat(localStorage.getItem("totalSales")) || 0;
  let salesHistory = JSON.parse(localStorage.getItem("it")) || [];
  let soldItems = JSON.parse(localStorage.getItem("soldItems")) || [];

  const init = () => {
    setupEventListeners();
    displayInventoryItems();
    updateBoothFilterOptions();
    displaySalesTotal();
    displaySalesLog();
  };

  const viewSalesLogBtn = document.getElementById("view-sales-log-btn");
  const searchInput = document.getElementById("search-input");

  const switchToInventoryView = () => {
    inventoryView.style.display = "block";
    salesView.style.display = "none";
    inventoryTabBtn.classList.add("active");
    salesTabBtn.classList.remove("active");
    displayInventoryItems(); // Refresh inventory items display
  };

  // Function to switch to sales view
  const switchToSalesView = () => {
    inventoryView.style.display = "none";
    salesView.style.display = "block";
    salesTabBtn.classList.add("active");
    inventoryTabBtn.classList.remove("active");
    displaySoldItems(); // Ensure this function is correctly implemented
  };

  const homeButton = document.getElementById("home");
  homeButton.addEventListener("click", switchToInventoryView);

  const displaySoldItems = () => {
    salesList.innerHTML = "";
    let totalSalesAmount = 0;
    soldItems.forEach((item, index) => {
      const itemPrice =
        typeof item.price === "number" ? item.price.toFixed(2) : "0.00";
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - Sold for: $${itemPrice} <button class='delete-sold-item-btn' data-index='${index}'>Delete</button>`;
      salesList.appendChild(li);
      totalSalesAmount += typeof item.price === "number" ? item.price : 0;
    });
    totalSalesDisplay.textContent = `Total Sales: $${totalSalesAmount.toFixed(
      2
    )}`;
    localStorage.setItem("soldItems", JSON.stringify(soldItems)); // Persist sold items

    // Add event listeners to the newly created delete buttons
    document.querySelectorAll(".delete-sold-item-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const index = parseInt(this.getAttribute("data-index"));
        deleteSoldItem(index);
      });
    });
  };

  const deleteSoldItem = (index) => {
    soldItems.splice(index, 1); // Remove the item from the array
    localStorage.setItem("soldItems", JSON.stringify(soldItems)); // Update local storage
    displaySoldItems(); // Refresh the list of sold items
  };

  const handleSellItem = (itemId) => {
    const index = inventoryItems.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      const soldItem = inventoryItems.splice(index, 1)[0];
      soldItems.push(soldItem);
      localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
      localStorage.setItem("soldItems", JSON.stringify(soldItems));
      displayInventoryItems(); // Refresh inventory display
      if (salesView.style.display !== "none") {
        displaySoldItems(); // Refresh sales display if visible
      }
    }
  };

  window.handleSellItem = handleSellItem;

  const setupEventListeners = () => {
    addItemBtn.addEventListener("click", () => {
      isEditing = false;
      addItemFormModal.style.display = "flex";
      addItemForm.reset();

      // Auto-populate the "Booth Name" field if a specific booth is currently selected
      if (boothFilter.value !== "all") {
        document.getElementById("booth-name").value = boothFilter.value;
      }
    });
    closeFormBtn.addEventListener(
      "click",
      () => (addItemFormModal.style.display = "none")
    );
    window.addEventListener("click", (event) => {
      if (event.target === addItemFormModal)
        addItemFormModal.style.display = "none";
    });
    inventoryTabBtn.addEventListener("click", switchToInventoryView);
    salesTabBtn.addEventListener("click", switchToSalesView);
    salesTabBtn2.addEventListener("click", switchToSalesView);
    addItemForm.addEventListener("submit", handleNewItemSubmit);
    nextItemBtn.addEventListener("click", handleAddNewItem);
    boothFilter.addEventListener("change", () =>
      displayInventoryItems(searchInput.value.toLowerCase())
    );
    saveResetSalesBtn.addEventListener("click", saveAndResetSales);
    clearSalesLogBtn.addEventListener("click", clearAllSalesLogConfirmation);
    viewSalesLogBtn.addEventListener("click", toggleSalesLogVisibility);
    salesList.addEventListener("click", (event) => {
      if (event.target.classList.contains("delete-sold-item")) {
        const index = event.target.getAttribute("data-index");
        deleteSoldItem(index);
      }
    });
    searchInput.addEventListener("input", handleSearchItems);
  };
  displaySoldItems();

  const handleAddNewItem = (event) => {
    event.preventDefault(); // Prevent the default button action

    // Similar to your handleNewItemSubmit logic but without closing the modal
    const itemName = document.getElementById("item-name").value.trim();
    const itemDescription = document
      .getElementById("item-description")
      .value.trim();
    const itemCost = parseFloat(
      document.getElementById("item-cost").value.trim()
    );
    const itemPrice = parseFloat(
      document.getElementById("item-price").value.trim()
    );
    const boothName = document.getElementById("booth-name").value.trim();

    if (!itemName || isNaN(itemCost) || isNaN(itemPrice)) {
      alert(
        "Name, cost, and price are required fields and must be valid numbers."
      );
      return;
    }

    // Determine if editing or adding new
    if (isEditing) {
      inventoryItems = inventoryItems.map((item) =>
        item[0] === editItemId
          ? [
              editItemId,
              itemName,
              itemDescription,
              itemCost,
              itemPrice,
              boothName,
            ]
          : item
      );
    } else {
      const itemId =
        inventoryItems.length > 0
          ? Math.max(...inventoryItems.map((item) => item[0])) + 1
          : 1;
      inventoryItems.push([
        itemId,
        itemName,
        itemDescription,
        itemCost,
        itemPrice,
        boothName,
      ]);
    }

    // Clear the form fields for next item entry without closing the modal
    document.getElementById("item-name").value = "";
    document.getElementById("item-description").value = "";
    document.getElementById("item-cost").value = "";
    document.getElementById("item-price").value = "";
  };

  const handleNewItemSubmit = (event) => {
    event.preventDefault();
    const itemName = document.getElementById("item-name").value.trim();
    const itemDescription = document
      .getElementById("item-description")
      .value.trim();
    const itemCost = parseFloat(
      document.getElementById("item-cost").value.trim()
    );
    const itemPrice = parseFloat(
      document.getElementById("item-price").value.trim()
    );
    const boothName = document.getElementById("booth-name").value.trim();

    if (!itemName || isNaN(itemCost) || isNaN(itemPrice)) {
      alert(
        "Name, cost, and price are required fields and must be valid numbers."
      );
      return;
    }

    if (isEditing) {
      inventoryItems = inventoryItems.map((item) =>
        item[0] === editItemId
          ? [
              editItemId,
              itemName,
              itemDescription,
              itemCost,
              itemPrice,
              boothName,
            ]
          : item
      );
    } else {
      const itemId =
        inventoryItems.length > 0
          ? Math.max(...inventoryItems.map((item) => item[0])) + 1
          : 1;
      inventoryItems.push([
        itemId,
        itemName,
        itemDescription,
        itemCost,
        itemPrice,
        boothName,
      ]);
    }

    updateAppState();
    addItemFormModal.style.display = "none";
  };

  const handleSearchItems = () => {
    const searchQuery = searchInput.value.toLowerCase();
    displayInventoryItems(searchQuery);
  };

  const displayInventoryItems = (searchQuery = "") => {
    inventoryList.innerHTML = "";
    inventoryItems
      .filter(
        (item) =>
          (boothFilter.value === "all" || item[5] === boothFilter.value) &&
          item[1].toLowerCase().includes(searchQuery)
      )
      .forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `
                    <span>${item[1]}</span>
                    <span>$${parseFloat(item[3]).toFixed(2)}</span>
                    <span>$${parseFloat(item[4]).toFixed(2)}</span>
                    <img src="images/edit.png" class="edit-btn" data-id="${
                      item[0]
                    }" onclick="editItem(${item[0]})">
                    <img src="images/clear.png" class="sell-btn" data-id="${
                      item[0]
                    }" onclick="sellItem(${item[0]})">
                    <img src="images/delete.png" class="delete-btn" data-id="${
                      item[0]
                    }" onclick="deleteItem(${item[0]})">`;
        inventoryList.appendChild(li);
      });

    calculateTotal();
  };

  const calculateTotal = () => {
    // Filter items based on the current booth filter selection
    const filteredItems = inventoryItems.filter(
      (item) => boothFilter.value === "all" || item[5] === boothFilter.value
    );

    // Calculate the total cost and total listing price for filtered items
    const totalCost = filteredItems.reduce((acc, item) => acc + item[3], 0);
    const totalListingPrice = filteredItems.reduce(
      (acc, item) => acc + item[4],
      0
    );

    // Update the display with the calculated totals
    totalDisplay.textContent = `Total Cost: $${totalCost.toFixed(2)}`;
    totalDisplay2.textContent = `Listing Price: $${totalListingPrice.toFixed(
      2
    )}`;
  };

  const removeSoldItem = (index) => {
    soldItems.splice(index, 1); // Remove the item from the array
    localStorage.setItem("soldItems", JSON.stringify(soldItems)); // Update local storage
    displaySoldItems(); // Refresh the list of sold items
  };

  // Initial call to display sold items when the page loads or when you switch to the Sales tab
  displaySoldItems();

  const editItem = (itemId) => {
    const item = inventoryItems.find((item) => item[0] === itemId);
    if (item) {
      document.getElementById("item-name").value = item[1];
      document.getElementById("item-description").value = item[2];
      document.getElementById("item-cost").value = item[3];
      document.getElementById("item-price").value = item[4];
      document.getElementById("booth-name").value = item[5];
      editItemId = itemId;
      isEditing = true;
      addItemFormModal.style.display = "flex";
    }
  };
  window.editItem = editItem;

  const deleteItem = (itemId) => {
    inventoryItems = inventoryItems.filter((item) => item[0] !== itemId);
    updateAppState();
  };
  window.deleteItem = deleteItem;

  const sellItem = (itemId) => {
    const itemIndex = inventoryItems.findIndex((item) => item[0] === itemId);
    if (itemIndex !== -1) {
      const inventoryItem = inventoryItems[itemIndex];

      // Add the price of the sold item to the total sales
      totalSales += inventoryItem[4]; // Assuming price is at index 4

      const soldItem = {
        id: inventoryItem[0],
        name: inventoryItem[1],
        price: inventoryItem[4], // Assuming price is at index 4
      };

      soldItems.push(soldItem);
      inventoryItems.splice(itemIndex, 1);

      localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
      localStorage.setItem("soldItems", JSON.stringify(soldItems));
      localStorage.setItem("totalSales", JSON.stringify(totalSales)); // Update total sales in local storage

      displayInventoryItems();
      displaySoldItems();
      displaySalesTotal(); // Make sure this function updates the UI with the new totalSales value
    }
  };
  window.sellItem = sellItem;

  const saveAndResetSales = () => {
    const salesData = {
      startDate:
        localStorage.getItem("lastResetDate") || new Date().toLocaleString(),
      endDate: new Date().toLocaleString(),
      totalSales: totalSales.toFixed(2),
    };
    salesHistory.push(salesData);
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
    localStorage.setItem("lastResetDate", new Date().toLocaleString());

    totalSales = 0;
    displaySalesTotal();
    displaySalesLog();
  };

  const clearAllSalesLogConfirmation = () => {
    if (
      confirm(
        "This will clear all the sales log data and cannot be undone. Are you sure?"
      )
    ) {
      salesHistory = [];
      localStorage.removeItem("salesHistory");
      displaySalesLog();
    }
  };

  const displaySalesTotal = () => {
    salesTotal.textContent = `Sales: $${totalSales.toFixed(2)}`;
  };

  const displaySalesLog = () => {
    salesLog.innerHTML = "<h2>Sales Log:</h2>";
    salesHistory.forEach((sale, index) => {
      const startDateFormatted = new Date(sale.startDate).toLocaleDateString(
        "en-US"
      );
      const endDateFormatted = new Date(sale.endDate).toLocaleDateString(
        "en-US"
      );
      const saleEntry = document.createElement("div");
      saleEntry.innerHTML = `From the ${startDateFormatted} to ${endDateFormatted}, you made $${sale.totalSales} <button onclick='deleteSingleLog(${index})'>Delete</button>`;
      salesLog.appendChild(saleEntry);
    });
  };

  const toggleSalesLogVisibility = () => {
    const salesLogStyle = salesLog.style.display;
    salesLog.style.display = salesLogStyle === "none" ? "block" : "none";
    clearSalesLogBtn.style.display =
      salesLogStyle === "none" ? "inline-block" : "none"; // Show or hide the clear sales log button as well
  };

  window.deleteSingleLog = (index) => {
    salesHistory.splice(index, 1);
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
    displaySalesLog();
  };

  const updateAppState = () => {
    saveInventoryItems();
    displayInventoryItems();
    updateBoothFilterOptions();
    displaySalesTotal();
    displaySalesLog();
  };

  const saveInventoryItems = () => {
    localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
    localStorage.setItem("totalSales", totalSales.toString());
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
  };

  const updateBoothFilterOptions = () => {
    boothFilter.innerHTML = '<option value="all">All Booths</option>';
    const uniqueBooths = [
      ...new Set(inventoryItems.map((item) => item[5]).filter(Boolean)),
    ];
    uniqueBooths.forEach((booth) => {
      const option = document.createElement("option");
      option.value = booth;
      option.textContent = booth;
      boothFilter.appendChild(option);
    });
  };

  init();
});

// JavaScript to toggle dark mode
const toggleDarkMode = () => {
  const body = document.body;
  body.classList.toggle("dark-mode");
};

// Example: Assuming you have a button with id 'dark-mode-toggle'
const darkModeToggleBtn = document.getElementById("dark-mode-toggle");
darkModeToggleBtn.addEventListener("click", toggleDarkMode);
