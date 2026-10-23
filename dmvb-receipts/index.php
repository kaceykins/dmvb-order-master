<?php
/**
 * Plugin Name: DMVb Receipts
 * Description: Upload an orders CSV and create print-ready DMV Beneficials receipts (PDF, 4 per page) plus the Order List Master, with a side-by-side preview. Admins manage the master design.
 * Version: 1.3.4
 * Author: DMV Beneficials
 * License: GPL-2.0-or-later
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
define( 'DMVB_OPT', 'dmvb_receipts_design' );
define( 'DMVB_VER', '1.3.4' );

/** Who may make receipts. Change with the 'dmvb_receipts_capability' filter (default: edit_posts). */
function dmvb_cap() {
	return apply_filters( 'dmvb_receipts_capability', 'edit_posts' );
}

function dmvb_settings() {
	$s = get_option( DMVB_OPT, array() );
	if ( ! is_array( $s ) ) {
		$s = array();
	}
	$f = plugin_dir_path( __FILE__ ) . 'assets/logo.png';
	if ( empty( $s['logo'] ) && file_exists( $f ) ) {
		$sz           = getimagesize( $f );
		$s['logo']    = 'data:image/png;base64,' . base64_encode( file_get_contents( $f ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		$s['logoAR']  = $sz ? $sz[0] / $sz[1] : 1.96;
	}
	return $s;
}

add_action( 'admin_menu', function () {
	add_menu_page( 'DMVb Receipts', 'DMVb Receipts', dmvb_cap(), 'dmvb-receipts', 'dmvb_page_make', 'dashicons-media-text', 58 );
	add_submenu_page( 'dmvb-receipts', 'DMVb Receipts', 'Receipts', dmvb_cap(), 'dmvb-receipts', 'dmvb_page_make' );
	add_submenu_page( 'dmvb-receipts', 'Receipt Design', 'Design (Admin)', 'manage_options', 'dmvb-receipts-design', 'dmvb_page_design' );
} );

/** Use a local copy in assets/vendor/ if present, otherwise the CDN. */
function dmvb_vendor( $file, $cdn ) {
	return file_exists( plugin_dir_path( __FILE__ ) . 'assets/vendor/' . $file ) ? plugins_url( 'assets/vendor/' . $file, __FILE__ ) : $cdn;
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( false === strpos( $hook, 'dmvb-receipts' ) ) {
		return;
	}
	wp_enqueue_style( 'dmvb-receipts', plugins_url( 'assets/receipts.css', __FILE__ ), array(), DMVB_VER );
	wp_enqueue_script( 'dmvb-jspdf', dmvb_vendor( 'jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' ), array(), '2.5.1', true );
	wp_enqueue_script( 'dmvb-papaparse', dmvb_vendor( 'papaparse.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js' ), array(), '5.4.1', true );
	wp_enqueue_script( 'dmvb-qrcode', dmvb_vendor( 'qrcode.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js' ), array(), '1.4.4', true );
	wp_enqueue_script( 'dmvb-receipts', plugins_url( 'assets/receipts.js', __FILE__ ), array( 'dmvb-jspdf', 'dmvb-papaparse', 'dmvb-qrcode' ), DMVB_VER, true );
	if ( false === strpos( $hook, 'dmvb-receipts-design' ) ) {
		wp_enqueue_script( 'dmvb-master', plugins_url( 'assets/master.js', __FILE__ ), array( 'dmvb-jspdf' ), DMVB_VER, true );
		wp_enqueue_script( 'dmvb-preview', plugins_url( 'assets/preview.js', __FILE__ ), array( 'dmvb-receipts', 'dmvb-master', 'dmvb-papaparse' ), DMVB_VER, true );
	}
	wp_add_inline_script(
		'dmvb-receipts',
		'window.DMVB=' . wp_json_encode(
			array(
				'settings' => dmvb_settings(),
				'ajax'     => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'dmvb_design' ),
							)
		) . ';',
		'before'
	);
} );

add_action( 'wp_ajax_dmvb_save_design', function () {
	check_ajax_referer( 'dmvb_design', '_wpnonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( 'You do not have permission to change the design.', 403 );
	}
	$raw = isset( $_POST['design'] ) ? wp_unslash( $_POST['design'] ) : ''; // phpcs:ignore WordPress.Security
	$in  = json_decode( $raw, true );
	if ( ! is_array( $in ) ) {
		wp_send_json_error( 'Bad data.' );
	}
	$g   = function ( $k ) use ( $in ) {
		return isset( $in[ $k ] ) && is_string( $in[ $k ] ) ? $in[ $k ] : '';
	};
	$out = array(
		'qr' => esc_url_raw( $g( 'qr' ) ),
		'sq' => esc_url_raw( $g( 'sq' ) ),
		'ch' => sanitize_text_field( $g( 'ch' ) ),
		'h1' => sanitize_text_field( $g( 'h1' ) ),
		'h2' => sanitize_text_field( $g( 'h2' ) ),
		'fk' => sanitize_text_field( $g( 'fk' ) ),
		'fn' => sanitize_text_field( $g( 'fn' ) ),
		'ac' => sanitize_hex_color( $g( 'ac' ) ) ? sanitize_hex_color( $g( 'ac' ) ) : '#00d9ff',
		'rd' => sanitize_hex_color( $g( 'rd' ) ) ? sanitize_hex_color( $g( 'rd' ) ) : '#e00000',
		// Plain text used only as data by the page script (never printed as HTML), so keep it exactly as typed.
		'cl' => trim( wp_check_invalid_utf8( $g( 'cl' ) ) ),
		'ru' => trim( wp_check_invalid_utf8( $g( 'ru' ) ) ),
	);
	$logo = $g( 'logo' );
	if ( preg_match( '#^data:image/png;base64,[A-Za-z0-9+/=]+$#', $logo ) && strlen( $logo ) < 700000 ) {
		$out['logo']   = $logo;
		$out['logoAR'] = max( 0.2, min( 8, (float) ( isset( $in['logoAR'] ) ? $in['logoAR'] : 1.96 ) ) );
	}
	update_option( DMVB_OPT, $out, false );
	wp_send_json_success();
} );

