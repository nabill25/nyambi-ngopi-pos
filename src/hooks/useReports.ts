import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SalesReport, DailySales, TopProduct, PaymentBreakdown } from '../types';
import { format, eachDayOfInterval } from 'date-fns';
import { formatCurrency } from '../lib/utils';

export function useReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SalesReport | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>([]);

  const fetchReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    setError(null);

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    try {
      // ── Fetch completed orders in range ──────────────────────
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, payment_method, created_at, cashier_name, subtotal, discount_amount, tax_amount, order_items(quantity, subtotal, product_name, product_cost)')
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const completedOrders = orders ?? [];
      setRawOrders(completedOrders);

      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
      const totalOrders = completedOrders.length;
      const totalItemsSold = completedOrders.reduce((sum, o) => {
        return sum + ((o.order_items as { quantity: number }[]) ?? []).reduce((s, i) => s + i.quantity, 0);
      }, 0);
      const totalCost = completedOrders.reduce((sum, o) => {
        return sum + ((o.order_items as { quantity: number; product_cost?: number }[]) ?? [])
          .reduce((s, i) => s + (i.product_cost ?? 0) * i.quantity, 0);
      }, 0);
      const totalProfit = totalRevenue - totalCost;

      setSummary({
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        average_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        total_items_sold: totalItemsSold,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin_percent: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0,
      });

      // ── Daily sales (fill missing days with 0) ───────────────
      const daysMap: Record<string, DailySales> = {};
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      allDays.forEach((day) => {
        const key = format(day, 'yyyy-MM-dd');
        daysMap[key] = { date: key, total: 0, orders: 0 };
      });

      completedOrders.forEach((order) => {
        const key = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (daysMap[key]) {
          daysMap[key].total += order.total_amount ?? 0;
          daysMap[key].orders += 1;
        }
      });

      setDailySales(Object.values(daysMap));

      // ── Top products ─────────────────────────────────────────
      const productMap: Record<string, TopProduct> = {};
      completedOrders.forEach((order) => {
        ((order.order_items as { quantity: number; subtotal: number; product_name: string }[]) ?? []).forEach((item) => {
          const key = item.product_name;
          if (!productMap[key]) {
            productMap[key] = {
              product_id: key,
              product_name: key,
              total_quantity: 0,
              total_revenue: 0,
            };
          }
          productMap[key].total_quantity += item.quantity;
          productMap[key].total_revenue += item.subtotal;
        });
      });

      setTopProducts(
        Object.values(productMap)
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, 10)
      );

      // ── Payment breakdown ────────────────────────────────────
      const paymentMap: Record<string, PaymentBreakdown> = {};
      completedOrders.forEach((order) => {
        const method = order.payment_method as string;
        if (!paymentMap[method]) {
          paymentMap[method] = { payment_method: method as PaymentBreakdown['payment_method'], count: 0, total: 0 };
        }
        paymentMap[method].count += 1;
        paymentMap[method].total += order.total_amount ?? 0;
      });

      setPaymentBreakdown(Object.values(paymentMap));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportPDF = (orders: { order_number?: string; created_at: string; total_amount: number; payment_method: string; cashier_name?: string; subtotal?: number; discount_amount?: number; tax_amount?: number }[], rangeLabel: string) => {
    const totalRevenue = summary?.total_revenue ?? orders.reduce((s, o) => s + o.total_amount, 0);
    const totalOrders = summary?.total_orders ?? orders.length;
    const totalProfit = summary?.total_profit ?? 0;
    const profitMargin = summary?.profit_margin_percent ?? 0;
    const totalItems = summary?.total_items_sold ?? 0;

    const rowsHTML = orders.map((o, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8faf8'}">
        <td style="padding:7px 10px;font-weight:600;color:#0d3d20;">${o.order_number ?? '-'}</td>
        <td style="padding:7px 10px;">${format(new Date(o.created_at), 'dd/MM/yy HH:mm')}</td>
        <td style="padding:7px 10px;">${o.cashier_name ?? '-'}</td>
        <td style="padding:7px 10px;">${(o.payment_method ?? '').toUpperCase()}</td>
        <td style="padding:7px 10px;text-align:right;">${formatCurrency(o.subtotal ?? 0)}</td>
        <td style="padding:7px 10px;text-align:right;color:#16a34a;">${o.discount_amount ? formatCurrency(o.discount_amount) : '-'}</td>
        <td style="padding:7px 10px;text-align:right;">${o.tax_amount ? formatCurrency(o.tax_amount) : '-'}</td>
        <td style="padding:7px 10px;text-align:right;font-weight:700;color:#1f9c56;">${formatCurrency(o.total_amount)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8">
<title>Laporan Penjualan - Nyambi Ngopi</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
  .header { background: linear-gradient(135deg, #0d3d20, #1f9c56); color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
  .header p { font-size: 11px; opacity: 0.8; }
  .header-right { text-align: right; font-size: 10px; opacity: 0.85; }
  .cards { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; padding: 14px 0 10px; }
  .card { background: #f0f6f1; border-radius: 8px; padding: 10px 12px; text-align: center; }
  .card-label { font-size: 9px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card-value { font-size: 13px; font-weight: 800; color: #1f9c56; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead tr { background: #0d3d20 !important; }
  thead th { padding: 8px 10px; text-align: left; color: white; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  thead th:last-child, thead th:nth-child(5), thead th:nth-child(6), thead th:nth-child(7) { text-align: right; }
  tbody td { border-bottom: 1px solid #e2e8f0; font-size: 10px; }
  .footer { margin-top: 16px; text-align: center; font-size: 9px; color: #94a3b8; }
  .print-btn { padding: 10px 24px; background: #1f9c56; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .print-btn:hover { background: #0d3d20; }
  .back-btn { padding: 10px 24px; background: #fff; color: #334155; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .back-btn:hover { background: #f1f5f9; }
  .action-bar { position: sticky; top: 0; z-index: 20; background: #fff; padding: 12px 0; display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; }
</style>
</head><body>
<div class="no-print action-bar">
  <button class="back-btn" onclick="goBackOrClose()">← Kembali</button>
  <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
</div>
<p class="no-print" style="font-size:10px;color:#94a3b8;text-align:center;margin:6px 0 0;">Gunakan "Save as PDF" pada dialog cetak untuk menyimpan sebagai file PDF</p>

<div class="header" style="margin-top:12px;">
  <div>
    <h1>Laporan Penjualan</h1>
    <p>Nyambi Ngopi POS &nbsp;·&nbsp; Periode: ${rangeLabel}</p>
  </div>
  <div class="header-right">
    <div>Dicetak: ${format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
    <div style="margin-top:2px;">${orders.length} transaksi dalam periode ini</div>
  </div>
</div>

<div class="cards">
  <div class="card"><div class="card-label">Total Pendapatan</div><div class="card-value">${formatCurrency(totalRevenue)}</div></div>
  <div class="card"><div class="card-label">Jumlah Transaksi</div><div class="card-value">${totalOrders}</div></div>
  <div class="card"><div class="card-label">Item Terjual</div><div class="card-value">${totalItems}</div></div>
  <div class="card"><div class="card-label">Laba Bersih</div><div class="card-value">${formatCurrency(totalProfit)}</div></div>
  <div class="card"><div class="card-label">Profit Margin</div><div class="card-value">${profitMargin}%</div></div>
</div>

<script>
  // window.close() sering diblokir di browser mobile untuk tab yang dibuka
  // sebagai "tab baru" (bukan popup asli). Coba tutup, dan kalau masih
  // kebuka setelah itu, ganti isi halaman dengan instruksi jelas supaya
  // pengguna tidak "macet" tanpa tahu harus apa.
  function goBackOrClose() {
    window.close();
    setTimeout(function () {
      document.body.innerHTML = '<div style="padding:60px 24px;text-align:center;font-family:Arial,sans-serif;">' +
        '<p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:6px;">Laporan sudah selesai ditampilkan</p>' +
        '<p style="font-size:13px;color:#94a3b8;">Tab ini tidak bisa ditutup otomatis oleh browser. Silakan tutup tab ini secara manual untuk kembali ke aplikasi.</p>' +
        '</div>';
    }, 250);
  }
</script>

<table>
  <thead>
    <tr>
      <th>No. Struk</th>
      <th>Tanggal</th>
      <th>Kasir</th>
      <th>Metode Bayar</th>
      <th style="text-align:right;">Subtotal</th>
      <th style="text-align:right;">Diskon</th>
      <th style="text-align:right;">Pajak</th>
      <th style="text-align:right;">Total</th>
    </tr>
  </thead>
  <tbody>${rowsHTML}</tbody>
</table>

<div class="footer">
  <p>Laporan ini digenerate otomatis oleh Nyambi Ngopi POS &nbsp;·&nbsp; ${format(new Date(), 'dd MMMM yyyy')}</p>
</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=1100,height=750');
    if (!win) {
      alert('Pop-up diblokir browser. Harap izinkan pop-up untuk situs ini dan coba lagi.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  return {
    isLoading,
    error,
    summary,
    dailySales,
    topProducts,
    paymentBreakdown,
    rawOrders,
    fetchReport,
    exportPDF,
  };
}
