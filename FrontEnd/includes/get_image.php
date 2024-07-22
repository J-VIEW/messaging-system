<?php
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    $query = "SELECT image FROM users WHERE user_id = :user_id LIMIT 1";
    $result = $DB->read_from_db($query, [':user_id' => $user_id]);
    
    if (is_array($result) && count($result) > 0) {
        $image_data = $result[0]['image'];
        $response = [
            'data_type' => 'image',
            'image' => base64_encode($image_data)
        ];
    } else {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'Image not found'
        ];
    }
} else {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'User not logged in'
    ];
}