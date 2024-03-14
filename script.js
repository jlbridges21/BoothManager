document.addEventListener("DOMContentLoaded", () => {
  const addItemBtn = document.getElementById("add-item-btn");
  const addItemFormModal = document.getElementById("item-form-modal");
  const closeFormBtn = document.querySelector(".close-button");
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
    updateBoothButtons(); // Ensure this is added
    displaySalesTotal();
  };

  const searchInput = document.getElementById("search-input");

  const switchToInventoryView = () => {
    inventoryView.style.display = "block";
    salesView.style.display = "none";
    salesTabBtn.classList.remove("active");
    displayInventoryItems(); // Refresh inventory items display
  };

  // Function to switch to sales view
  const switchToSalesView = () => {
    inventoryView.style.display = "none";
    salesView.style.display = "block";
    salesTabBtn.classList.add("active");
    displaySoldItems(); // Ensure this function is correctly implemented
    generateSalesChart();
  };

  const homeButton = document.getElementById("home");
  homeButton.addEventListener("click", switchToInventoryView);

  const displaySoldItems = () => {
    salesList.innerHTML = ""; // Clear existing sold items list
    let totalSalesAmount = 0;
    let totalCostAmount = 0;
  
    // Iterate over each sold item to calculate totals and create list items
    soldItems.forEach((item, index) => {
      const itemPrice = typeof item.price === "number" ? item.price.toFixed(2) : "0.00";
      const itemCost = typeof item.cost === "number" ? item.cost.toFixed(2) : "0.00";
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - Sold for: $${itemPrice} <button class='unsell-item-btn' data-index='${index}'>Unsell</button> <button class='delete-sold-item-btn' data-index='${index}'>Delete</button>`;
      salesList.appendChild(li);
      totalSalesAmount += parseFloat(itemPrice);
      totalCostAmount += parseFloat(itemCost);
    });
  
    // Calculate profit
    const profit = totalSalesAmount - totalCostAmount;
  
    // Update the UI with the calculated values
    totalSalesDisplay.innerHTML = `Total Sales: $${totalSalesAmount.toFixed(2)}`;
    // Add or update the total cost and profit display
    const costProfitContainer = document.getElementById("cost-profit-container") || document.createElement("div");
    costProfitContainer.id = "cost-profit-container";
    costProfitContainer.innerHTML = `
      <div id="total-cost">Total Cost: $${totalCostAmount.toFixed(2)}</div>
      <div id="profit">Profit: $${profit.toFixed(2)}</div>
    `;
    
    // Conditionally append the new container if it wasn't already in the DOM
    if (!document.getElementById("cost-profit-container")) {
      salesView.appendChild(costProfitContainer);
    }
  
    localStorage.setItem("soldItems", JSON.stringify(soldItems)); // Update local storage
  
    // Reattach event listeners for unsell and delete buttons
    reattachEventListenersForSoldItems();
  };
  
  function reattachEventListenersForSoldItems() {
    document.querySelectorAll(".delete-sold-item-btn").forEach(button => {
      button.addEventListener("click", function() {
        const index = parseInt(this.getAttribute("data-index"));
        deleteSoldItem(index);
      });
    });
  
    document.querySelectorAll(".unsell-item-btn").forEach(button => {
      button.addEventListener("click", function() {
        const index = parseInt(this.getAttribute("data-index"));
        unsellItem(index);
      });
    });
  }
  


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

    salesTabBtn.addEventListener("click", switchToSalesView);
    salesTabBtn2.addEventListener("click", switchToSalesView);
    addItemForm.addEventListener("submit", handleNewItemSubmit);
    nextItemBtn.addEventListener("click", handleAddNewItem);
    boothFilter.addEventListener("change", () =>
      displayInventoryItems(searchInput.value.toLowerCase())
    );

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

  const updateBoothButtons = () => {
    const uniqueBooths = [...new Set(inventoryItems.map(item => item[5]))];
    const boothButtonsContainer = document.getElementById("booth-buttons-container");
    const currentBooth = document.getElementById("booth-filter").value;
  
    boothButtonsContainer.innerHTML = ""; // Clear existing buttons first
  
    uniqueBooths.forEach(booth => {
      if (booth) { // Check if booth is not undefined or null
        const button = document.createElement("button");
        button.textContent = booth;
        button.className = booth === currentBooth ? "active-booth" : ""; // Apply active class
        button.addEventListener("click", () => {
          document.getElementById("booth-filter").value = booth;
          toggleModal(booth); // Custom function to handle modal
          updateBoothButtons(); // Refresh buttons to indicate active booth
        });
        boothButtonsContainer.appendChild(button);
      }
    });
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
          item &&
          item[1] && // Ensure item name exists
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
    totalDisplay.innerHTML = `Total Cost: $${totalCost.toFixed(
      2
    )}<div class="tooltip">This is the cost of the items currently in your inventory</div>`;
    totalDisplay2.innerHTML = `Listing Price: $${totalListingPrice.toFixed(
      2
    )}<div class="tooltip">This is the total listing price of all the items in your inventory</div>`;
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

      const now = new Date();
      const soldItem = {
        id: inventoryItem[0],
        name: inventoryItem[1],
        description: inventoryItem[2],
        cost: inventoryItem[3],
        price: inventoryItem[4], // Assuming price is at index 4
        dateSold: now.toISOString(), // Capture the sale date
      };

      soldItems.push(soldItem);
      inventoryItems.splice(itemIndex, 1);

      localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
      localStorage.setItem("soldItems", JSON.stringify(soldItems));
      localStorage.setItem("totalSales", JSON.stringify(totalSales)); // Update total sales in local storage

      displayInventoryItems();
      displaySoldItems();
      displaySalesTotal(); // Make sure this function updates the UI with the new totalSales value
      generateSalesChart();
    }
  };
  window.sellItem = sellItem;

  // Function to aggregate sales data
  const aggregateSalesData = () => {
    const salesData = soldItems.reduce((acc, item) => {
      // Check if dateSold exists before splitting
      if (item.dateSold) {
        const saleDate = item.dateSold.split("T")[0]; // Extract date part
        if (acc[saleDate]) {
          acc[saleDate] += item.price;
        } else {
          acc[saleDate] = item.price;
        }
      }
      return acc;
    }, {});

    return Object.entries(salesData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .reduce(
        (acc, [date, total]) => {
          acc.labels.push(date);
          acc.data.push(total);
          return acc;
        },
        { labels: [], data: [] }
      );
  };

  // Function to generate sales chart
  const generateSalesChart = () => {
    const ctx = document.getElementById("salesChart").getContext("2d");
    const { labels, data } = aggregateSalesData();

    new Chart(ctx, {
      type: "line", // or 'bar', 'pie', etc., depending on your preference
      data: {
        labels: labels,
        datasets: [
          {
            label: "Sales Over Time",
            data: data,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  // Ensure this function is called appropriately, e.g., after sales data updates or on document load if applicable
  // Example: generateSalesChart();

  const displaySalesTotal = () => {
    salesTotal.innerHTML = `Sales: $${totalSales.toFixed(
      2
    )}<div class="tooltip">This is your total sales. <br><br>Click to see details</div>`;
  };

  const updateAppState = () => {
    saveInventoryItems();
    displayInventoryItems();
    updateBoothFilterOptions();
    updateBoothButtons();
    displaySalesTotal();
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

  // Assuming you have a modal element in your HTML with an id of 'items-modal' and a class 'hidden' to hide it
  // Also assuming there's an element inside the modal with an id of 'modal-content' to hold the item cards

  const toggleModal = (boothName) => {
    const modal = document.getElementById("items-modal");
    // Check if the modal is already visible and the same booth is clicked again
    if (
      !modal.classList.contains("hidden") &&
      modal.dataset.currentBooth === boothName
    ) {
      hideModal();
    } else {
      displayBoothItemsInModal(boothName);
    }
  };

  const displayBoothItemsInModal = (boothName) => {
    const modal = document.getElementById("items-modal");
    // Check if the modal is already displaying this booth's items
    if (
      !modal.classList.contains("hidden") &&
      modal.dataset.currentBooth === boothName
    ) {
      hideModal(); // If so, hide the modal and do not proceed further
      return;
    }

    const filteredItems = inventoryItems.filter(
      (item) => item[5] === boothName
    );
    const modalContent = document.getElementById("modal-content");
    modalContent.innerHTML = ""; // Clear previous content

    filteredItems.forEach((item) => {
      const itemCard = document.createElement("div");
      itemCard.className = "item-card";
      itemCard.innerHTML = `
        <div class="item-name">${item[1]}</div>
        <div class="item-cost">Cost: $${parseFloat(item[3]).toFixed(2)}</div>
        <div class="item-price">Price: $${parseFloat(item[4]).toFixed(2)}</div>
      `;

      // Add a click event listener for editing the item
      itemCard.addEventListener("click", () => {
        editItem(item[0]); // Ensure the editItem function is designed to fill in the item's details in your form
      });
      modalContent.appendChild(itemCard);
    });

    // Show the modal and set the current booth being displayed
    modal.dataset.currentBooth = boothName; // Store the current booth for comparison in subsequent clicks
    showModal();

    // Set the booth filter dropdown
    const boothFilterDropdown = document.getElementById("booth-filter");
    boothFilterDropdown.value = boothName; // This assumes boothName matches one of the options in the dropdown
    if (boothName === "all") {
      boothFilterDropdown.value = "all"; // If the modal is for all booths
    }

    // Refresh the inventory list to reflect the selected booth filter, if needed
    displayInventoryItems();
  };

  const showModal = () => {
    const modal = document.getElementById("items-modal");
    modal.classList.remove("hidden");
  };

  const hideModal = () => {
    const modal = document.getElementById("items-modal");
    modal.classList.add("hidden");
    modal.dataset.currentBooth = "";
  };

  // In your CSS, ensure you have styles for .hidden, .item-card, and #modal-content for a 3-column layout

  // JavaScript to toggle dark mode
  const toggleDarkMode = () => {
    const body = document.body;
    body.classList.toggle("dark-mode");
  };

  // Example: Assuming you have a button with id 'dark-mode-toggle'
  const darkModeToggleBtn = document.getElementById("dark-mode-toggle");
  darkModeToggleBtn.addEventListener("click", toggleDarkMode);

  const unsellItem = (index) => {
    const unsoldItem = soldItems.splice(index, 1)[0];

    // Reconstruct the item to match the inventory item structure
    const restoredInventoryItem = [
      unsoldItem.id, // Assuming the ID is at index 0
      unsoldItem.name, // Name at index 1
      unsoldItem.description || "", // Description or an empty string if not available
      unsoldItem.cost || 0, // Cost at index 3, ensure this exists or is set to a default
      unsoldItem.price, // Price at index 4
      unsoldItem.boothName || "", // Booth name or a default value
    ];

    // Add the reconstructed item back to inventory
    inventoryItems.push(restoredInventoryItem);
    totalSales -= unsoldItem.price; // Adjust the total sales

    // Update local storage to reflect changes
    localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
    localStorage.setItem("soldItems", JSON.stringify(soldItems));
    localStorage.setItem("totalSales", totalSales.toString());

    // Update UI
    displaySoldItems();
    displayInventoryItems();
    displaySalesTotal(); // Updates the sales total in both views
  };

  document.addEventListener("click", function (event) {
    if (event.target.matches(".unsell-item-btn")) {
      const index = parseInt(event.target.getAttribute("data-index"), 10);
      unsellItem(index);
    }
  });

  document.getElementById("view-all-items").addEventListener("click", () => {
    hideModal(); // Use your existing hideModal function to close the modal
    const boothFilterDropdown = document.getElementById("booth-filter");
    boothFilterDropdown.value = "all"; // Reset the booth filter to "all"
    displayInventoryItems(); // Refresh the inventory list to show all items
    updateBoothButtons(); // Refresh the booth buttons to remove any active state
  });
  

  init();
});
