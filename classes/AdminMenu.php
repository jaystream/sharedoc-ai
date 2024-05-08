<?php
class AdminMenu
{
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'create_admin_menu' ] );
    }

    public function create_admin_menu() {
        $capability = 'manage_options';
        $slug = 'sdai-settings';

        add_menu_page(
            __( 'ShareDoc AI', 'sharedoc-ai' ),
            __( 'ShareDoc AI', 'sharedoc-ai' ),
            $capability,
            $slug,
            [ $this, 'menu_page_template' ],
            'dashicons-media-document'
        );  
        
        add_submenu_page(
            'sdai-settings',
            __( 'Transaction', 'xwb' ),
            __( 'Transaction', 'sharedoc-ai' ),
            'manage_options',
            'edit.php?post_type=transactions'
        );

    }

    public function menu_page_template() {
        echo '<div class="wrap"><div id="sharedoc-ai-admin">ShareDoc Admin Page</div></div>';
    }

}


