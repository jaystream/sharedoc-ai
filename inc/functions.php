<?php
if (! function_exists('pre')) {
    /**
    * Run print_r or vardump php function
    *
    * @param array|string $data
    * @param type|bool $die
    * @param type|string $var_dump
    * @return string
    */
    function pre($data = '', $die = false, $print_r = false)
    {
        echo "<pre style='text-align: left;'>";
        if ($print_r == true) {
            print_r($data);
        } else {
            var_dump($data);
        }
        echo "</pre>";
        if (!$die) {
            die('die()');
        }
    }
}


add_action( 'wp_ajax_uploadFile', 'uploadFile' );
add_action( 'wp_ajax_nopriv_uploadFile', 'uploadFile' );
function uploadFile()
{
    if ( ! wp_verify_nonce( $_POST['nonce'], 'wp_rest' ) ) {
        wp_send_json_error ( 'Busted!', 403);
    }
    $file_name = $_FILES['document']['name'];
    $file_temp = $_FILES['document']['tmp_name'];

    $upload_dir = wp_upload_dir();
    $image_data = file_get_contents( $file_temp );
    $filename = basename( $file_name );
    
    
    if ( wp_mkdir_p( $upload_dir['path'] ) ) {
        $file = $upload_dir['path'] . '/' . $filename;
    }
    else {
        $file = $upload_dir['basedir'] . '/' . $filename;
    }
    
    file_put_contents( $file, $image_data );
    $wp_filetype = wp_check_filetype( $filename, null );
    
    $attachment = array(
        'post_mime_type' => $wp_filetype['type'],
        'post_title' => sanitize_file_name( $filename ),
        'post_content' => '',
        'post_status' => 'inherit'
    );
    
    $attach_id = wp_insert_attachment( $attachment, $file );
    update_post_meta($attach_id, 'doc_type', $_POST['docType'] );
    update_post_meta($attach_id, 'from', $_POST['email'] );
    update_post_meta($attach_id, 'hash', $_POST['fileHash'] );
    require_once( ABSPATH . 'wp-admin/includes/image.php' );
    $attach_data = wp_generate_attachment_metadata( $attach_id, $file );
    wp_update_attachment_metadata( $attach_id, $attach_data );

    $new_post = array(
        'post_title'   => $_POST['fileHash'], // Valid post name
        'post_status'  => 'publish', // Unslashed post data - Set the status of the new post to 'publish'
        'post_type'=>'transactions',
    );
    
    // Insert post into the database
    $post_id = wp_insert_post($new_post, true); // Use $wp_error set to true for error handling
    
    wp_send_json_success([
        'attachment_id' => $attach_id,
        'post_id' => $post_id,
        'message' => 'File has been uploaded!'
    ]);
}

add_action( 'wp_ajax_recordTransaction', 'recordTransaction' );
add_action( 'wp_ajax_nopriv_recordTransaction', 'recordTransaction' );
function recordTransaction()
{
    if ( ! wp_verify_nonce( $_POST['nonce'], 'wp_rest' ) ) {
        wp_send_json_error ( 'Busted!', 403);
    }
    $receiptData = $_POST['receipt'];
    
    $args = array(
        'post_title'   => $receiptData['transactionHash'], // Valid post name
        'ID'=>$_POST['post_id'],
    );
    
    // Insert post into the database
    $post_id = $_POST['post_id'];
    wp_update_post($args); // Use $wp_error set to true for error handling
    update_field( 'block_hash', $receiptData['blockHash'], $post_id );
    update_field( 'contract_address', $receiptData['to'], $post_id );
    update_field( 'gas_used', $receiptData['gasUsed'], $post_id );
    update_field( 'effective_gas_price', $receiptData['effectiveGasPrice'], $post_id );
    update_field( 'file_hash', $_POST['fileHash'], $post_id );
    update_field( 'block_number', $receiptData['blockNumber'], $post_id );
    update_field( 'file', $_POST['attachment'], $post_id );
    update_field( 'email', $_POST['email'], $post_id );
    update_field( 'function', $_POST['function'], $post_id );
    
    wp_send_json_success([
        'post_id' => $post_id,
        'message' => 'Transaction has been recorded!'
    ]);
}

add_action( 'wp_ajax_getEmails', 'getEmails' );
add_action( 'wp_ajax_nopriv_getEmails', 'getEmails' );
function getEmails()
{
    $post_id = $_GET['post_id'];
    $post = get_post($post_id);
    $emails = get_field('email_permissions',$post_id);

    wp_send_json(($emails ? $emails : []));
}


add_action( 'wp_ajax_addPermissions', 'addPermissions' );
add_action( 'wp_ajax_nopriv_addPermissions', 'addPermissions' );
function addPermissions()
{
    
    $post_id = $_POST['post_id'];
    $row = array(
        'email' => $_POST['share_to_email'],
        'first_name' => $_POST['first_name'],
        'last_name' => $_POST['last_name'],
        'company' => $_POST['company'],
        'permissions' => $_POST['permissions']
    );
    
    add_row('email_permissions', $row,$post_id);

    wp_send_json_success([
        'post_id' => $post_id,
        'message' => 'File has been shared to '.$_POST['share_to_email']
    ]);
}


add_action( 'wp_ajax_getFiles', 'getFiles' );
add_action( 'wp_ajax_nopriv_getFiles', 'getFiles' );
function getFiles()
{
    
    $the_query = new WP_Query(array(
        'posts_per_page'    => -1,
        'post_type'     => 'transactions',
        'meta_key'      => 'email',
        'meta_value'    => $_GET['email']
    ));
    $data =  [];
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
            $attachement = get_field('file');
            $attachmentURL = wp_get_attachment_url($attachement->ID);
            
            $data[] = [
                'title' => get_field('file_hash'),
                'url' => $attachmentURL,
                'post_id' => get_the_ID()
            ];
        endwhile;
    }
    wp_send_json_success($data);
}

add_action( 'wp_ajax_getShared', 'getShared' );
add_action( 'wp_ajax_nopriv_getShared', 'getShared' );
function getShared()
{
    
    $args = array(
        'numberposts'	=> -1,
        'post_type'		=> 'transactions',
        'meta_query'	=> array(
            array(
                'key' => 'email_permissions_$_email', // our repeater field post object
                'value' =>$_GET['email'],
                'compare' => 'LIKE'
           )
        )
    );
    $the_query = new WP_Query( $args );
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
            $attachement = get_field('file');
            $attachmentURL = wp_get_attachment_url($attachement->ID);
            $data[] = [
                'title' => get_field('file_hash'),
                'url' => $attachmentURL,
                'post_id' => get_the_ID()
            ];
        endwhile;
    }
    wp_send_json_success($data);
}

add_filter('posts_where', 'xwb_posts_where');
function xwb_posts_where( $where ) {
    $where = str_replace( "meta_key = 'email_permissions_$", "meta_key LIKE 'email_permissions_%", $where );
	return $where;
}


add_action( 'wp_ajax_getUser', 'getUser' );
function getUser()
{
    $user =  wp_get_current_user();
    
    $data = [
        'email' => $user->user_email,
        'user_login' => $user->user_login,
        'display_name' => $user->display_name,
        'caps' => $user->caps
    ];
    wp_send_json_success($data);
}