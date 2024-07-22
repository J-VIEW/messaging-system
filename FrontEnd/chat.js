let currentContact = null;
let selectedContacts = new Set();
let isMultiSelectMode = false;

function loadContacts() {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data_type: "get_contacts" }),
  })
    .then((response) => {
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (data.contacts) {
        displayContacts(data.contacts);
      } else {
        showErrorMessage(data.message || "No contacts found");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage(
        "An error occurred while loading contacts. Please try again later."
      );
    });
}

function displayContacts(contacts) {
  const chatList = document.getElementById("chat_list") || createChatList();
  chatList.innerHTML = "";

  contacts.forEach((contact) => {
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.dataset.userId = contact.user_id;
    chatItem.innerHTML = `
      <input type="checkbox" class="contact-checkbox" style="display: none;">
      <img src="data:image/jpeg;base64,${contact.image}" alt="${contact.username}">
      <span>${contact.username}</span>
    `;
    chatItem.addEventListener("click", () => toggleContactSelection(contact));
    chatList.appendChild(chatItem);
  });

  // Add multi-select toggle button
  const multiSelectToggle = document.createElement("button");
  multiSelectToggle.id = "multiSelectToggle";
  multiSelectToggle.textContent = "Toggle Multi-Select";
  multiSelectToggle.addEventListener("click", toggleMultiSelectMode);
  chatList.insertBefore(multiSelectToggle, chatList.firstChild);

  // Add send to all button
  const sendToAllButton = document.createElement("button");
  sendToAllButton.id = "sendToAllButton";
  sendToAllButton.textContent = "Send to Selected";
  sendToAllButton.style.display = "block"; // Change this to "block"
  sendToAllButton.addEventListener("click", sendToSelectedContacts);
  chatList.insertBefore(sendToAllButton, chatList.firstChild);

  // Add file button and input
  const multiSelectFileButton = document.createElement("button");
  multiSelectFileButton.id = "multiSelectFileButton";
  multiSelectFileButton.textContent = "📎";
  multiSelectFileButton.style.display = "block"; // Make this visible
  chatList.insertBefore(multiSelectFileButton, sendToAllButton);

  const multiSelectFileInput = document.createElement("input");
  multiSelectFileInput.type = "file";
  multiSelectFileInput.id = "multiSelectFileInput";
  multiSelectFileInput.style.display = "none";
  chatList.insertBefore(multiSelectFileInput, multiSelectFileButton);

  // Add event listeners
  multiSelectFileButton.addEventListener("click", () =>
    multiSelectFileInput.click()
  );
  multiSelectFileInput.addEventListener(
    "change",
    handleMultiSelectFileSelection
  );
}

// Helper function to create chat list if it doesn't exist
function createChatList() {
  const innerLeftPanel = document.getElementById("inner_left_panel");
  const chatList = document.createElement("div");
  chatList.id = "chat_list";
  innerLeftPanel.appendChild(chatList);
  return chatList;
}

function sendToSelectedContacts() {
  if (selectedContacts.size === 0) {
    showErrorMessage("Please select at least one contact.");
    return;
  }

  const messageInput = document.getElementById("multiSelectMessageInput");
  const message = messageInput.value.trim();
  const file = document.getElementById("multiSelectFileInput").files[0];

  if (!message && !file) {
    showErrorMessage("Please enter a message or select a file to send.");
    return;
  }

  const sendPromises = Array.from(selectedContacts).map((contactId) => {
    const data = {
      data_type: "send_message",
      receiver: contactId,
      message: message,
    };

    if (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
          data.file = {
            name: file.name,
            type: file.type,
            data: event.target.result.split(",")[1],
          };
          sendMessageData(data).then(resolve).catch(reject);
        };
        reader.readAsDataURL(file);
      });
    } else {
      return sendMessageData(data);
    }
  });

  Promise.all(sendPromises)
    .then(() => {
      messageInput.value = "";
      document.getElementById("multiSelectFileInput").value = "";
      document.getElementById("multiSelectFileButton").textContent = "📎";
      showSuccessMessage("Message sent to selected contacts.");
    })
    .catch((error) => {
      console.error("Error sending messages:", error);
      showErrorMessage(
        "An error occurred while sending messages to some contacts."
      );
    });
}

