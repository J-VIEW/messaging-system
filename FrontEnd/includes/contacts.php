<?php
if (isset($_SESSION['user_id'])) {
    $current_user_id = $_SESSION['user_id'];
    $page = isset($input['page']) ? max(1, (int)$input['page']) : 1;
    $limit = isset($input['limit']) ? max(1, (int)$input['limit']) : 20;
    $offset = ($page - 1) * $limit;
    $include_description = isset($input['include_description']) ? (bool)$input['include_description'] : false;

    $query = "SELECT user_id, username, image, gender, interests, quote FROM users WHERE user_id != :current_user_id LIMIT :limit OFFSET :offset";
    $params = [
        ':current_user_id' => $current_user_id,
        ':limit' => $limit,
        ':offset' => $offset
    ];

    try {
        $result = $DB->read_from_db($query, $params);

        $contacts = array();
        if (is_array($result) && count($result) > 0) {
            foreach ($result as $row) {
                $contact = [
                    'user_id' => $row['user_id'],
                    'username' => $row['username'],
                    'image' => base64_encode($row['image']),
                    'gender' => $row['gender']
                ];

                if ($include_description) {
                    $contact['interests'] = json_decode($row['interests'], true) ?? [];
                    $contact['quote'] = $row['quote'] ?? '';
                }

                $contacts[] = $contact;
            }
            $response = [
                'data_type' => 'contacts',
                'contacts' => $contacts,
                'page' => $page,
                'limit' => $limit
            ];

            if ($data_type === 'contacts') {
                $response['styles'] = [
                    'container' => [
                        'font-family' => 'Arial, sans-serif',
                        'font-size' => '14px',
                        'color' => '#000000',
                        'background-color' => '#f5f5f5',
                        'padding' => '15px',
                        'border-radius' => '8px',
                        'box-shadow' => '0 2px 4px rgba(0,0,0,0.1)',
                        'max-height' => 'calc(100vh - 100px)',
                        'overflow-y' => 'auto'
                    ],
                    'contactItem' => [
                        'display' => 'flex',
                        'align-items' => 'center',
                        'margin-bottom' => '10px',
                        'padding' => '10px',
                        'background-color' => '#fff',
                        'border-radius' => '4px',
                        'box-shadow' => '0 1px 2px rgba(0,0,0,0.05)'
                    ],
                    'contactImage' => [
                        'width' => '50px',
                        'height' => '50px',
                        'border-radius' => '50%',
                        'margin-right' => '10px'
                    ],
                    'contactName' => [
                        'font-family' => 'Arial, sans-serif',
                        'font-size' => '14px',
                        'color' => '#000000',
                        'font-weight' => 'bold',
                    ]
                ];
            }
        } else {
            $response = [
                'data_type' => 'info_msg',
                'message' => 'No contacts found'
            ];
        }
    } catch (Exception $e) {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'An error occurred: ' . $e->getMessage()
        ];
    }
} else {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'User not logged in'
    ];
}