<?php
require_once '../BackEnd/initialize.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$DB = Database::getInstance();

$user_id = filter_input(INPUT_POST, 'user_id', FILTER_SANITIZE_NUMBER_INT);
$entered_code = trim(htmlspecialchars($_POST['code'] ?? '', ENT_QUOTES, 'UTF-8'));

// Log received data
error_log("Received user_id: " . $user_id);
error_log("Received code: " . $entered_code);

function display_message($message, $is_error = false) {
    $color = $is_error ? '#ff4444' : '#44aa44';
    echo "<!DOCTYPE html>
    <html lang='en'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Verification Result</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f0f2f5;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .message-container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .message {
                color: $color;
                font-size: 1.1rem;
                margin-bottom: 1rem;
            }
        </style>
    </head>
    <body>
        <div class='message-container'>
            <p class='message'>$message</p>
        </div>
    </body>
    </html>";
}

if (empty($user_id) || empty($entered_code)) {
    display_message("Invalid request. Please try again.", true);
    exit;
}

$query = "SELECT token, username, email, gender FROM users WHERE user_id = :user_id";
$data = [':user_id' => $user_id];

try {
    $result = $DB->read_from_db($query, $data);
    
    // Log query and result for debugging
    error_log("Query: " . $query);
    error_log("Query result: " . print_r($result, true));

    if (!$result || count($result) === 0) {
        error_log("No user found for user_id: " . $user_id);
        display_message("User not found. Please try again.", true);
        exit;
    }

    $stored_code = $result[0]['token'];
    $username = $result[0]['username'];
    $email = $result[0]['email'];
    $gender = $result[0]['gender'];

    if ($entered_code === $stored_code) {
        $update_query = "UPDATE users SET verified = 1, token = NULL WHERE user_id = :user_id";
        $update_data = [':user_id' => $user_id];
        $update_result = $DB->write_to_db($update_query, $update_data);

        if ($update_result) {
            session_start();
            $_SESSION['user_id'] = $user_id;
            $_SESSION['username'] = $username;
            $_SESSION['email'] = $email;
            $_SESSION['gender'] = $gender;
            $_SESSION['verified'] = true;

            display_message("Account verified successfully! Redirecting to index page...");
            echo "<script>setTimeout(function() { window.location.href = 'index.html'; }, 3000);</script>";
        } else {
            display_message("An error occurred while verifying your account. Please try again.", true);
        }
    } else {
        display_message("Invalid code. Please try again.", true);
    }
} catch (Exception $e) {
    error_log("Database error: " . $e->getMessage());
    display_message("An error occurred. Please try again later.", true);
}