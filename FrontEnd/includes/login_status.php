<?php
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    $query = "SELECT user_id, username, email, gender, image FROM users WHERE user_id = :user_id LIMIT 1";
    $params = [':user_id' => $user_id];
    
    try {
        $result = $DB->read_from_db($query, $params);
        
        if (is_array($result) && count($result) > 0) {
            $user = $result[0];
            $response = [
                'data_type' => 'login_status',
                'logged_in' => true,
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'gender' => $user['gender'],
                'image' => base64_encode($user['image'])
            ];
        } else {
            // User found in session but not in database
            session_destroy();
            $response = [
                'data_type' => 'login_status',
                'logged_in' => false,
                'message' => 'User session invalid'
            ];
        }
    } catch (Exception $e) {
        error_log("Database error in login_status: " . $e->getMessage());
        $response = [
            'data_type' => 'error_msg',
            'message' => 'An error occurred while checking login status.'
        ];
    }
} else {
    $response = [
        'data_type' => 'login_status',
        'logged_in' => false
    ];
}