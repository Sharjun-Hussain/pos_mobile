/**
 * Lightweight ESC/POS Encoder
 * Helps to generate byte arrays for ESC/POS commands and convert them to Base64.
 */

export class EscPosEncoder {
  constructor() {
    this.buffer = [];
    this.initialize();
  }

  /**
   * Initializes the printer (ESC @)
   */
  initialize() {
    this.buffer.push(0x1b, 0x40); // ESC @ — Full printer reset
    this.buffer.push(0x1c, 0x2e); // Disable Chinese font mode (forces standard ASCII)
    this.buffer.push(0x1b, 0x4d, 0x00); // ESC M 0 — Select Font A (12×24, crispest)
    this.buffer.push(0x1b, 0x74, 0x00); // ESC t 0 — PC437 codepage

    // ESC 7 — Set printing parameters for maximum darkness:
    //   n1 = 0x0f (15) — dots per heating slice (higher = more heat per stroke)
    //   n2 = 0xb4 (180) — heating time in 10µs units (was 0xff but some printers cap at 180)
    //   n3 = 0x01 (1)   — heating interval (lower = shorter gap between strokes = darker)
    this.buffer.push(0x1b, 0x37, 0x0f, 0xb4, 0x01);

    // ESC ! — Select print mode: bit3=bold, bit4=double-height, bit5=double-width
    // 0x08 = bold only. Catches printers that ignore ESC E but honour ESC !
    this.buffer.push(0x1b, 0x21, 0x08);

    return this;
  }

  /**
   * Prints text
   */
  text(content) {
    for (let i = 0; i < content.length; i++) {
      this.buffer.push(content.charCodeAt(i));
    }
    return this;
  }

  /**
   * Prints text and adds a newline
   */
  line(content) {
    this.text(content);
    this.newline();
    return this;
  }

  /**
   * Adds a newline (LF)
   */
  newline() {
    this.buffer.push(0x0a);
    return this;
  }

  /**
   * Sets text alignment
   * @param {'left'|'center'|'right'} align
   */
  align(align) {
    const value = align === 'left' ? 0 : align === 'center' ? 1 : 2;
    this.buffer.push(0x1b, 0x61, value);
    return this;
  }

  /**
   * Sets text to bold
   * @param {boolean} bold 
   */
  bold(bold) {
    this.buffer.push(0x1b, 0x45, bold ? 1 : 0);
    return this;
  }

  /**
   * Sets text size
   * @param {number} width 1-8
   * @param {number} height 1-8
   */
  size(width, height) {
    const w = Math.min(Math.max(width, 1), 8) - 1;
    const h = Math.min(Math.max(height, 1), 8) - 1;
    const size = (w << 4) | h;
    this.buffer.push(0x1d, 0x21, size);
    return this;
  }

  /**
   * Cuts the paper
   * @param {'full'|'partial'} mode
   */
  cut(mode = 'full') {
    this.feed(5); // Feed paper to prevent cutting middle of text
    this.buffer.push(0x1d, 0x56, mode === 'full' ? 0 : 1);
    return this;
  }

  /**
   * Feeds lines
   * @param {number} lines
   */
  feed(lines = 1) {
    this.buffer.push(0x1b, 0x64, lines);
    return this;
  }
  
  /**
   * Draws a divider line
   */
  divider(length = 32, char = '-') {
    this.line(char.repeat(length));
    return this;
  }

