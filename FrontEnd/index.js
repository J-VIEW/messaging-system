function checkLoginStatus() {
  const userId = sessionStorage.getItem("user_id");
  if (!userId) {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  checkLoginStatus();
  initializeApp();
  initializeEventListeners();
});

function initializeApp() {
  console.log("Initializing app...");
  checkLoggedIn();
  loadUserInfo();
}

let currentPage = 1;
const contactsPerPage = 20;

function loadUserInfo() {
  const userId = sessionStorage.getItem("user_id");
  const username = sessionStorage.getItem("username");
  const email = sessionStorage.getItem("user_email");
  const gender = sessionStorage.getItem("user_gender");
  const image = sessionStorage.getItem("user_image");

  if (userId && username) {
    updateUserInfo(username, email, gender, userId, image);
  } else {
    console.log("User info not found in session storage");
  }
}

function checkLoggedIn() {
  console.log("Checking login status...");
  fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data_type: "login_status" }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((text) => {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        console.log("Raw response:", text);
        throw new Error("Invalid JSON response");
      }
    })
    .then((data) => {
      console.log("Check login response:", data);
      if (data.logged_in) {
        updateUserInfo(
          data.username,
          data.email,
          data.gender,
          data.user_id,
          data.image,
          data.interests, // New field
          data.quote // New field
        );
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("user_email", data.email);
        sessionStorage.setItem("user_gender", data.gender);
        if (data.image) {
          sessionStorage.setItem("user_image", data.image);
        }
        sessionStorage.setItem(
          "user_interests",
          JSON.stringify(data.interests)
        ); // Store as JSON string
        sessionStorage.setItem("user_quote", data.quote);
      } else {
        window.location.href = "login.html";
      }
    })
    .catch((error) => {
      console.error("Error checking login status:", error);
      showErrorMessage("An error occurred while checking login status.");
    });
}

function getDefaultProfilePic(gender) {
  switch (gender.toLowerCase()) {
    case "female":
      return "User-Interface/icons/female.jpeg";
    case "male":
      return "User-Interface/icons/male.jpg";
    default:
      return "User-Interface/icons/default.jpg";
  }
}

function getUserInfo(find, type) {
  const data = {
    find: find,
    data_type: type,
  };
  sendData(data);
}

function send_data(data, type) {
  data.data_type = type;
  const url = "../FrontEnd/api.php";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text(); // Change this from response.json()
    })
    .then((text) => {
      console.log("Raw response:", text); // Log the raw response
      return JSON.parse(text); // Then parse it as JSON
    })
    .then((result) => {
      handle_result(result);
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred. Please try again later.");
    });
}
function handleResult(result) {
  if (result.data_type === "success") {
    updateUserInfo(result.username, result.email, result.gender, result.image);
    updateProfilePic(result.user_id);
  }
  console.log("handle_result called with:", result);
  if (result.data_type === "user_info") {
    console.log("User info received:", result);
    if (result.logged_in) {
      updateUserInfo(
        result.username,
        result.email,
        result.gender,
        result.image
      );
      if (result.user_id) {
        updateProfilePic(result.user_id);
      }
    } else {
      console.log("User not logged in, redirecting to login page");
      window.location.href = "./login.html";
    }
  } else if (result.data_type === "error_msg") {
    console.error("Error received:", result.message);
    showErrorMessage(result.message);
  }
}

function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showLoadingModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function hideLoadingModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function _(id) {
  const element = document.getElementById(id.replace("#", ""));
  if (!element) {
    console.warn(`Element with id '${id}' not found`);
  }
  return element;
}

async function readData() {
  const innerPanel = _("inner_left_panel");
  if (!innerPanel) return;

  try {
    const response = await fetch("../FrontEnd/api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data_type: "read_data" }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("read_data response:", data);
      if (data.data_type === "error_msg") {
        console.error("API error:", data.message);
      } else {
        innerPanel.innerHTML = data.content || "";
      }
    } else {
      console.error("HTTP error:", response.statusText);
    }
  } catch (error) {
    console.error("AJAX error:", error);
  }
}

