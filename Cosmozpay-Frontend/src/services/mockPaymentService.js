// Lightweight mock of a payment provider (simulates Flutterwave virtual account creation)
export async function createVirtualAccount({ nin, fullName } = {}) {
  // simulate network delay
  await new Promise((r) => setTimeout(r, 300));

  const digits = (nin || '').replace(/\D/g, '');
  const accountNumber = digits.length >= 7 ? `187${digits.slice(-7).padStart(7, '0')}` : `187${Math.floor(1000000 + Math.random() * 9000000)}`;
  const reference = `FW-${(digits.slice(-4) || Math.random().toString().slice(2,6))}-${Date.now().toString().slice(-4)}`;

  const banks = ['Access Bank', 'Zenith Bank', 'First Bank', 'Guaranty Trust Bank', 'FCMB'];
  // deterministic pick when nin provided, otherwise random
  const bankIndex = digits.length ? parseInt(digits.slice(-1), 10) % banks.length : Math.floor(Math.random() * banks.length);
  const bankName = banks[bankIndex];

  return {
    bankName,
    // match Flutterwave style: CosmozPay/<user_full_name>
    accountName: fullName ? `CosmozPay/${fullName}` : 'CosmozPay/Wallet',
    accountNumber,
    status: 'Active',
    createdDate: new Date().toISOString().slice(0,10),
    reference,
    provider: 'flutterwave',
  };
}

export default { createVirtualAccount };
