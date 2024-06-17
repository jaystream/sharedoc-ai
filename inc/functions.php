<?php

use classes\Blockchain;

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
    global $wpdb;
    
    

    
    /* pre($bc->chain[0],1);
    foreach ($bc->chain as $key => $value) {
        pre($key,1);
        pre($value,1);
    } */
    
    $file_name = $_FILES['document']['name'];
    $file_temp = $_FILES['document']['tmp_name'];

    $upload_dir = wp_upload_dir();
    $fileData = file_get_contents( $file_temp );
    $filename = basename( $file_name );
    
    
    if ( wp_mkdir_p( $upload_dir['path'] ) ) {
        $file = $upload_dir['path'] . '/' . $filename;
    }
    else {
        $file = $upload_dir['basedir'] . '/' . $filename;
    }
    
    file_put_contents( $file, $fileData );
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
    update_post_meta($attach_id, 'file_key', $_POST['file_key'] );
    update_post_meta($attach_id, 'mime_type', $_POST['mimeType'] );
    
    require_once( ABSPATH . 'wp-admin/includes/image.php' );
    $attach_data = wp_generate_attachment_metadata( $attach_id, $file );
    wp_update_attachment_metadata( $attach_id, $attach_data );

    $new_post = array(
        'post_title'   => $_POST['title'], // Valid post name
        'post_status'  => 'publish', // Unslashed post data - Set the status of the new post to 'publish'
        'post_type'=>'transactions',
    );
    
    // Insert post into the database
    $post_id = wp_insert_post($new_post, true); // Use $wp_error set to true for error handling
    
    update_field( 'file_hash', $_POST['fileHash'], $post_id );
    update_field( 'file', $attach_id, $post_id );
    update_field( 'mime_type', $_POST['mimeType'], $post_id );
    update_field( 'email', $_POST['email'], $post_id );

    $user = wp_get_current_user();
    $bc = new Blockchain($post_id, [
        'file_hash' => $_POST['fileHash'],
        'author' => $user->ID,
    ]);
    $block = $bc->getLatestBlock();

    update_field( 'block_hash', $block->hash, $post_id );
    update_field( 'block_number', $block->index, $post_id );

    wp_send_json_success([
        'attachment_id' => $attach_id,
        'post_id' => $post_id,
        'block' => $block,
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
    
    $emails = get_field('email_permissions',$post_id);
    $existingEmails = [];
    if($emails){
        foreach($emails as $email){
            $existingEmails[] = $email['email'];
        }
    }
    if(in_array($_POST['share_to_email'], $existingEmails)){
        wp_send_json_error([
            'post_id' => $post_id,
            'message' => 'The email '.$_POST['share_to_email'].' already exists!'
        ], 401);
    }

    
    
    $row = array(
        'email' => $_POST['share_to_email'],
        'first_name' => $_POST['first_name'],
        'last_name' => $_POST['last_name'],
        'company' => $_POST['company'],
        'permissions' => $_POST['permissions']
    );
    
    add_row('email_permissions', $row,$post_id);

    $to = $_POST['share_to_email'];
    $subject = 'A file has been shared to you - Sharedoc AI';
    $body = '<p>A new file has been shared to you.</p>
    <p><a href="'.site_url('login').'">Click here</a> to login and navigate to shared files.</p>';

    $user = get_user_by('email',$to);
    if(!$user){
        $currUser = wp_get_current_user();
        $invitehash = password_hash($currUser->ID,PASSWORD_DEFAULT);
        $body .= '<p>If you do not have an account yet, please <a href="'.site_url('start-free-trial/?invite='.$invitehash.'&email='.$to).'">Click here</a> to register.</p>';
    }
    
    $headers = array('Content-Type: text/html; charset=UTF-8');

    wp_mail( $to, $subject, $body, $headers );

    wp_send_json_success([
        'post_id' => $post_id,
        'message' => 'File has been shared to '.$_POST['share_to_email']
    ]);
}


add_action( 'wp_ajax_getFiles', 'getFiles' );
add_action( 'wp_ajax_nopriv_getFiles', 'getFiles' );
function getFiles()
{
    $postStatus = 'any';
    switch ($_GET['show']) {
        case 'Active':
            $postStatus = 'publish';
            break;
        case 'Inactive':
            $postStatus = 'draft';
            break;
        
        default:
            $postStatus = 'any';
            break;
    }
    
    $the_query = new WP_Query(array(
        'posts_per_page'    => -1,
        'post_type'     => 'transactions',
        'meta_key'      => 'email',
        'meta_value'    => $_GET['email'],
        'post_status' => $postStatus
    ));
    $data =  [];
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
            $attachement = get_field('file');
            $attachmentMetaData = wp_get_attachment_metadata($attachement->ID);
            
            $attachmentURL = wp_get_attachment_url($attachement->ID);
            
            $data[] = [
                'title' => get_the_title(),
                'file_hash' => get_field('file_hash'),
                'url' => $attachmentURL,
                'block_hash' => get_field('block_hash'),
                'post_id' => get_the_ID(),
                'status' => get_post_status(),
                'date' => get_the_date( 'M d, Y' )
            ];
        endwhile;
    }
    wp_send_json_success($data);
}

