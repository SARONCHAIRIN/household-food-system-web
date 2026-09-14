// src/utils/currency.ts

export const formatKHR = (amount: number | string): string => {
    const num = Math.round(Number(amount) || 0);
    return `${num.toLocaleString()} ៛`;
};

export const formatUSD = (amount: number | string): string => {
    const num = Number(amount) || 0;
    return `$${num.toFixed(2)}`;
};

export const formatCurrency = (amount: number | string, currency: 'KHR' | 'USD' = 'KHR') => {
    const num = Number(amount) || 0;

    if (currency === 'KHR') {
        // ប្រាក់រៀល៖ បង្កត់ចំនួនគត់ និងថែមសញ្ញា ៛ ខាងក្រោយ
        return `${Math.round(num).toLocaleString('en-US')} ៛`;
    }

    // ប្រាក់ដុល្លារ៖ មានចុចក្បៀស ២ ខ្ទង់ និងសញ្ញា $ ខាងមុខ
    return `$${num.toFixed(2)}`;
};