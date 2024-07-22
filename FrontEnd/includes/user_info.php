<?php
if(isset($_SESSION['user_id'])){
    $id = $_SESSION['user_id'];
    $query = "SELECT user_id, username, email, gender, image FROM users WHERE user_id = :id LIMIT 1";
    $result = $DB->read_from_db($query, ['id'=>$id]);

    if(is_array($result)){
        $row = $result[0];
        $response['user_id'] = $row['user_id'];
        $response['username'] = $row['username'];
        $response['email'] = $row['email'];
        $response['gender'] = $row['gender'];
        $response['image'] = base64_encode($row['image']);
        $response['data_type'] = "user_info";
    }
}