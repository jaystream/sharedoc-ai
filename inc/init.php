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
        "menu_position" => 5,
        "supports" => array("title","editor","revisions", "thumbnail"),
        "show_in_rest" => true,
        "taxonomies" => array("category")
    ); 
    register_post_type($args['slug'],$properties);
}


add_action("init", "add_custom_post_types");
function add_custom_post_types() {
    $args = array(
        'name'=>'Transactions',
        'slug'=>'transactions',
        'singular' => 'Transaction',
        'plural'=>'Transactions'
    );
    add_custom_post_type($args);
}