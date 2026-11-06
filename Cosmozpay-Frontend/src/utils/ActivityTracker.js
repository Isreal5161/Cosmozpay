/**
 * Activity/Transaction Tracking Helper
 * 
 * This file shows how to add new activities when users complete transactions
 * across the app (data purchase, airtime, transfers, etc.)
 */

import ActivityService from '../services/ActivityService';

/**
 * Example: Add activity when user purchases data
 * Call this in your Data Purchase screen when transaction succeeds
 */
export function addDataPurchaseActivity(phoneNumber, package_name, amount) {
  ActivityService.addActivity({
    title: 'Data bundle',
    subtitle: package_name,
    amount: `-NGN ${amount}`,
    time: new Date().toLocaleString(),
    positive: false,
    icon: 'wifi',
    id: '#' + Date.now(),
    dateTime: new Date().toLocaleString(),
    hash: '#' + Math.random().toString(36).slice(2, 15),
    recipient: phoneNumber,
    package: package_name,
    description: `Data purchase for ${package_name}`,
    paidWith: 'MAIN',
    status: 'Completed',
    statusProgress: 3
  });
}

/**
 * Example: Add activity when user buys airtime
 */
export function addAirtimePurchaseActivity(phoneNumber, operator, amount) {
  ActivityService.addActivity({
    title: 'Airtime purchase',
    subtitle: operator + ' line',
    amount: `-NGN ${amount}`,
    time: new Date().toLocaleString(),
    positive: false,
    icon: 'phone',
    id: '#' + Date.now(),
    dateTime: new Date().toLocaleString(),
    hash: '#' + Math.random().toString(36).slice(2, 15),
    recipient: phoneNumber,
    package: `${operator} Airtime`,
    description: `${operator} Airtime Purchase`,
    paidWith: 'MAIN',
    status: 'Completed',
    statusProgress: 3
  });
}

/**
 * Example: Add activity when user makes a transfer
 */
export function addTransferActivity(recipientName, recipientPhone, amount) {
  ActivityService.addActivity({
    title: `Transfer to ${recipientName}`,
    subtitle: 'CosmozPay wallet',
    amount: `-NGN ${amount}`,
    time: new Date().toLocaleString(),
    positive: false,
    icon: 'send',
    id: '#' + Date.now(),
    dateTime: new Date().toLocaleString(),
    hash: '#' + Math.random().toString(36).slice(2, 15),
    recipient: recipientPhone,
    package: 'CosmozPay Transfer',
    description: `Transfer to ${recipientName}`,
    paidWith: 'MAIN',
    status: 'Completed',
    statusProgress: 3
  });
}

/**
 * Example: Add activity for wallet funding
 */
export function addWalletFundingActivity(amount, method = 'Bank Transfer') {
  ActivityService.addActivity({
    title: 'Wallet funded',
    subtitle: method,
    amount: `+NGN ${amount}`,
    time: new Date().toLocaleString(),
    positive: true,
    icon: 'arrow-down-left',
    id: '#' + Date.now(),
    dateTime: new Date().toLocaleString(),
    hash: '#' + Math.random().toString(36).slice(2, 15),
    recipient: 'Self',
    package: method,
    description: `${method} Deposit`,
    paidWith: 'MAIN',
    status: 'Completed',
    statusProgress: 3
  });
}

/**
 * Generic function to add any activity
 * Usage in any transaction screen:
 * 
 * const addActivity = useAddActivity();
 * addActivity({
 *   title: 'Your transaction',
 *   subtitle: 'Description',
 *   amount: '±NGN amount',
 *   positive: true/false,
 *   icon: 'feather-icon-name',
 *   id: unique_id,
 *   dateTime: date_string,
 *   hash: transaction_hash,
 *   recipient: recipient_info,
 *   package: service_package,
 *   description: full_description,
 *   paidWith: 'MAIN',
 *   status: 'Completed',
 *   statusProgress: 3
 * });
 */