function initializeEventListeners() {
  const modal = _("logoutModal");
  const logoutLabel = _("label_logout");
  const confirmButton = _("confirmLogout");
  const cancelButton = _("cancelLogout");

  if (logoutLabel) {
    logoutLabel.addEventListener("click", function (event) {
      event.preventDefault();
      if (modal) modal.style.display = "block";
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      if (modal) modal.style.display = "none";
    });
  }

  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      fetch("../FrontEnd/api.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data_type: "logout" }),
      })
        .then((response) => response.json())
        .then((result) => {
          console.log("Logout response:", result);
          if (result.data_type === "success") {
            clearChatListMemory(); // Add this line
            sessionStorage.clear();
            window.location.href = "./login.html";
          } else {
            console.error("Logout failed:", result.message);
            if (modal) modal.style.display = "none";
          }
        })
        .catch((error) => {
          console.error("AJAX error:", error);
          alert("An error occurred while logging out");
          if (modal) modal.style.display = "none";
        });
    });
  }

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  const chatLabel = _("label_chat");
  const contactsLabel = _("label_contacts");
  const settingsLabel = _("label_settings");

  function clearInnerLeftPanel() {
    const innerLeftPanel = _("inner_left_panel");
    if (innerLeftPanel) {
      innerLeftPanel.innerHTML = "";
    }
  }

  function closeChat() {
    const innerRightPanel = document.getElementById("inner_right_panel");
    innerRightPanel.classList.remove("open");
    innerRightPanel.dataset.currentContact = "";
    setTimeout(() => {
      innerRightPanel.innerHTML = "";
    }, 300); // Wait for the transition to complete before clearing content
  }

  if (chatLabel) {
    chatLabel.addEventListener("click", function () {
      closeChat();
      clearInnerLeftPanel();
      loadChatListFromMemory();
    });
  }

  function clearChatListMemory() {
    localStorage.removeItem("chatList");
    chatListMemory = {};
  }

  if (contactsLabel) {
    contactsLabel.addEventListener("click", function () {
      closeChat();
      clearInnerLeftPanel();
      const innerLeftPanel = _("inner_left_panel");
      if (innerLeftPanel) {
        innerLeftPanel.classList.add("slide-out");
        setTimeout(() => {
          showLoadingModal();
          loadContacts();
          innerLeftPanel.classList.remove("slide-out");
          innerLeftPanel.classList.add("slide-in");
          hideLoadingModal();
        }, 300);
      }
    });
  }

  if (settingsLabel) {
    settingsLabel.addEventListener("click", function () {
      closeChat();
      clearInnerLeftPanel();

      const settingsContainer = document.getElementById("settings_container");
      const innerLeftPanel = document.getElementById("inner_left_panel");
      if (settingsContainer && innerLeftPanel) {
        innerLeftPanel.style.opacity = 0;
        setTimeout(() => {
          innerLeftPanel.innerHTML = settingsContainer.innerHTML;
          loadUserDataForSettings();
          initializeSettings(); // This line initializes the settings
          innerLeftPanel.style.opacity = 1;
          innerLeftPanel.querySelector("#settings_wrapper").style.animation =
            "scaleIn 0.3s ease-out";
        }, 300);
      }
    });
  }
}

/**
 * Initializes the settings form and its components.
 * This function sets up event listeners for various form elements
 * and prepares the form for user interaction.
 */
