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

        add_submenu_page(
            'edit.php?post_type=transactions',
            __( 'History', 'sharedoc-ai' ),
            __( 'History', 'sharedoc-ai' ),
            'manage_options',
            'sdai_trans_history',
            [ $this, 'sdai_trans_history_template' ],
        );

    }

    public function menu_page_template() {
        echo '<div class="wrap"><div id="sharedoc-ai-admin">ShareDoc Admin Page</div></div>';
    }

    public function sdai_trans_history_template()
    {
        include_once SDAI_PATH.'admin/transaction-history.php';
    }
}


