import ClientPage from './client-page';

export function generateStaticParams() {
  return [
    { category: 'sales', id: 'daily' },
    { category: 'sales', id: 'dining' },
    { category: 'sales', id: 'product' },
    { category: 'sales', id: 'supplier' },
    { category: 'sales', id: 'returns' },
    { category: 'sales', id: 'tax' },
    { category: 'sales', id: 'card-reconsile' },
    { category: 'sales', id: 'main-category' },
    { category: 'sales', id: 'sub-category' },
    { category: 'sales', id: 'item-count' },
    { category: 'sales', id: 'supplier-profit' },
    { category: 'sales', id: 'non-stock' },
    { category: 'finance', id: 'profit-loss' },
    { category: 'stocks', id: 'current-value' },
    { category: 'stocks', id: 'low-stock' },
    { category: 'stocks', id: 'summary' },
    { category: 'stocks', id: 'insights' },
    { category: 'stocks', id: 'transfer' },
    { category: 'finance', id: 'capital' },
    { category: 'finance', id: 'cheques' },
    { category: 'finance', id: 'payments' },
    { category: 'customer', id: 'history' },
    { category: 'customer', id: 'loyalty' },
    { category: 'purchase', id: 'supplier-performance' },
    { category: 'purchase', id: 'history' },
    { category: 'manufacturing', id: 'summary' },
    { category: 'manufacturing', id: 'raw-material-usage' },
    { category: 'manufacturing', id: 'distribution' },
    { category: 'stocks', id: 'advanced-transactions' },
    { category: 'stocks', id: 'advanced-inventory' },
    { category: 'sales', id: 'advanced-sales' },
    { category: 'sales', id: 'batch-sales-audit' },
  ];
}

export default function Page({ params }) {
  return <ClientPage params={params} />;
}
