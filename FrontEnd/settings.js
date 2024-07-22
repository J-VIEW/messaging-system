document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("settings_form");
  const removeProfilePicButton = document.getElementById("remove_profile_pic");
  const removeProfilePicFlag = document.getElementById(
    "remove_profile_pic_flag"
  );
  const profilePicInput = document.getElementById("profile_pic_input");
  const currentProfilePic = document.getElementById("current_profile_pic");

  if (removeProfilePicButton && removeProfilePicFlag) {
    console.log("Remove profile pic button found");
    removeProfilePicButton.addEventListener("click", function () {
      console.log("Remove profile pic button clicked");
      // Show a confirmation dialog
      if (confirm("Are you sure you want to remove your profile picture?")) {
        console.log("User confirmed profile pic removal");
        // Send a request to delete the profile picture
        sendData({
          data_type: "delete_profile_pic",
        })
          .then((result) => {
            if (result.data_type === "success") {
              // Update the UI
              if (currentProfilePic) {
                // Set the src to the default image path returned by the server
                currentProfilePic.src = result.default_image_path;
                currentProfilePic.style.display = "block"; // Ensure it's visible
              }
              if (profilePicInput) {
                profilePicInput.value = ""; // Clear any selected file
              }
              // Update the main profile picture as well
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
      } else {
        console.log("Remove profile pic button or flag not found");
      }
    });
  }

  if (profilePicInput) {
    profilePicInput.addEventListener("change", handleProfilePicInput);
  }

  if (form) {
    form.addEventListener("submit", handleSettingsFormSubmit);
  }

  loadUserData();
});

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
    remove_profile_pic: formData.get("remove_profile_pic"),
  };

  // Check if any data has changed
  const currentData = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const hasChanges = Object.keys(data).some(
    (key) => data[key] !== currentData[key]
  );

  if (
    !hasChanges &&
    !formData.get("current_password") &&
    !formData.get("new_password")
  ) {
    showErrorMessage("No changes detected");
    return;
  }

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
        loadUserDataForSettings(); // Reload user data after successful update
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
      } else {
        showErrorMessage("Unexpected response from server");
        console.error("Unexpected response:", result);
      }
    })
    .catch((error) => {
      console.error("Error updating settings:", error);
      showErrorMessage(
        "An error occurred while updating settings: " + error.message
      );
    });
}

function loadUserDataForSettings() {
  sendData({ data_type: "user_info" })
    .then((result) => {
      if (result.data_type === "user_info") {
        // Update form fields
        document.getElementById("username").value = result.username;
        document.getElementById("email").value = result.email;

        // Update gender radio buttons
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        genderInputs.forEach((input) => {
          if (input.value.toLowerCase() === result.gender.toLowerCase()) {
            input.checked = true;
            input.closest(".gender-option").classList.add("selected");
          } else {
            input.checked = false;
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

        // Update main UI elements
        updateUserInfo(
          result.username,
          result.email,
          result.gender,
          result.user_id,
          result.image
        );

        // Store only essential data
        try {
          const essentialUserData = {
            username: result.username,
            email: result.email,
            gender: result.gender,
            user_id: result.user_id,
            // Note: We're not storing the image here
          };
          sessionStorage.setItem("userData", JSON.stringify(essentialUserData));
        } catch (e) {
          console.warn("Failed to store user data in sessionStorage:", e);
          // Optionally, you can try to store in localStorage as a fallback
          try {
            localStorage.setItem("userData", JSON.stringify(essentialUserData));
          } catch (e) {
            console.warn("Failed to store user data in localStorage:", e);
          }
        }

        // Update other UI elements if they exist
        const userNameElement = document.getElementById("user_name");
        const userEmailElement = document.getElementById("useremail");
        const profilePic = document.getElementById("profile_picture");

        if (userNameElement) userNameElement.textContent = result.username;
        if (userEmailElement) userEmailElement.textContent = result.email;
        if (profilePic && result.image) {
          profilePic.src = `data:image/jpeg;base64,${result.image}`;
        }

        console.log("User data loaded successfully");
      } else {
        showErrorMessage("Failed to load user data");
        console.error("Unexpected response when loading user data:", result);
      }
    })
    .catch((error) => {
      console.error("Error loading user data:", error);
      showErrorMessage(
        "An error occurred while loading user data: " + error.message
      );
    });
}

function showCelebration() {
  const celebration = document.createElement("div");
  celebration.className = "celebration";
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    celebration.appendChild(confetti);
  }
  document.body.appendChild(celebration);
  setTimeout(() => celebration.remove(), 5000);
}

function addCelebrationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .celebration {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    }

    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: #f00;
      animation: fall 3s linear infinite;
    }

    @keyframes fall {
      to {
        transform: translateY(100vh) rotate(720deg);
      }
    }
  `;
  document.head.appendChild(style);
}

// Call this function to add the styles
addCelebrationStyles();

function sendData(data) {
  console.log("Sending data:", data);
  return fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((text) => {
      //console.log("Raw response:", text);
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        throw new Error("Invalid JSON response: " + text);
      }
    })
    .catch((error) => {
      console.error("Error sending data:", error);
      showErrorMessage("An error occurred: " + error.message);
      throw error;
    });
}

function handleResult(result) {
  if (result.data_type === "success") {
    showSuccessMessage(result.message);
    loadUserDataForSettings();
    updateUserInfo(
      result.username,
      result.email,
      result.gender,
      result.user_id,
      result.image
    );
    showCelebration();
  } else if (result.data_type === "error_msg") {
    showErrorMessage(result.message);
  }
}

function loadUserData() {
  sendData({ data_type: "user_info" });
}

function updateUserInfo(username, email, gender, userId, image) {
  const userNameElement = document.getElementById("user_name");
  const userEmailElement = document.getElementById("useremail");
  const profilePic = document.getElementById("profile_picture");

  if (userNameElement) userNameElement.textContent = username;
  if (userEmailElement) userEmailElement.textContent = email;
  if (profilePic && image) {
    profilePic.src = `data:image/jpeg;base64,${image}`;
  }

  sessionStorage.setItem("user_id", userId);
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("user_email", email);
  sessionStorage.setItem("user_gender", gender);
  sessionStorage.setItem("user_image", image);
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

function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function addMessageStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .success-message, .error-message {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 1000;
    }
    .success-message {
      background-color: #4CAF50;
    }
    .error-message {
      background-color: #f44336;
    }
  `;
  document.head.appendChild(style);
}

addMessageStyles();

async function readData() {
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
        return data.content;
      }
    } else {
      console.error("HTTP error:", response.statusText);
    }
  } catch (error) {
    console.error("AJAX error:", error);
  }
}

// Add this event listener to handle gender selection
document.addEventListener("DOMContentLoaded", function () {
  const genderOptions = document.querySelectorAll(".gender-option");
  genderOptions.forEach((option) => {
    option.addEventListener("click", function () {
      genderOptions.forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
      this.querySelector('input[type="radio"]').checked = true;
    });
  });
});
