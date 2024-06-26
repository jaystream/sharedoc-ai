<?php
/**
 * Plugin Name
 *
 * @package           PluginPackage
 * @author            Jay-r Simpron
 * @copyright         2023 @ Alltrius, LLC
 * @license           GPL-2.0-or-later
 * 
 *
 * @wordpress-plugin
 * Plugin Name:       ShareDoc AI
 * Plugin URI:        https://sharedoc.ai/
 * Description:       Custom Plugin intended for sharedoc.ai only
 * Version:           1.0.0
 * Requires at least: 5.2
 * Requires PHP:      7.2
 * Author:            Jay-r Simpron
 * Author URI:        https://jaystream.github.io/
 * Text Domain:       plugin-slug
 * License:           GPL v2 or later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Update URI:        https://sharedoc.ai/
 */

 /*
ShareDoc AI is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

ShareDoc AI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ShareDoc AI. If not, see {URI to Plugin License}.
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}


/**
* Define Plugins Contants
*/
define ( 'SDAI_PATH', trailingslashit( plugin_dir_path( __FILE__ ) ) );
define ( 'SDAI_URL', trailingslashit( plugins_url( '/', __FILE__ ) ) );
require_once SDAI_PATH . 'inc/functions.php';
require_once SDAI_PATH . 'inc/init.php';

add_action( 'admin_enqueue_scripts', 'sharedoc_admin_enqueue_scripts' );

/**
 * Enqueue scripts and styles.
 *
 * @return void
 */
function sharedoc_admin_enqueue_scripts() {
    wp_enqueue_style( 'sdai-admin-style', plugin_dir_url( __FILE__ ) . 'build/index.css' );
    wp_enqueue_script( 'sdai-admin-script', plugin_dir_url( __FILE__ ) . 'build/index.js', array( 'wp-element' ), '1.0.0', true );
}


add_action('wp_enqueue_scripts', 'sharedoc_enqueue_script');
function sharedoc_enqueue_script() {   
    wp_enqueue_script( 'sdai_scripts', SDAI_URL. 'build/index.js',  array( 'wp-element' ), '1.0.0', true );
    wp_localize_script( 'sdai_scripts', 'xwbVar', [
        'apiUrl' => home_url( '/wp-json' ),
        'ajaxURL' => admin_url( 'admin-ajax.php' ),
        'nonce' => wp_create_nonce( 'wp_rest' ),
    ] );

    wp_enqueue_style('sdai-style', SDAI_URL.'/build/index.css');
}

register_activation_hook(
	__FILE__,
	'sd_install_dbtables'
);


function sd_install_dbtables()
{
    global $wpdb;

	$table_bc = $wpdb->prefix . 'blockchain';
    $table_bcedits = $wpdb->prefix . 'blockchain_edits';
    $table_bcuserapproval = $wpdb->prefix . 'blockchain_user_approval';
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$charset_collate = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

	$sql = "CREATE TABLE IF NOT EXISTS `$table_bc` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `post_id` int(11) NULL DEFAULT 0,
        `type` VARCHAR(50) NULL DEFAULT 'origin',
        `branch` VARCHAR(150) NULL DEFAULT 'origin',
        `author` INT NULL,
        `action` VARCHAR(20) NOT NULL,
        `changes` MEDIUMTEXT NULL,
        `n_version` int(11) DEFAULT 0,
        `time` datetime DEFAULT current_timestamp(),
        `block_hash` varchar(255) DEFAULT NULL,
        `prev_block_hash` varchar(255) DEFAULT NULL,
        `next_block_hash` varchar(255) DEFAULT NULL,
        `merkle_root` varchar(255) DEFAULT NULL,
        `nonce` varchar(150) DEFAULT NULL,
        `status` TINYINT(3) NOT NULL DEFAULT '1',
        `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
        PRIMARY KEY (`id`)
      ) $charset_collate;";
    dbDelta( $sql );
    /* $sql .= "CREATE TABLE IF NOT EXISTS `$table_bchistory` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `bc_id` int(11) DEFAULT 0,
        `type` varchar(50) DEFAULT 'suggestion',
        `author` int(11) DEFAULT NULL,
        `changes` longtext DEFAULT NULL,
        `n_version` int(11) DEFAULT 0,
        `time` datetime DEFAULT current_timestamp(),
        `block_hash` varchar(255) DEFAULT NULL,
        `prev_block_hash` varchar(255) DEFAULT NULL,
        `next_block_hash` varchar(255) DEFAULT NULL,
        `merkle_root` varchar(255) DEFAULT NULL,
        `nonce` varchar(150) DEFAULT NULL,
        `status` tinyint(3) NOT NULL DEFAULT 1,
        `data` longtext DEFAULT NULL CHECK (json_valid(`data`)),
        PRIMARY KEY (`id`)
    ) $charset_collate;"; */

    $sql = "CREATE TABLE IF NOT EXISTS `$table_bcedits` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `bc_id` bigint(20) NOT NULL,
        `type` varchar(50) DEFAULT 'suggestion',
        `author` int(11) DEFAULT NULL,
        `action` varchar(20) NOT NULL,
        `char_pos` int(11) DEFAULT NULL,
        `length` int(11) DEFAULT 0,
        `changes` longtext DEFAULT NULL,
        `n_version` int(11) DEFAULT 0,
        `time` datetime DEFAULT current_timestamp(),
        `status` tinyint(3) NOT NULL DEFAULT 1,
        `data` longtext DEFAULT NULL CHECK (json_valid(`data`)),
        PRIMARY KEY (`id`),
        KEY `bc_id` (`bc_id`)
    ) $charset_collate;";

    $sql .= "ALTER TABLE `$table_bcedits` ADD CONSTRAINT `fk_edits_blockchain_id` FOREIGN KEY (`bc_id`) REFERENCES `$table_bc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;";

    dbDelta( $sql );

    $sql = "CREATE TABLE IF NOT EXISTS `$table_bcuserapproval` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `bc_id` bigint(20) NOT NULL,
        `author` int(11) NOT NULL,
        `action` varchar(20) NOT NULL,
        `status` tinyint(3) NOT NULL,
        `time` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        KEY `bc_id` (`bc_id`)
    ) $charset_collate;";

    $sql .= "ALTER TABLE `$table_bcuserapproval` ADD CONSTRAINT `fk_approval_blockchain_id` FOREIGN KEY (`bc_id`) REFERENCES `$table_bc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE; ";

    dbDelta( $sql );

}

add_shortcode( 'sharedoc_ai', 'sdai_share' );
function sdai_share( $atts ) {
	?>
    <div id="sharedoc-ai">
        
    </div>
    <?php
}




add_action('plugins_loaded', 'load_classes');
function load_classes()
{
    include SDAI_PATH . 'classes/AdminMenu.php';
    require_once SDAI_PATH . 'vendor/autoload.php';
    include SDAI_PATH . 'classes/Blockchain.php';
    include SDAI_PATH . 'classes/Block.php';
    
    new AdminMenu();
}
