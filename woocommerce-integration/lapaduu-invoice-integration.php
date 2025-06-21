<?php
/**
 * LapaDuu Invoice Integration for WooCommerce
 * Add this to your theme's functions.php or as a custom plugin
 */

// Hook into WooCommerce order completion
add_action('woocommerce_order_status_completed', 'lapaduu_create_invoice_for_order');
add_action('woocommerce_order_status_processing', 'lapaduu_create_invoice_for_order'); // For digital products

function lapaduu_create_invoice_for_order($order_id) {
    error_log("LapaDuu: Creating invoice for order #$order_id");
    
    $order = wc_get_order($order_id);
    if (!$order) {
        error_log("LapaDuu: Order #$order_id not found");
        return;
    }

    // Check if invoice already created (prevent duplicates)
    $existing_invoice = get_post_meta($order_id, '_lapaduu_invoice_number', true);
    if ($existing_invoice) {
        error_log("LapaDuu: Invoice already exists for order #$order_id: #$existing_invoice");
        return;
    }

    // Prepare invoice data
    $invoice_data = lapaduu_prepare_invoice_data($order);
    
    // Send to invoice API
    $invoice_result = lapaduu_send_to_invoice_api($invoice_data);
    
    if ($invoice_result && $invoice_result['success']) {
        // Store invoice number in order meta
        update_post_meta($order_id, '_lapaduu_invoice_number', $invoice_result['invoiceNumber']);
        update_post_meta($order_id, '_lapaduu_invoice_pdf', $invoice_result['downloadUrl']);
        
        // Add order note
        $order->add_order_note(
            sprintf('LapaDuu arve loodud: #%s', $invoice_result['invoiceNumber'])
        );
        
        error_log("LapaDuu: Invoice #{$invoice_result['invoiceNumber']} created for order #$order_id");
        
        // Optional: Email invoice to customer
        lapaduu_email_invoice_to_customer($order, $invoice_result);
    } else {
        error_log("LapaDuu: Failed to create invoice for order #$order_id");
        $order->add_order_note('LapaDuu arve loomine ebaõnnestus');
    }
}

function lapaduu_prepare_invoice_data($order) {
    // Get customer data
    $billing_address = sprintf(
        "%s\n%s, %s %s\n%s",
        $order->get_billing_address_1(),
        $order->get_billing_city(),
        $order->get_billing_state(),
        $order->get_billing_postcode(),
        $order->get_billing_country()
    );
    
    // Prepare items
    $items = array();
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $item_total = $item->get_total();
        
        // Get product variations (size, pattern, etc.)
        $variation_text = '';
        if ($item->get_variation_id()) {
            $variation_data = $item->get_formatted_meta_data();
            $variations = array();
            foreach ($variation_data as $meta) {
                $variations[] = $meta->display_key . ': ' . $meta->display_value;
            }
            if (!empty($variations)) {
                $variation_text = ' (' . implode(', ', $variations) . ')';
            }
        }
        
        $items[] = array(
            'description' => $product->get_name() . $variation_text,
            'unitPrice' => number_format($item_total / $item->get_quantity(), 2, '.', ''),
            'quantity' => (string)$item->get_quantity(),
            'discount' => '0',
            'total' => number_format($item_total, 2, '.', '')
        );
    }
    
    // Add shipping if exists
    if ($order->get_shipping_total() > 0) {
        $items[] = array(
            'description' => 'Kohaletoimetamine',
            'unitPrice' => number_format($order->get_shipping_total(), 2, '.', ''),
            'quantity' => '1',
            'discount' => '0',
            'total' => number_format($order->get_shipping_total(), 2, '.', '')
        );
    }
    
    // Determine payment method for due date
    $payment_method = $order->get_payment_method();
    $is_prepaid = in_array($payment_method, ['stripe', 'paypal', 'bacs']); // Add your payment methods
    
    return array(
        'clientEmail' => $order->get_billing_email(),
        'buyerName' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
        'clientAddress' => $billing_address,
        'regCode' => '', // Most customers won't have business reg code
        'invoiceDate' => $order->get_date_created()->format('Y-m-d'),
        'dueDate' => $order->get_date_created()->format('Y-m-d'), // Same day for prepaid
        'isPaid' => $is_prepaid,
        'source' => 'website',
        'woocommerce_order_id' => $order->get_id(),
        'payment_method' => $payment_method,
        'items' => $items
    );
}