//check
// Update the sendMessageData function to return a promise
function sendMessageData(data) {
  return fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || "Failed to send message");
      }
    });
}
//endcheck

// function showSuccessMessage(message) {
//   const successMessage = document.createElement("div");
//   successMessage.className = "success-message";
//   successMessage.textContent = message;
//   document.body.appendChild(successMessage);
//   setTimeout(() => {
//     successMessage.remove();
//   }, 3000);
// }

function toggleContactSelection(contact) {
  if (isMultiSelectMode) {
    const chatItem = document.querySelector(
      `.chat-item[data-user-id="${contact.user_id}"]`
    );
    const checkbox = chatItem.querySelector(".contact-checkbox");

    if (selectedContacts.has(contact.user_id)) {
      selectedContacts.delete(contact.user_id);
      checkbox.checked = false;
    } else {
      selectedContacts.add(contact.user_id);
      checkbox.checked = true;
    }
  } else {
    openChat(contact);
  }
}

function toggleMultiSelectMode() {
  isMultiSelectMode = !isMultiSelectMode;
  const checkboxes = document.querySelectorAll(".contact-checkbox");
  const sendToAllButton = document.getElementById("sendToAllButton");
  const multiSelectMessageArea = document.getElementById(
    "multiSelectMessageArea"
  );
  const multiSelectFileButton = document.getElementById(
    "multiSelectFileButton"
  );

  checkboxes.forEach((checkbox) => {
    checkbox.style.display = isMultiSelectMode ? "inline" : "none";
  });

  sendToAllButton.style.display = isMultiSelectMode ? "block" : "none";
  multiSelectMessageArea.style.display = isMultiSelectMode ? "block" : "none";
  multiSelectFileButton.style.display = isMultiSelectMode ? "block" : "none";

  if (!isMultiSelectMode) {
    selectedContacts.clear();
    checkboxes.forEach((checkbox) => (checkbox.checked = false));
  }
}

function showSuccessMessage(message) {
  const successMessage = document.createElement("div");
  successMessage.className = "success-message";
  successMessage.textContent = message;
  document.body.appendChild(successMessage);
  setTimeout(() => {
    successMessage.remove();
  }, 3000);
}

function showErrorMessage(message) {
  const errorMessage = document.createElement("div");
  errorMessage.className = "error-message";
  errorMessage.textContent = message;
  document.body.appendChild(errorMessage);
  setTimeout(() => {
    errorMessage.remove();
  }, 3000);
}

function openChat(contact) {
  if (isMultiSelectMode) {
    toggleContactSelection(contact);
    return;
  }
  currentContact = contact;
  console.log("Opening chat with:", currentContact);
  const innerRightPanel = document.getElementById("inner_right_panel");
  innerRightPanel.innerHTML = `
    <div class="chat-interface">
      <div class="chat-header">
        <img src="data:image/jpeg;base64,${contact.image}" alt="${
    contact.username
  }">
        <div class="user-info">
          <span class="username">${contact.username}</span>
          <span class="hobbies">Hobbies: ${
            contact.hobbies || "Not specified"
          }</span>
          <span class="quote">"${contact.quote || "No quote available"}"</span>
        </div>
      </div>
      <div id="messageArea" class="message-area"></div>
      <div class="input-area">
        <input type="text" id="messageInput" placeholder="Type your message...">
        <input type="file" id="fileInput" style="display: none;">
        <button id="fileButton">📎</button>
        <button id="sendButton">Send</button>
      </div>
    </div>
  `;

  innerRightPanel.classList.add("open");
  document.getElementById("sendButton").addEventListener("click", sendMessage);
  document
    .getElementById("fileButton")
    .addEventListener("click", () =>
      document.getElementById("fileInput").click()
    );
  document
    .getElementById("fileInput")
    .addEventListener("change", handleFileSelection);
  document
    .getElementById("messageInput")
    .addEventListener("keypress", handleEnterKey);

  // Load chat history when opening the chat
  loadChatHistory(contact.user_id);

  // Update message statuses when opening the chat
  updateMessageStatusesOnChatOpen();

  // Mark messages as seen when opening the chat
  markMessagesAsSeen(contact.user_id);

  // Start checking for new messages
  clearInterval(window.messageCheckInterval);
  window.messageCheckInterval = setInterval(checkForNewMessages, 5000);
}