add_action( 'wp_ajax_getShared', 'getShared' );
add_action( 'wp_ajax_nopriv_getShared', 'getShared' );
function getShared()
{
    $postStatus = 'any';
    switch ($_GET['show']) {
        case 'Active':
            $postStatus = 'publish';
            break;
        case 'Inactive':
            $postStatus = 'draft';
            break;
        
        default:
            $postStatus = 'any';
            break;
    }
    $args = array(
        'numberposts'	=> -1,
        'post_type'		=> 'transactions',
        'post_status' => $postStatus,
        'meta_query'	=> array(
            array(
                'key' => 'email_permissions_$_email', // our repeater field post object
                'value' =>$_GET['email'],
                'compare' => 'LIKE'
           )
        )
    );
    $the_query = new WP_Query( $args );
    $data = [];
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
            $attachement = get_field('file');
            $attachmentURL = wp_get_attachment_url($attachement->ID);
            $data[] = [
                'title' => get_the_title(),
                'file_hash' => get_field('file_hash'),
                'url' => $attachmentURL,
                'block_hash' => get_field('block_hash'),
                'post_id' => get_the_ID(),
                'status' => get_post_status(),
                'date' => get_the_date( 'M d, Y' )
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
add_action( 'wp_ajax_nopriv_getUser', 'getUser' );
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

add_action( 'wp_ajax_getFile', 'getFile' );
//add_action( 'wp_ajax_nopriv_getFile', 'getFile' );
function getFile()
{
    global $wpdb;
    $file_hash = $_GET['file_hash'];
    $hasPermission = false;
    $currentUser = wp_get_current_user();
    
    /* $the_query = new WP_Query(array(
        'posts_per_page'    => 1,
        'post_type'     => 'transactions',
        'meta_key'      => 'file_hash',
        'meta_value'    => $fileHash
    )); */

    $args = array(
        'numberposts'	=> -1,
        'post_type'		=> 'transactions',
        'meta_query'	=> array(
            'relation' => 'AND',
            array(
                'key' => 'file_hash',
                'value' => $file_hash,
            ),
            array(
                'relation' => 'OR',
                array(
                    'key' => 'email_permissions_$_email', // our repeater field post object
                    'value' =>$currentUser->user_email,
                    'compare' => 'LIKE'
                ),
                array(
                    'key' => 'email', // our repeater field post object
                    'value' =>$currentUser->user_email
                )
            )
            
        )
    );
    
    $the_query = new WP_Query( $args );
    
    
    $data =  [];
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
            $attachement = get_field('file');
            $attachmentURL = wp_get_attachment_url($attachement->ID);
            $attachmentMetaData = wp_get_attachment_metadata($attachement->ID);
            $fileKey = get_post_meta($attachement->ID, 'file_key',true);
            $postID = get_the_ID();
            $result = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}blockchain WHERE post_id = {$postID}", OBJECT );
            $bc = new Blockchain();
            $bc->setChains($postID);
            $chains = $bc->chains;
            $latestBlock = $bc->getLatestBlock();

            /* $chains = array_values(array_filter($chains, function($v) use ($currentUser) {
            
                return $v->data['author'] == $currentUser->ID && $v->type == 'suggestion';
            })); */
            
            $data = [
                'title' => get_field('file_hash'),
                'url' => $attachmentURL,
                'post_id' => get_the_ID(),
                'file_hash' => get_field('file_hash'),
                'mime_type' => get_field('mime_type'),
                'file_key' => $fileKey,
                'chains' => $chains,
                //'latestBlock' => $latestBlock,
                'isAuthorized' => true
            ];
        endwhile;
    }else{
        $data['isAuthorized'] = false;
    }

    wp_send_json_success($data);
}