function dmvb_page_make() {
	if ( ! current_user_can( dmvb_cap() ) ) {
		wp_die( 'You do not have permission to view this page.' );
	}
	$pane = function ( $k, $title, $n ) {
		?>
<div class="dmvb-pane"><h2><?php echo esc_html( $title ); ?></h2>
	<div class="dmvb-bar">
		<button class="button" id="<?php echo esc_attr( $k ); ?>p" disabled>Print</button>
		<button class="button" id="<?php echo esc_attr( $k ); ?>d" disabled>Download</button>
		<button class="button" id="<?php echo esc_attr( $k ); ?>n" disabled>Open in new tab</button>
		<span class="mut" id="<?php echo esc_attr( $n ); ?>"></span>
	</div>
	<iframe id="f<?php echo esc_attr( $k ); ?>" title="<?php echo esc_attr( $title ); ?>"></iframe>
</div>
		<?php
	};
	?>
<div class="wrap dmvb"><h1>DMVb Receipts</h1>
<p>Upload the orders CSV, the supplier CSV, or both. You get print-ready receipts and the Order List Master side by side to check before printing.</p>
<div class="dmvb-card dmvb-wide">
	<label for="m_csv">Orders CSV (orders by customer): makes the receipts and the master's order pages</label><input type="file" id="m_csv" accept=".csv,text/csv">
	<label for="m_csv2">Supplier CSV (orders by product): makes the master's Supplier Order List</label><input type="file" id="m_csv2" accept=".csv,text/csv">
	<p class="description">Orders only: the master shows product totals worked out from the orders. Supplier only: you get just the Supplier Order List page.</p>
	<label for="m_sort">Sort receipts by</label>
	<select id="m_sort"><option value="name">Customer name</option><option value="loc">Pickup location</option><option value="id">Order ID</option></select>
	<p><button class="button button-primary" id="m_go">Refresh preview</button> <span id="m_msg" class="description"></span></p>
</div>
<div class="hide" id="m_view">
	<div class="dmvb-both" id="bth"><b>Both documents:</b> <button class="button button-primary" id="bp" disabled>Print both</button> <button class="button" id="bd" disabled>Download combined PDF</button> <span class="mut">Receipts first, then the Order List Master, as one print job.</span></div>
	<div class="dmvb-split">
		<div id="pr"><?php $pane( 'r', 'Receipts', 'nr' ); ?></div>
		<?php $pane( 'm', 'Order List Master', 'nm' ); ?>
	</div>
</div>
</div>
	<?php
}

function dmvb_page_design() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'You do not have permission to view this page.' );
	}
	?>
<div class="wrap dmvb"><h1>DMVb Receipts: Master design</h1>
<p>Saved for everyone who uses the plugin. Only administrators can change it.</p>
<div class="dmvb-card">
	<label>Logo (between the QR codes)</label><div><img id="lp" alt=""> <input type="file" id="logo" accept="image/*"></div>
	<label for="qr">Help QR code link (bottom left, labelled HELP)</label><input type="text" id="qr" class="large-text">
	<label for="sq">Shop QR code link (bottom right, labelled SHOP)</label><input type="text" id="sq" class="large-text">
	<label for="ch">Chapter name (printed under the logo, shown in capitals; leave blank to hide)</label><input type="text" id="ch" class="regular-text">
	<label for="h1">Bold line above QR</label><input type="text" id="h1" class="large-text">
	<label for="h2">Small line above QR</label><input type="text" id="h2" class="large-text">
	<label for="fk">Footnote trigger word (found in a product name)</label><input type="text" id="fk" class="regular-text">
	<label for="fn">Footnote text (shown in capitals, bold, with a star)</label><input type="text" id="fn" class="large-text">
	<label for="ac">Table line colour</label><input type="color" id="ac">
	<label for="rd">Footnote / star colour</label><input type="color" id="rd">
	<label for="cl">Location colour palette: one #hex per line. Each CSV's pickup locations are sorted Z to A and given these colours in order (the list repeats if there are more locations than colours).</label><textarea id="cl" rows="10" class="large-text code"></textarea>
	<label for="ru">Cleanup rules: one per line as <code>item||regex||replacement</code>. Scope is item, size or loc.</label><textarea id="ru" rows="14" class="large-text code"></textarea>
	<p><button class="button button-primary" id="sv">Save design</button> <button class="button" id="ts">Preview with sample orders</button> <button class="button" id="rs">Reset text to defaults</button> <span id="am" class="description"></span></p>
</div></div>
	<?php
}