function loadChatHistory(contactId) {
  const userId = sessionStorage.getItem("user_id");
  console.log(
    "Loading chat history. User ID:",
    userId,
    "Contact ID:",
    contactId
  );

  if (!userId || !contactId) {
    console.error("User ID or Contact ID is missing");
    showErrorMessage("User ID or Contact ID is missing");
    return;
  }

  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "get_chat_history",
      contact_id: contactId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Received chat history data:", data);
      if (data.success && data.messages) {
        const messageArea = document.getElementById("messageArea");
        messageArea.innerHTML = "";

        console.log("Number of messages:", data.messages.length);
        data.messages.forEach((msg) => {
          console.log("Processing message:", msg);
          const messageType =
            String(msg.sender) === String(userId) ? "sent" : "received";
          console.log(
            "Message type:",
            messageType,
            "Sender:",
            msg.sender,
            "User ID:",
            userId
          );

          let senderName, senderImage;

          if (messageType === "sent") {
            senderName = "You";
            senderImage = null; // Or use the logged-in user's image if available
          } else {
            senderName = currentContact.username;
            senderImage = `data:image/jpeg;base64,${currentContact.image}`;
          }

          displayMessage(
            msg.message,
            messageType,
            msg.msgid,
            msg.files ? JSON.parse(msg.files) : null,
            new Date(msg.date).toLocaleString(),
            senderName,
            senderImage
          );
        });

        messageArea.scrollTop = messageArea.scrollHeight;
        checkAndMarkSeenMessages();
      } else {
        console.error("Failed to load chat history:", data.error);
        showErrorMessage(data.error || "Failed to load chat history");
      }
    })
    .catch((error) => {
      console.error("Error loading chat history:", error);
      showErrorMessage("An error occurred while loading chat history");
    });
}

function sendMessageData(data) {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Server response:", result);
      if (result.success) {
        displayMessage(
          data.message,
          "sent",
          result.msgid,
          data.file,
          new Date().toLocaleString(),
          "You",
          null
        );
        updateMessageStatus(result.msgid, "sent");
        document.getElementById("messageInput").value = "";
        document.getElementById("fileInput").value = "";
        document.getElementById("fileButton").textContent = "📎";
      } else {
        console.error(
          "Failed to send message:",
          result.error || "Unknown error"
        );
        showErrorMessage(result.error || "Failed to send message");
      }
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      showErrorMessage("An error occurred while sending the message");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Set the session user_id in sessionStorage
  sessionStorage.setItem("user_id", currentUserId);
  loadContacts();
});

function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();
  const file = document.getElementById("fileInput").files[0];

  if (!message && !file) {
    showErrorMessage("Please enter a message or select a file to send.");
    return;
  }

  if (!currentContact) {
    showErrorMessage("Please select a contact.");
    return;
  }

  const data = {
    data_type: "send_message",
    receiver: currentContact.user_id,
    message: message,
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      data.file = {
        name: file.name,
        type: file.type,
        data: event.target.result.split(",")[1],
      };
      sendMessageData(data)
        .then((result) => {
          if (result.success) {
            displayMessage(
              data.message,
              "sent",
              result.msgid,
              data.file,
              new Date().toLocaleString(),
              "You",
              null
            );
            updateMessageStatus(result.msgid, "sent");
            messageInput.value = "";
            document.getElementById("fileInput").value = "";
            document.getElementById("fileButton").textContent = "📎";
          } else {
            showErrorMessage(result.error || "Failed to send message");
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          showErrorMessage("An error occurred while sending the message");
        });
    };
    reader.readAsDataURL(file);
  } else {
    sendMessageData(data)
      .then((result) => {
        if (result.success) {
          displayMessage(
            data.message,
            "sent",
            result.msgid,
            null,
            new Date().toLocaleString(),
            "You",
            null
          );
          updateMessageStatus(result.msgid, "sent");
          messageInput.value = "";
        } else {
          showErrorMessage(result.error || "Failed to send message");
        }
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        showErrorMessage("An error occurred while sending the message");
      });
  }
}