function initializeSettings() {
  // Get references to form elements
  const form = document.getElementById("settings_form");
  const removeProfilePicButton = document.getElementById("remove_profile_pic");
  const removeProfilePicFlag = document.getElementById(
    "remove_profile_pic_flag"
  );
  const profilePicInput = document.getElementById("profile_pic_input");
  const genderOptions = document.querySelectorAll(".gender-option");

  // Set up event listener for profile picture removal
  if (removeProfilePicButton && removeProfilePicFlag) {
    removeProfilePicButton.addEventListener("click", function () {
      if (confirm("Are you sure you want to remove your profile picture?")) {
        sendData({ data_type: "delete_profile_pic" })
          .then((result) => {
            if (result.data_type === "success") {
              const currentProfilePic = document.getElementById(
                "current_profile_pic"
              );
              if (currentProfilePic) {
                currentProfilePic.src = result.default_image_path;
                currentProfilePic.style.display = "block";
              }
              if (profilePicInput) {
                profilePicInput.value = "";
              }
              const mainProfilePic = document.getElementById("profile_picture");
              if (mainProfilePic) {
                mainProfilePic.src = result.default_image_path;
              }
              showSuccessMessage("Profile picture removed successfully");
            } else {
              showErrorMessage(
                result.message || "Failed to remove profile picture"
              );
            }
          })
          .catch((error) => {
            console.error("Error removing profile picture:", error);
            showErrorMessage(
              "An error occurred while removing the profile picture"
            );
          });
      }
    });
  }

  // Set up event listener for profile picture input change
  if (profilePicInput) {
    profilePicInput.addEventListener("change", handleProfilePicInput);
  }

  genderOptions.forEach((option) => {
    option.addEventListener("click", function () {
      genderOptions.forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
      this.querySelector('input[type="radio"]').checked = true;
      console.log(
        "Gender selected:",
        this.querySelector('input[type="radio"]').value.toLowerCase()
      );
    });
  });

  // Set up event listener for form submission
  if (form) {
    form.addEventListener("submit", handleSettingsFormSubmit);
  }
}

function loadUserDataForSettings() {
  sendData({ data_type: "user_info" })
    .then((result) => {
      if (result.data_type === "user_info") {
        updateUserInfo(
          result.username,
          result.email,
          result.gender,
          result.user_id,
          result.image
        );
        // Update form fields
        document.getElementById("username").value = result.username;
        document.getElementById("email").value = result.email;
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        genderInputs.forEach((input) => {
          if (input.value === result.gender) {
            input.checked = true;
            input.closest(".gender-option").classList.add("selected");
          } else {
            input.closest(".gender-option").classList.remove("selected");
          }
        });
        // Update profile picture in settings
        const currentProfilePic = document.getElementById(
          "current_profile_pic"
        );
        if (currentProfilePic && result.image) {
          currentProfilePic.src = `data:image/jpeg;base64,${result.image}`;
          currentProfilePic.style.display = "block";
        }
      }
    })
    .catch((error) => {
      console.error("Error loading user data:", error);
      showErrorMessage("An error occurred while loading user data");
    });
}

function handleProfilePicInput(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const currentProfilePic = document.getElementById("current_profile_pic");
      if (currentProfilePic) {
        currentProfilePic.src = e.target.result;
        currentProfilePic.style.display = "block";
      }
    };
    reader.readAsDataURL(file);
  }
}

function handleSettingsFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = {
    data_type: "settings",
    username: formData.get("username"),
    email: formData.get("email"),
    gender: formData.get("gender"),
  };

  // Password change validation and addition
  const currentPassword = form.current_password.value;
  const newPassword = form.new_password.value;
  const confirmPassword = form.confirm_password.value;

  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword) {
      showErrorMessage("Please enter your current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorMessage("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showErrorMessage("New password must be at least 8 characters long");
      return;
    }
    data.current_password = currentPassword;
    data.new_password = newPassword;
  }

  const profilePicInput = document.getElementById("profile_pic_input");
  if (profilePicInput && profilePicInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function (event) {
      data.profile_pic = event.target.result.split(",")[1]; // Get base64 data
      sendDataAndUpdateSettings(data);
    };
    reader.readAsDataURL(profilePicInput.files[0]);
  } else {
    sendDataAndUpdateSettings(data);
  }

  // Clear password fields after submission
  form.current_password.value = "";
  form.new_password.value = "";
  form.confirm_password.value = "";
}

