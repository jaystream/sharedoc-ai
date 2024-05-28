<?php
function add_custom_post_type($args) {
    $labels = array(
        "name" => _x($args['name'], "post type general name"),
        "singular_name" => _x($args['singular'], "post type singular name"),
        "add_new" => _x("Add New", $args['singular']),
        "add_new_item" => __("Add New ".$args['singular']),
        "edit_item" => __("Edit ".$args['singular']),
        "new_item" => __("New ".$args['singular']),
        "all_items" => __("All ".$args['plural']),
        "view_item" => __("View ".$args['singular']),
        "search_items" => __("Search ".$args['plural']),
        "not_found" =>  __("No ".strtolower($args['plural'])." found"),
        "not_found_in_trash" => __("No ".strtolower($args['plural'])." found in Trash"), 
        "parent_item_colon" => "",
        "menu_name" => $args['plural']
    );
    $properties = array(
        "labels" => $labels,
        "description" => "",
        "public" => true,
        "rewrite" => array("slug"=>$args['slug'], 'with_front' => true),
        "publicly_queryable" => true,
        "query_var" => true,
        "has_archive" => false, 
        "show_ui" => true,
        "supports" => array("title","editor","revisions", "thumbnail"),
        "show_in_rest" => true,
        //"show_in_menu" => 'sdai-settings',
        "show_in_menu" => 'edit.php?post_type=transactions',
        "taxonomies" => array("category")
    ); 
    register_post_type($args['slug'],$properties);
}

function xwb_transactions_row_actions($actions, $post)
{
    if ( $post->post_type == "transactions" ) {

        // Build your links URL.
        $url = admin_url( 'admin.php?page=sdai_trans_history&post=' . $post->ID );
        
        $actions = array_merge( $actions, array(
            'history' => sprintf( '<a href="%1$s">%2$s</a>',
            esc_url( $url ), 
            'History'
            ) 
        ));
    }
    return $actions;
}
add_filter( 'post_row_actions', 'xwb_transactions_row_actions', 10, 2 );


add_action("init", "add_custom_post_types");
function add_custom_post_types() {
    $args = array(
        'name'=>'Transactions',
        'slug'=>'transactions',
        'singular' => 'Transaction',
        'plural'=>'Transactions'
    );
    add_custom_post_type($args);

    $args = array(
        'name'=>'History',
        'slug'=>'history',
        'singular' => 'History',
        'plural'=>'Histories'
    );
    add_custom_post_type($args);
}

add_action("init", "xwb_rewrite_rule");
function xwb_rewrite_rule() {
    $page = get_page_by_path( 'share' );
    add_rewrite_rule( 'share/files/([^/]*)/?', 'index.php?page_id='.$page->ID.'&fileHash=$matches[1]', 'top' );
    add_rewrite_rule( 'share/review/([^/]*)/?', 'index.php?page_id='.$page->ID.'&fileHash=$matches[1]', 'top' );
    add_rewrite_rule( 'share/upload/?', 'index.php?page_id='.$page->ID, 'top' );
    add_rewrite_rule( 'share/users/([^/]*)/?', 'index.php?page_id='.$page->ID.'&fileHash=$matches[1]', 'top' );
    flush_rewrite_rules();
}