function displayMessage(
  message,
  type,
  msgId,
  file = null,
  timestamp,
  senderName,
  senderImage,
  senderId
) {
  let messageArea = document.getElementById("messageArea");
  if (!messageArea) {
    const innerRightPanel = document.getElementById("inner_right_panel");
    messageArea = document.createElement("div");
    messageArea.id = "messageArea";
    messageArea.className = "message-area";
    innerRightPanel.appendChild(messageArea);
  }

  const messageElement = document.createElement("div");
  messageElement.className = `message ${type}`;
  messageElement.id = `message_${msgId}`;
  messageElement.dataset.sender = senderId;

  let fileContent = "";
  if (file) {
    if (file.type.startsWith("image/")) {
      fileContent = `<img src="data:${file.type};base64,${file.data}" alt="Attached image" style="max-width: 200px; max-height: 200px;">`;
    } else if (file.type.startsWith("video/")) {
      fileContent = `<video controls style="max-width: 200px;"><source src="data:${file.type};base64,${file.data}" type="${file.type}"></video>`;
    } else {
      fileContent = `<a href="data:${file.type};base64,${file.data}" download="${file.name}">${file.name}</a>`;
    }
  }

  let statusSpan = "";
  if (type === "sent") {
    statusSpan = `<span class="status" id="status_${msgId}">✓</span>`;
  }

  messageElement.innerHTML = `
    <div class="message-content">
      <div class="message-header">
        ${senderImage ? `<img src="${senderImage}" alt="${senderName}">` : ""}
        <span class="username">${senderName}</span>
      </div>
      <div class="message-body">
        <p>${message}</p>
        ${fileContent}
      </div>
      <span class="timestamp">${timestamp}</span>
      ${statusSpan}
    </div>
    ${type === "sent" ? '<span class="delete-message">🗑️</span>' : ""}
  `;

  messageArea.appendChild(messageElement);
  messageArea.scrollTop = messageArea.scrollHeight;

  if (type === "sent") {
    messageElement
      .querySelector(".delete-message")
      .addEventListener("click", () => deleteMessage(msgId));
  }
  if (type === "received") {
    messageElement.dataset.unseen = "true";
  }
}

function sendMessageData(data) {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Server response:", result);
      if (result.success) {
        displayMessage(
          data.message,
          "sent",
          result.msgid,
          data.file,
          new Date().toLocaleString(),
          "You",
          null
        );
        updateMessageStatus(result.msgid, "sent");

        // Clear input fields if they exist
        const messageInput = document.getElementById("messageInput");
        const fileInput = document.getElementById("fileInput");
        const fileButton = document.getElementById("fileButton");

        if (messageInput) messageInput.value = "";
        if (fileInput) fileInput.value = "";
        if (fileButton) fileButton.textContent = "📎";
      } else {
        console.error(
          "Failed to send message:",
          result.error || "Unknown error"
        );
        showErrorMessage(result.error || "Failed to send message");
      }
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      showErrorMessage("An error occurred while sending the message");
    });
}

function setupRealTimeUpdates() {
  const eventSource = new EventSource("api.php?action=sse");

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (data.type === "message_status_update") {
      updateMessageStatus(data.msgid, data.status);
    } else if (data.type === "new_message") {
      if (data.sender_id === currentContact.user_id) {
        displayMessage(
          data.message,
          "received",
          data.msgid,
          data.file,
          new Date(data.timestamp).toLocaleString(),
          currentContact.username,
          `data:image/jpeg;base64,${currentContact.image}`,
          currentContact.user_id
        );
        markMessageAsSeen(data.msgid);
      } else {
        updateChatList(data.sender_id);
      }
    }
  };

  eventSource.onerror = function (error) {
    console.error("EventSource failed:", error);
    eventSource.close();
    setTimeout(setupRealTimeUpdates, 5000);
  };
}

function markMessageAsSeen(msgId) {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "mark_message_seen",
      msgid: msgId,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        console.log("Message marked as seen");
        const messageElement = document.getElementById(`message_${msgId}`);
        if (messageElement) {
          messageElement.dataset.seen = "true";
        }
      } else {
        console.error("Failed to mark message as seen:", result.error);
      }
    })
    .catch((error) => {
      console.error("Error marking message as seen:", error);
    });
}

