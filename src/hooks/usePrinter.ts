import { useState, useCallback } from 'react';
import { EscPosEncoder } from '../lib/escpos';
import { Order, StoreSettings } from '../types';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

let globalDevice: BluetoothDevice | null = null;
let globalServer: BluetoothRemoteGATTServer | null = null;
let globalCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

export function usePrinter() {
  const [isConnected, setIsConnected] = useState<boolean>(!!globalCharacteristic);
  const [isConnecting, setIsConnecting] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(globalDevice?.name || null);

  const connect = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      toast.error('Browser ini tidak mendukung Web Bluetooth API (Gunakan Chrome/Edge)');
      return;
    }

    try {
      setIsConnecting(true);
      // Meminta pengguna memilih perangkat Bluetooth (hanya menampilkan printer)
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // Layanan standar printer ESC/POS
      }).catch((err: unknown) => {
        // Fallback jika layanan standar tidak dikenali, tampilkan semua perangkat
        console.log('Fallback to acceptAllDevices', err);
        return navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] 
        });
      });

      if (!device || !device.gatt) {
        throw new Error('Perangkat tidak ditemukan atau tidak mendukung GATT');
      }

      globalDevice = device;
      setPrinterName(device.name || 'Unknown Printer');

      // Hubungkan ke GATT Server
      const server = await device.gatt.connect();
      globalServer = server;

      // Cari layanan dan karakteristik yang bisa ditulis
      const services = await server.getPrimaryServices();
      let writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        }
        if (writeCharacteristic) break;
      }

      if (!writeCharacteristic) {
        throw new Error('Karakteristik penulisan tidak ditemukan pada perangkat ini');
      }

      globalCharacteristic = writeCharacteristic;
      setIsConnected(true);
      toast.success(`Terhubung ke ${device.name}`);

      // Monitor disconnect event
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        globalCharacteristic = null;
        globalServer = null;
        toast.error('Koneksi printer terputus');
      });

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      if (error.name !== 'NotFoundError') { // NotFoundError is typically user cancelling the picker
        toast.error(`Gagal menyambung: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (globalDevice && globalDevice.gatt?.connected) {
      globalDevice.gatt.disconnect();
    }
    setIsConnected(false);
    globalCharacteristic = null;
    globalServer = null;
    setPrinterName(null);
  }, []);

  const printReceipt = useCallback(async (order: Order, settings: StoreSettings) => {
    if (!globalCharacteristic) {
      toast.error('Printer belum terhubung');
      return;
    }

    try {
      const width = settings.receipt_paper_size === '80mm' ? 48 : 32;
      const e = new EscPosEncoder();
      
      // Header
      e.align('center')
       .bold(true)
       .size(2, 2)
       .text(settings.store_name)
       .newline(2)
       .size(1, 1)
       .bold(false)
       .text(settings.store_address)
       .newline()
       .text(settings.store_phone)
       .newline()
       .text(settings.store_instagram)
       .newline(2);

      // Order Info
      e.align('left')
       .twoColumn(`No: ${order.order_number}`, formatDateTime(order.created_at), width)
       .twoColumn(`Kasir: ${order.cashier_name ?? '-'}`, `Metode: ${order.payment_method.toUpperCase()}`, width)
       .line('-', width);

      // Items
      if (order.order_items) {
        order.order_items.forEach(item => {
          e.text(`${item.product_name}`)
           .newline()
           .twoColumn(`  ${item.quantity} x ${formatCurrency(item.product_price)}`, formatCurrency(item.subtotal), width);
          
          if (item.modifiers_snapshot && item.modifiers_snapshot.length > 0) {
            e.text(`  + ${item.modifiers_snapshot.map(m => m.name).join(', ')}`)
             .newline();
          }
        });
      }

      e.line('-', width);

      // Summary
      e.twoColumn('Subtotal', formatCurrency(order.subtotal), width);
      if (order.discount_amount > 0) {
        e.twoColumn(order.promo_name ? `Diskon (${order.promo_name})` : 'Diskon', `- ${formatCurrency(order.discount_amount)}`, width);
      }
      if (order.tax_amount > 0) {
        e.twoColumn(settings.tax_label, formatCurrency(order.tax_amount), width);
      }
      if (order.points_discount_amount && order.points_discount_amount > 0) {
        e.twoColumn(`Poin (${order.points_redeemed})`, `- ${formatCurrency(order.points_discount_amount)}`, width);
      }

      e.bold(true)
       .twoColumn('TOTAL', formatCurrency(order.total_amount), width)
       .bold(false)
       .newline();

      e.twoColumn('Tunai', formatCurrency(order.paid_amount), width)
       .twoColumn('Kembali', formatCurrency(order.change_amount), width);

      // Footer
      e.newline(2)
       .align('center')
       .text(settings.receipt_footer)
       .newline(2)
       .text('Terima Kasih!')
       .newline(4) // Extra space before cut
       .cut();

      // Send to printer in chunks (some BLE devices have MTU limits, standard is 512, safe is 100-512)
      const data = e.encode();
      const CHUNK_SIZE = 512;
      
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await globalCharacteristic.writeValue(chunk as unknown as BufferSource);
        // Small delay to prevent buffer overflow on cheap printers
        await new Promise(r => setTimeout(r, 50)); 
      }

    } catch (error: any) {
      console.error('Print error:', error);
      toast.error('Gagal mencetak struk: ' + error.message);
    }
  }, []);

  const testPrint = useCallback(async () => {
    if (!globalCharacteristic) return;
    try {
      const e = new EscPosEncoder();
      e.align('center')
       .bold(true)
       .size(2, 2)
       .text('Test Printer')
       .newline(2)
       .size(1, 1)
       .bold(false)
       .text('Koneksi berhasil!')
       .newline(4)
       .cut();

      const data = e.encode();
      await globalCharacteristic.writeValue(data as unknown as BufferSource);
      toast.success('Test print berhasil dikirim');
    } catch (error) {
      console.error(error);
      toast.error('Test print gagal');
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    printerName,
    connect,
    disconnect,
    printReceipt,
    testPrint
  };
}
