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

add_shortcode( 'sharedoc_ai', 'sdai_share' );
function sdai_share( $atts ) {
	?>
    <div id="sharedoc-ai">
        
    </div>
    <?php
}

require_once SDAI_PATH . 'classes/AdminMenu.php';