function sendDataAndUpdateSettings(data) {
  sendData(data)
    .then((result) => {
      if (result.data_type === "success") {
        showSuccessMessage(result.message);
        updateUserInfo(
          result.username,
          result.email,
          result.gender,
          result.user_id,
          result.image
        );
        // Update the main profile picture
        const mainProfilePic = document.getElementById("profile_picture");
        if (mainProfilePic && result.image) {
          mainProfilePic.src = `data:image/jpeg;base64,${result.image}`;
        }
      } else if (result.data_type === "error_msg") {
        showErrorMessage(result.message);
      }
    })
    .catch((error) => {
      console.error("Error updating settings:", error);
      showErrorMessage("An error occurred while updating settings");
    });
}

function loadUserData() {
  fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data_type: "user_info" }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.data_type === "user_info") {
        // Update user info in the sidebar
        const userNameElement = document.getElementById("user_name");
        const userEmailElement = document.getElementById("useremail");
        const profilePictureElement =
          document.getElementById("profile_picture");

        if (userNameElement) userNameElement.textContent = data.username;
        if (userEmailElement) userEmailElement.textContent = data.email;
        if (profilePictureElement && data.image) {
          profilePictureElement.src = `data:image/jpeg;base64,${data.image}`;
        }

        // Update settings form
        const usernameInput = document.getElementById("username");
        const emailInput = document.getElementById("email");
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        const currentProfilePic = document.getElementById(
          "current_profile_pic"
        );

        if (usernameInput) usernameInput.value = data.username;
        if (emailInput) emailInput.value = data.email;
        genderInputs.forEach((input) => {
          if (input.value === data.gender) {
            input.checked = true;
          }
        });
        if (currentProfilePic && data.image) {
          currentProfilePic.src = `data:image/jpeg;base64,${data.image}`;
          currentProfilePic.style.display = "block";
        }

        // Store user data in session storage
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("user_email", data.email);
        sessionStorage.setItem("user_gender", data.gender);
        sessionStorage.setItem("user_image", data.image);
      } else {
        console.error("Unexpected response:", data);
      }
    })
    .catch((error) => {
      console.error("Error loading user data:", error);
      showErrorMessage("Failed to load user data");
    });
}

function updateUserInfo(username, email, gender, userId, image) {
  document.getElementById("user_name").textContent = username;
  document.getElementById("useremail").textContent = email;
  const profilePic = document.getElementById("profile_picture");
  if (profilePic && image) {
    profilePic.src = `data:image/jpeg;base64,${image}`;
  }
  sessionStorage.setItem("user_id", userId);
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("user_email", email);
  sessionStorage.setItem("user_gender", gender);
  sessionStorage.setItem("user_image", image);
}