  /**
   * Prints a QR code (Standard EPSON GS ( k command)
   * @param {string} data
   * @param {number} size 1-16
   */
  qrcode(data, size = 6) {
    const dataLen = data.length + 3;
    const pL = dataLen % 256;
    const pH = Math.floor(dataLen / 256);

    // 1. Model (Standard)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Size
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);
    // 3. Error correction (0x30 = L)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30);
    // 4. Store data
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data.charCodeAt(i));
    }
    // 5. Print
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    
    return this;
  }

  /**
   * Prints a barcode (CODE39)
   * @param {string} data Alphanumeric data
   */
  barcode(data) {
    if (!data) return this;
    
    // Set height
    this.buffer.push(0x1d, 0x68, 60);
    // Set width
    this.buffer.push(0x1d, 0x77, 2);
    // Set text position (2 = below barcode)
    this.buffer.push(0x1d, 0x48, 2);
    
    // Print barcode (CODE39 is m=69)
    const upperData = data.toUpperCase();
    this.buffer.push(0x1d, 0x6b, 69, upperData.length);
    for (let i = 0; i < upperData.length; i++) {
      this.buffer.push(upperData.charCodeAt(i));
    }
    
    return this;
  }

  /**
   * Asynchronously loads and prints an image using ESC * (Bit Image Mode).
   * ESC * is universally supported by all thermal printers.
   * GS v 0 (raster) is EPSON-specific — most generic printers dump raw bytes as text,
   * producing the "garbage on a long roll" issue.
   *
   * @param {string} url  Image URL or Base64 data URI
   * @param {number} maxWidth  Max width in pixels (will be rounded down to multiple of 8)
   * @param {number} maxHeight Max height in pixels — caps logo size to avoid wasting paper
   */
  async image(url, maxWidth = 384, maxHeight = 120) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return this;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;

          // Scale down to fit maxWidth
          if (width > maxWidth) {
            height = Math.round((maxWidth / width) * height);
            width = maxWidth;
          }

          // Cap height to prevent a high-res logo from wasting half a roll
          if (height > maxHeight) {
            width = Math.round((maxHeight / height) * width);
            height = maxHeight;
          }

          // Width must be a multiple of 8 for ESC * column encoding
          width = Math.floor(width / 8) * 8;
          if (width < 8) { resolve(this); return; }

          canvas.width = width;
          canvas.height = height;

          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height).data;

          // ── ESC * (Bit Image Mode) ──────────────────────────────────────
          // Prints the image as 8-dot-tall horizontal strips, column by column.
          // Command: ESC * m nL nH [data]
          //   m  = 0  → 8-dot single-density (most compatible)
          //   nL = width % 256  (number of columns, low byte)
          //   nH = width / 256  (number of columns, high byte)
          //   data = one byte per column per strip; bit7=top dot, bit0=bottom dot
          //
          // Before each strip: ESC 3 n — set line spacing to n/180" so strips
          // are tight (no gap between rows of the image).
          // After image: ESC 2 — restore default line spacing.
          // ────────────────────────────────────────────────────────────────

          const nL = width % 256;
          const nH = Math.floor(width / 256);

          // Set line spacing to exactly 8 dots so LF advances by one strip height
          this.buffer.push(0x1b, 0x33, 0x08); // ESC 3 8

          for (let y = 0; y < height; y += 8) {
            // Begin one 8-dot strip: ESC * 0 nL nH
            this.buffer.push(0x1b, 0x2a, 0x00, nL, nH);

            for (let x = 0; x < width; x++) {
              let byte = 0;
              for (let dot = 0; dot < 8; dot++) {
                const py = y + dot;
                if (py >= height) break;
                const idx = (py * width + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];
                const a = imageData[idx + 3];
                let isBlack = false;
                if (a > 128) {
                  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                  isBlack = luminance < 128;
                }
                if (isBlack) {
                  byte |= (0x80 >> dot); // bit7 = topmost dot in strip
                }
              }
              this.buffer.push(byte);
            }

            this.buffer.push(0x0a); // LF — advance to next strip
          }

          // Restore default line spacing (30/180" ≈ 4.2 mm)
          this.buffer.push(0x1b, 0x32); // ESC 2

          resolve(this);
        } catch (e) {
          console.error('ESC/POS Image parsing error:', e);
          resolve(this);
        }
      };

      img.onerror = () => {
        console.error('ESC/POS Image load error for:', url?.substring(0, 60));
        resolve(this);
      };

      img.src = url;
    });
  }

  /**
   * Returns the final Base64 string for the printer
   */
  encode() {
    if (typeof btoa !== 'undefined') {
      // In browser/webview
      const bytes = new Uint8Array(this.buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } else {
      // Fallback
      return Buffer.from(this.buffer).toString('base64');
    }
  }
}