add_action( 'wp_ajax_getTransactionByHash', 'getTransactionByHash' );
function getTransactionByHash()
{
    $the_query = new WP_Query(array(
        'posts_per_page'    => 1,
        'post_type'     => 'transactions',
        'meta_key'      => 'file_hash',
        'meta_value'    => $_GET['file_hash']
    ));
    $data =  [];
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
        $attachement = get_field('file');
        $attachmentMetaData = wp_get_attachment_metadata($attachement->ID);
        
        $attachmentURL = wp_get_attachment_url($attachement->ID);
        $emails = get_field('email_permissions');
        $data = [
            'title' => get_the_title(),
            'file_hash' => get_field('file_hash'),
            'url' => $attachmentURL,
            'block_hash' => get_field('block_hash'),
            'post_id' => get_the_ID(),
            'block_number' => get_field('block_number'),
            'email' => get_field('email'),
            'emails' => ($emails ? $emails : [])
        ];
        endwhile;
    }
    wp_send_json_success($data);
}



add_action( 'wp_ajax_getFileHistory', 'getFileHistory' );

function getFileHistory()
{
    if ( ! wp_verify_nonce( $_GET['nonce'], 'wp_rest' ) ) {
        wp_send_json_error ( 'Busted!', 403);
    }
    global $wpdb;

    $colors = [
        '#8193FF','#FF1C01', '#004EFF','#009912','#A836FF','#FF14FF','#FF6116','#00E673','#FF3393', '#977AFF'
    ];
    $user = wp_get_current_user();
    
    $fileHash = $_GET['file_hash'];
    $args = array(
        'numberposts'	=> -1,
        'post_type'		=> 'transactions',
        'meta_query'	=> array(
            array(
                'key' => 'file_hash',
                'value' => $fileHash,
            )
        )
    );
    
    $the_query = new WP_Query( $args );
    
    $isAuthorized = false;
    $data =  [];
    if( $the_query->have_posts() ){
        while( $the_query->have_posts() ) : $the_query->the_post();
            $postID = get_the_ID();
            $attachement = get_field('file');
            $isOwner = (get_field('email') == $user->user_email);
            $isAuthorized = $isOwner;

            $emails = get_field('email_permissions');
            $email_permissions = [];
            $owner = get_user_by('email', get_field('email'));
            
            
            $collaborators[$owner->ID] = [
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'email' => $owner->user_email,
                'display_name' => $owner->display_name,
                'color' => $colors[0],
                'id' => $owner->ID
            ];
            $userCounter = 1;
            foreach ($emails as $email) {
                if($userCounter > count($colors)){
                    $userCounter = 0;
                }
                $email_permissions[] = $email['email'];
                if($user = get_user_by('email', $email['email'])){
                    
                    $collaborators[$user->ID] = [
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'email' => $user->user_email,
                        'display_name' => $owner->display_name,
                        'color' => $colors[$userCounter],
                        'id' => $user->ID
                    ];
                }
                $userCounter++;
            }
            
            if(!$isAuthorized){
                $isAuthorized = in_array($user->user_email, $email);
            }
            $attachmentURL = wp_get_attachment_url($attachement->ID);
            $attachmentMetaData = wp_get_attachment_metadata($attachement->ID);
            $fileKey = get_post_meta($attachement->ID, 'file_key',true);

            $result = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}blockchain WHERE post_id = {$postID}", OBJECT );
            $bc = new Blockchain();
            $bc->setChains($postID);
            $chains = $bc->chains;

            foreach($chains as &$chain){
                $chain->version = hash('crc32b',$chain->index);
            }

            $fileEdits = [];
            $changes = [];
            foreach ($result as $key => $value) {

                $user = get_user_by('ID', $value->author);
                $editResult = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}blockchain_edits WHERE bc_id = {$value->id}", OBJECT );
                
                foreach ($editResult as $key => $editValue) {
                    $action = 0;
                    if($editValue->action == 1)
                        $action = 'Added';
                    if($editValue->action == -1)
                        $action = 'Deleted';


                    if($editValue->action != 0){
                        $changes[$editValue->author][] = [
                            'text' => $editValue->changes,
                            'action' => $editValue->action,
                            'block_hash' => $value->block_hash
                        ];
                    }

                    
                    $fileEdits[$editValue->author][] = [
                        'author_name' => $user->user_nicename,
                        'action' => $editValue->action,
                        'content' => $editValue->changes,
                        'time' => $editValue->time,
                        'block_hash' => $value->block_hash,
                        'is_current_user' => ($editValue->author == $user->ID)
                    ]; 
                }

                
            }
            $data = [
                'title' => get_the_title(),
                'current_user_email' => $user->user_email,
                'is_owner' => $isOwner,
                'url' => $attachmentURL,
                'post_id' => get_the_ID(),
                'file_hash' => get_field('file_hash'),
                'mime_type' => get_field('mime_type'),
                'file_key' => $fileKey,
                'isAuthorized' => $isAuthorized,
                'collaborators' => $collaborators,
                'chains' => $chains,
                //'changes' => $changes,
                //'fileEdits' => $fileEdits                
            ];
        endwhile;
    }
    
    wp_send_json_success($data);
}