// Add these styles to make the settings container look beautiful
function addSettingsStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #settings_wrapper {
      font-family: Arial, sans-serif;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    #settings_wrapper h2 {
      text-align: center;
      color: #333;
    }

    #settings_form input[type="text"],
    #settings_form input[type="email"],
    #settings_form input[type="password"] {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }

    #gender_div {
      margin-bottom: 10px;
    }

    #gender_div p {
      margin-bottom: 5px;
    }

    #profile_pic_div {
      margin-bottom: 15px;
    }

    #current_profile_pic {
      max-width: 100px;
      max-height: 100px;
      margin-bottom: 10px;
    }

    #remove_profile_pic {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }

    #save_changes_button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    }

    #save_changes_button:hover {
      background-color: #45a049;
    }
  `;
  document.head.appendChild(style);
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", function () {
  addSettingsStyles();
  initializeEventListeners();
});

function showInfoMessage(message) {
  const infoDiv = document.createElement("div");
  infoDiv.className = "info-message";
  infoDiv.textContent = message;
  document.body.appendChild(infoDiv);
  setTimeout(() => {
    infoDiv.remove();
  }, 5000);
}

function showSuccessMessage(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => {
    successDiv.remove();
  }, 5000);
}

function handleApiResponse(response) {
  if (response.data_type === "error_msg") {
    showErrorMessage(response.message);
  } else if (response.data_type === "success") {
    showSuccessMessage(response.message);
  } else if (response.data_type === "info_msg") {
    showInfoMessage(response.message);
  } else {
    console.log("Unhandled response type:", response.data_type);
  }
}

function loadUserImage() {
  fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data_type: "get_image" }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.data_type === "image") {
        const imageElement = document.getElementById("profile_picture");
        if (imageElement) {
          imageElement.src = data.image_path;
        }
      } else {
        console.error("Failed to load user image:", data.message);
      }
    })
    .catch((error) => {
      console.error("Error loading user image:", error);
    });
}

/**
 * handling messaging code
 */

function promptUserDescription() {
  const hobbies = prompt(
    "Please enter your hobbies/interests (comma-separated):"
  );
  const quote = prompt("Please enter your favorite quote:");

  if (hobbies && quote) {
    fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data_type: "update_user_description",
        hobbies: hobbies,
        quote: quote,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccessMessage("Profile updated successfully");
        } else {
          showErrorMessage(data.error);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showErrorMessage("Failed to update profile");
      });
  }
}

function toggleChatVisibility(panel) {
  if (panel.style.display === "none") {
    panel.style.display = "block";
    panel.classList.add("open");
  } else {
    panel.style.display = "none";
    panel.classList.remove("open");
  }
}

function createChatList() {
  const innerLeftPanel = document.getElementById("inner_left_panel");
  innerLeftPanel.innerHTML = "";

  const chatList = document.createElement("div");
  chatList.id = "chat_list";
  chatList.className = "chat-list";
  innerLeftPanel.appendChild(chatList);

  return chatList;
}

function showChatList() {
  const chatLabel = document.getElementById("label_chat");
  if (chatLabel) {
    chatLabel.click();
  }
}

let chatListMemory = {};

function addToChatList(contact) {
  const chatList = document.getElementById("chat_list") || createChatList();

  if (!chatListMemory[contact.username]) {
    chatListMemory[contact.username] = contact;

    const chatItem = document.createElement("div");
    chatItem.id = `chat_item_${contact.username}`;
    chatItem.className = "chat-item";
    chatItem.innerHTML = `
          <img src="data:image/jpeg;base64,${contact.image}" alt="${contact.username}">
          <span>${contact.username}</span>
      `;
    chatItem.addEventListener("click", () => openChat(contact));
    chatList.appendChild(chatItem);

    // Store in localStorage
    localStorage.setItem("chatList", JSON.stringify(chatListMemory));
  }

  openChat(contact);
  showChatList();
}

function loadChatListFromMemory() {
  const storedChatList = localStorage.getItem("chatList");
  if (storedChatList) {
    chatListMemory = JSON.parse(storedChatList);
  }

  const chatList = document.getElementById("chat_list") || createChatList();
  chatList.innerHTML = "";

  for (const username in chatListMemory) {
    const contact = chatListMemory[username];
    const chatItem = document.createElement("div");
    chatItem.id = `chat_item_${contact.username}`;
    chatItem.className = "chat-item";
    chatItem.innerHTML = `
          <img src="data:image/jpeg;base64,${contact.image}" alt="${contact.username}">
          <span>${contact.username}</span>
      `;
    chatItem.addEventListener("click", () => openChat(contact));
    chatList.appendChild(chatItem);
  }
}

const style = document.createElement("style");
style.textContent = `
  #inner_right_panel {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
  }
  #inner_right_panel.open {
    width: 50%; /* Adjust this value as needed */
    display: block;
  }
  #inner_right_panel:not(.open) {
    width: 0;
    display: none;
  }
  .chat-header {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f0f0f0;
  }
  .chat-header img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 10px;
  }
  .user-info {
    display: flex;
    flex-direction: column;
  }
  .username {
    font-weight: bold;
    font-size: 1.1em;
  }
  .hobbies, .quote {
    font-size: 0.9em;
    color: #666;
  }
  .quote {
    font-style: italic;
  }
`;
document.head.appendChild(style);
