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
    this.buffer.push(0x1b, 0x40); // Init
    this.buffer.push(0x1c, 0x26); // Enable Chinese font mode (uses the thicker ROM font for English too!)
    this.buffer.push(0x1b, 0x74, 0x00); // Select standard PC437 codepage

    // Force maximum darkness (ESC 7) - Common on generic thermal printers
    this.buffer.push(0x1b, 0x37, 0x00, 0xff, 0x02);
    
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
