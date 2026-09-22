export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.initialize();
  }

  // 1. Inisialisasi printer
  initialize() {
    this.buffer.push(0x1B, 0x40); // ESC @
    return this;
  }

  // 2. Teks biasa
  text(text: string) {
    for (let i = 0; i < text.length; i++) {
      this.buffer.push(text.charCodeAt(i));
    }
    return this;
  }

  // 3. Pindah baris
  newline(count: number = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0A); // LF
    }
    return this;
  }

  // 4. Perataan teks (0 = kiri, 1 = tengah, 2 = kanan)
  align(alignment: 'left' | 'center' | 'right') {
    const alignMap = { left: 0, center: 1, right: 2 };
    this.buffer.push(0x1B, 0x61, alignMap[alignment]);
    return this;
  }

  // 5. Ukuran teks (GS !)
  size(width: 1 | 2, height: 1 | 2) {
    const w = width === 2 ? 0x10 : 0x00;
    const h = height === 2 ? 0x01 : 0x00;
    this.buffer.push(0x1D, 0x21, w | h);
    return this;
  }

  // 6. Cetak garis pembatas
  line(char: string = '-', length: number = 32) {
    this.text(char.repeat(length));
    this.newline();
    return this;
  }

  // 7. Teks dua kolom (kiri & kanan)
  twoColumn(left: string, right: string, totalWidth: number = 32) {
    const spaces = totalWidth - left.length - right.length;
    if (spaces > 0) {
      this.text(left + ' '.repeat(spaces) + right);
    } else {
      this.text(left + ' ' + right);
    }
    this.newline();
    return this;
  }

  // 8. Tebal
  bold(enable: boolean) {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  // 9. Potong kertas (Cut)
  cut() {
    this.buffer.push(0x1D, 0x56, 0x41, 0x03); // GS V A 3
    return this;
  }

  // Dapatkan hasil akhir berupa Uint8Array untuk dikirim via Bluetooth
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
