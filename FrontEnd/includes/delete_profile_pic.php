<?php
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    
    // Get the user's current gender
    $query = "SELECT gender FROM users WHERE user_id = :user_id LIMIT 1";
    $result = $DB->read_from_db($query, [':user_id' => $user_id]);
    
    if (is_array($result) && count($result) > 0) {
        $gender = $result[0]['gender'];
        
        // Get the default image based on gender
        $default_image = getDefaultImage($gender);
        $default_image_path = PROJECT_ROOT . '/' . $default_image;
        
        if (file_exists($default_image_path)) {
            $image_content = file_get_contents($default_image_path);
            
            // Update the user's image in the database
            $updateQuery = "UPDATE users SET image = :image, image_filename = :image_filename WHERE user_id = :user_id";
            $updateResult = $DB->write_to_db($updateQuery, [
                ':image' => $image_content,
                ':image_filename' => $default_image,
                ':user_id' => $user_id
            ]);
            
            if ($updateResult) {
                // Delete the old image file if it exists
                deleteOldImageFile($_SESSION['username']);
                
                $response = [
                    'data_type' => 'success',
                    'message' => 'Profile picture removed successfully',
                    'default_image_path' => WEB_ROOT . '/' . $default_image
                ];
            } else {
                $response = [
                    'data_type' => 'error_msg',
                    'message' => 'Failed to update profile picture'
                ];
            }
        } else {
            $response = [
                'data_type' => 'error_msg',
                'message' => 'Default image not found'
            ];
        }
    } else {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'User not found'
        ];
    }
} else {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'User not logged in'
    ];
}