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
            __( 'ShareDoc AI', 'sharedoc-ai-menu' ),
            $capability,
            $slug,
            [ $this, 'menu_page_template' ],
            'dashicons-media-document'
        );
    }

    public function menu_page_template() {
        echo '<div class="wrap"><div id="sharedoc-ai-admin">ShareDoc Admin Page</div></div>';
    }
}


new AdminMenu();