function lapaduu_send_to_invoice_api($data) {
    // Your invoice generator API URL
    $api_url = 'https://your-invoice-generator.vercel.app/api/generate-invoice';
    // Or if running locally: 'http://localhost:3000/api/generate-invoice'
    
    $response = wp_remote_post($api_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode($data),
        'timeout' => 30
    ));
    
    if (is_wp_error($response)) {
        error_log('LapaDuu API Error: ' . $response->get_error_message());
        return false;
    }
    
    $body = wp_remote_retrieve_body($response);
    $result = json_decode($body, true);
    
    if (!$result || !$result['success']) {
        error_log('LapaDuu API Failed: ' . $body);
        return false;
    }
    
    return $result;
}

function lapaduu_email_invoice_to_customer($order, $invoice_result) {
    $customer_email = $order->get_billing_email();
    $customer_name = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();
    $invoice_number = $invoice_result['invoiceNumber'];
    
    // Call the email API endpoint
    $email_api_url = 'https://your-invoice-generator.vercel.app/api/send-email';
    
    $email_data = array(
        'recipientEmail' => $customer_email,
        'invoiceNumber' => $invoice_number,
        'customerName' => $customer_name,
        'source' => 'website',
        'pdfUrl' => $invoice_result['downloadUrl'] // Base64 PDF data
    );
    
    $response = wp_remote_post($email_api_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode($email_data),
        'timeout' => 30
    ));
    
    if (!is_wp_error($response)) {
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);
        
        if ($result && $result['success']) {
            $order->add_order_note("Arve PDF saadetud emailile: $customer_email");
            error_log("LapaDuu: Invoice PDF emailed to $customer_email");
        } else {
            $order->add_order_note("Arve email saatmine ebaõnnestus: $customer_email");
            error_log("LapaDuu: Failed to email invoice to $customer_email");
        }
    }
}

// Add invoice info to WooCommerce admin order page
add_action('woocommerce_admin_order_data_after_billing_address', 'lapaduu_display_invoice_info');

function lapaduu_display_invoice_info($order) {
    $invoice_number = get_post_meta($order->get_id(), '_lapaduu_invoice_number', true);
    $invoice_pdf = get_post_meta($order->get_id(), '_lapaduu_invoice_pdf', true);
    
    if ($invoice_number) {
        echo '<div class="address">';
        echo '<p><strong>LapaDuu Arve:</strong> #' . esc_html($invoice_number) . '</p>';
        if ($invoice_pdf) {
            echo '<p><a href="' . esc_url($invoice_pdf) . '" target="_blank" class="button">Laadi alla PDF</a></p>';
        }
        echo '</div>';
    }
}

// Add invoice column to orders list
add_filter('manage_edit-shop_order_columns', 'lapaduu_add_invoice_column');
add_action('manage_shop_order_posts_custom_column', 'lapaduu_show_invoice_column');

function lapaduu_add_invoice_column($columns) {
    $columns['lapaduu_invoice'] = 'LapaDuu Arve';
    return $columns;
}

function lapaduu_show_invoice_column($column) {
    global $post;
    
    if ($column == 'lapaduu_invoice') {
        $invoice_number = get_post_meta($post->ID, '_lapaduu_invoice_number', true);
        if ($invoice_number) {
            echo '#' . esc_html($invoice_number);
        } else {
            echo '—';
        }
    }
}
?>
