// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'EUR',
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace(/^[A-Za-z]/, '€'); // Ensure € symbol is used
};
