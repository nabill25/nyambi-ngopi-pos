import { CashierSales, ReportOrder, ShiftCashFlow } from '../types';

const NO_CASHIER_NAME = 'Tanpa nama kasir';

// Rekap penjualan per akun kasir, terbesar dulu. Kunci grup: cashier_id; kalau kosong (data lama) pakai nama.
// Daftar transaksi datang terbaru-dulu, jadi nama yang tampil adalah nama terbaru akun tersebut.
export function groupSalesByCashier(orders: ReportOrder[]): CashierSales[] {
  const rows = new Map<string, CashierSales>();

  for (const order of orders) {
    const name = order.cashier_name?.trim() || NO_CASHIER_NAME;
    const key = order.cashier_id ?? `name:${name}`;
    let row = rows.get(key);
    if (!row) {
      row = { key, cashier_id: order.cashier_id, cashier_name: name, order_count: 0, total: 0, cash_total: 0, qris_total: 0, transfer_total: 0 };
      rows.set(key, row);
    }

    const amount = order.total_amount ?? 0;
    row.order_count += 1;
    row.total += amount;
    if (order.payment_method === 'cash') row.cash_total += amount;
    else if (order.payment_method === 'qris') row.qris_total += amount;
    else if (order.payment_method === 'transfer') row.transfer_total += amount;
  }

  return [...rows.values()].sort((a, b) => b.total - a.total);
}

// Penjualan tiap shift dari daftar transaksi laporan (kunci: shift_id)
export function groupSalesByShift(orders: ReportOrder[]): Map<string, { total: number; count: number }> {
  const rows = new Map<string, { total: number; count: number }>();

  for (const order of orders) {
    if (!order.shift_id) continue;
    const row = rows.get(order.shift_id) ?? { total: 0, count: 0 };
    row.total += order.total_amount ?? 0;
    row.count += 1;
    rows.set(order.shift_id, row);
  }

  return rows;
}

// Total & jumlah entri kas masuk/keluar laci
export function summarizeCashFlows(flows: ShiftCashFlow[]) {
  const summary = { cashIn: 0, cashOut: 0, countIn: 0, countOut: 0 };

  for (const flow of flows) {
    if (flow.type === 'in') {
      summary.cashIn += flow.amount;
      summary.countIn += 1;
    } else {
      summary.cashOut += flow.amount;
      summary.countOut += 1;
    }
  }

  return summary;
}