function deleteMessage(msgId) {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "delete_message",
      msgid: msgId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById(`message_${msgId}`).remove();
      } else {
        showErrorMessage(data.error || "Failed to delete message");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while deleting the message");
    });
}

function handleFileSelection(event) {
  const fileName = event.target.files[0]?.name;
  if (fileName) {
    document.getElementById("fileButton").textContent = "📎 " + fileName;
  }
}

function handleEnterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
}

function updateMessageStatus(msgId, status) {
  const statusElement = document.getElementById(`status_${msgId}`);
  if (statusElement) {
    switch (status) {
      case "sent":
        statusElement.innerHTML = "✓";
        statusElement.style.color = "grey";
        break;
      case "received":
        statusElement.innerHTML = "✓✓";
        statusElement.style.color = "grey";
        break;
      case "seen":
        statusElement.innerHTML = "✓✓";
        statusElement.style.color = "blue";
        break;
    }
  }
}

let lastCheckTime = new Date().toISOString();

function checkForNewMessages() {
  if (!currentContact) return;

  const lastCheckTime =
    sessionStorage.getItem("lastCheckTime") || new Date(0).toISOString();

  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "check_new_messages",
      contact_id: currentContact.user_id,
      last_check_time: lastCheckTime,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.new_messages && result.new_messages.length > 0) {
        result.new_messages.forEach((message) => {
          displayMessage(
            message.message,
            "received",
            message.msgid,
            message.files ? JSON.parse(message.files) : null,
            new Date(message.timestamp).toLocaleString(),
            currentContact.username,
            `data:image/jpeg;base64,${currentContact.image}`,
            currentContact.user_id
          );
        });

        // Update status of sent messages to "received"
        document
          .querySelectorAll(".message.sent .status")
          .forEach((statusElement) => {
            if (statusElement.textContent === "✓") {
              statusElement.textContent = "✓✓";
              statusElement.style.color = "grey";
            }
          });

        const messageArea = document.getElementById("messageArea");
        messageArea.scrollTop = messageArea.scrollHeight;

        // Mark new messages as seen
        markMessagesAsSeen(currentContact.user_id);

        // Update last check time
        sessionStorage.setItem("lastCheckTime", new Date().toISOString());

        // Send acknowledgment to the server
        sendMessageAcknowledgment(result.new_messages.map((msg) => msg.msgid));
      }

      // Check for updated message statuses
      checkMessageStatuses();
    })
    .catch((error) => {
      console.error("Error checking for new messages:", error);
    });
}

function checkMessageStatuses() {
  if (!currentContact) return;

  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "check_message_statuses",
      contact_id: currentContact.user_id,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.updated_messages) {
        result.updated_messages.forEach((message) => {
          updateMessageStatus(message.msgid, message.status);
        });
      }
    })
    .catch((error) => {
      console.error("Error checking message statuses:", error);
    });
}

function sendMessageAcknowledgment(msgIds) {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "update_message_status",
      msg_ids: msgIds,
      status: "received",
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        console.log("Message status updated successfully");
      } else {
        console.error("Failed to update message status:", result.error);
      }
    })
    .catch((error) => {
      console.error("Error updating message status:", error);
    });
}

function checkAndMarkSeenMessages() {
  if (!currentContact) return;

  const unseenMessages = document.querySelectorAll(
    '.message.received[data-unseen="true"]'
  );
  const unseenMessageIds = Array.from(unseenMessages).map(
    (msg) => msg.id.split("_")[1]
  );

  if (unseenMessageIds.length > 0) {
    markMessagesAsSeen(unseenMessageIds);
    unseenMessages.forEach((msg) => (msg.dataset.unseen = "false"));
  }
}

function markMessagesAsSeen(contactId) {
  fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_type: "mark_messages_seen",
      contact_id: contactId,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        console.log("Messages marked as seen");
        document
          .querySelectorAll(`.message.received[data-sender="${contactId}"]`)
          .forEach((message) => {
            message.dataset.seen = "true";
          });
      } else {
        console.error("Failed to mark messages as seen:", result.error);
      }
    })
    .catch((error) => {
      console.error("Error marking messages as seen:", error);
    });
}

setInterval(() => {
  if (currentContact) {
    checkForNewMessages();
    checkMessageStatuses();
  }
}, 5000); // Check every 5 seconds