/**
 * Update content from Edit File page
 *
 * @return void
 */
function updateContent()
{
    global $wpdb;
    if ( ! wp_verify_nonce( $_POST['nonce'], 'wp_rest' ) ) {
        wp_send_json_error ( 'Unauthorized access!', 403);
    }

    $user = wp_get_current_user();
    extract(wp_unslash($_POST));
    
    $data = array(
        'post_id' => $postID,
        'author' => $user->ID,
        //'userContent' => $userContent,
        'oldContent' => $oldContent,
        'newContent' => $newContent,
        'changes' => $edits,
        'patch' => $patch
    );
    
    
    
    $bc = new Blockchain();
    $bc->setChains($postID);
    $bc->createSDBlock($postID, $data);
    wp_send_json_success(true);
}
add_action( 'wp_ajax_updateContent', 'updateContent' );

function publishUnpublish()
{
    global $wpdb;
    if ( ! wp_verify_nonce( $_POST['nonce'], 'wp_rest' ) ) {
        wp_send_json_error ( 'Unauthorized access!', 403);
    }

    $postID = $_POST['post_id'];
    $status = $_POST['status'];
    $newStatus = ($status == 'publish' ? 'draft' : 'publish');
    
    wp_update_post(array(
        'ID'    =>  $postID,
        'post_status'   =>  $newStatus
    ));
    
    wp_send_json_success(true);
    
}
add_action( 'wp_ajax_publishUnpublish', 'publishUnpublish' );