function updateMessageStatusUI(contactId, status) {
  const messages = document.querySelectorAll(
    `.message.received[data-sender="${contactId}"]`
  );
  messages.forEach((message) => {
    const statusElement = message.querySelector(".status");
    if (statusElement) {
      statusElement.textContent = "✓✓";
      statusElement.style.color = "blue";
    }
  });
}

function updateMessageStatusesOnChatOpen() {
  document
    .querySelectorAll(".message.sent .status")
    .forEach((statusElement) => {
      if (statusElement.textContent === "✓") {
        statusElement.textContent = "✓✓";
        statusElement.style.color = "grey";
      }
    });
}

function updateChatList(senderId) {
  const chatItem = document.getElementById(`chat_item_${senderId}`);
  if (chatItem) {
    const unreadBadge =
      chatItem.querySelector(".unread-badge") || document.createElement("span");
    unreadBadge.className = "unread-badge";
    const currentCount = parseInt(unreadBadge.textContent) || 0;
    unreadBadge.textContent = currentCount + 1;
    chatItem.appendChild(unreadBadge);
  } else {
    getUserInfo(senderId).then((userInfo) => {
      addToChatList(userInfo);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  sessionStorage.setItem("user_id", currentUserId);
  loadContacts();
  document.body.addEventListener("click", (e) => {
    if (
      !e.target.closest("#chat_list") &&
      !e.target.closest("#multiSelectToggle")
    ) {
      isMultiSelectMode = false;
      const checkboxes = document.querySelectorAll(".contact-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.style.display = "none";
        checkbox.checked = false;
      });
      selectedContacts.clear();
      document.getElementById("sendToAllButton").style.display = "none";
    }
  });
  const multiSelectSendButton = document.getElementById(
    "multiSelectSendButton"
  );
  const multiSelectFileButton = document.getElementById(
    "multiSelectFileButton"
  );
  const multiSelectFileInput = document.getElementById("multiSelectFileInput");

  multiSelectSendButton.addEventListener("click", sendToSelectedContacts);
  multiSelectFileButton.addEventListener("click", () =>
    multiSelectFileInput.click()
  );
  multiSelectFileInput.addEventListener(
    "change",
    handleMultiSelectFileSelection
  );

  const messageArea = document.getElementById("messageArea");
  if (messageArea) {
    messageArea.addEventListener("scroll", checkAndMarkSeenMessages);
    messageArea.addEventListener("click", checkAndMarkSeenMessages);
  }
});

function handleMultiSelectFileSelection(event) {
  const fileName = event.target.files[0]?.name;
  if (fileName) {
    document.getElementById("multiSelectFileButton").textContent =
      "📎 " + fileName;
  }
}

document.addEventListener("DOMContentLoaded", loadContacts);
setInterval(checkNewMessages, 5000);
setInterval(checkForNewMessages, 5000);

setupRealTimeUpdates();

document.addEventListener("DOMContentLoaded", loadContacts);

document.addEventListener("DOMContentLoaded", () => {
  sessionStorage.setItem("user_id", currentUserId);
  loadContacts();
  document.body.addEventListener("click", (e) => {
    if (
      !e.target.closest("#chat_list") &&
      !e.target.closest("#multiSelectToggle")
    ) {
      isMultiSelectMode = false;
      const checkboxes = document.querySelectorAll(".contact-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.style.display = "none";
        checkbox.checked = false;
      });
      selectedContacts.clear();
      document.getElementById("sendToAllButton").style.display = "none";
    }
  });
  const multiSelectSendButton = document.getElementById(
    "multiSelectSendButton"
  );
  const multiSelectFileButton = document.getElementById(
    "multiSelectFileButton"
  );
  const multiSelectFileInput = document.getElementById("multiSelectFileInput");

  multiSelectSendButton.addEventListener("click", sendToSelectedContacts);
  multiSelectFileButton.addEventListener("click", () =>
    multiSelectFileInput.click()
  );
  multiSelectFileInput.addEventListener(
    "change",
    handleMultiSelectFileSelection
  );
});

function handleMultiSelectFileSelection(event) {
  const fileName = event.target.files[0]?.name;
  if (fileName) {
    document.getElementById("multiSelectFileButton").textContent =
      "📎 " + fileName;
  }
}
