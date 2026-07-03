/**
 * QR Code generator using the `qrcode` npm package.
 * Generates a real scannable QR code as a data URL (PNG).
 */
import QRCode from 'qrcode';

export interface TicketQRData {
  bookingId: string;
  movieTitle: string;
  theatreName: string;
  showDate: string;
  showTime: string;
  seats: string[];
  finalAmount: number;
  userId: string;
}

/**mmbjhcjvh kishan bsjbbsj buildera 

 */
export async function generateTicketQR(data: TicketQRData): Promise<string> {
  const payload = JSON.stringify({
    bid: data.bookingId,
    mov: data.movieTitle,
    thx: data.theatreName,
    dt:  data.showDate,
    tm:  data.showTime,
    sts: data.seats.join(','),
    amt: data.finalAmount,
    uid: data.userId,
    // Checksum — simple hash to verify authenticity
    chk: btoa(`${data.bookingId}:${data.finalAmount}:BMS2024`).slice(0, 12),
  });

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 220,
      margin: 2,
      color: {
        dark:  '#111111',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('QR generation failed:', err);
    return '';
  }
}

/**
 * Validate a scanned QR code string.
 * Returns parsed ticket data if valid, null if invalid.
 */
export function validateTicketQR(raw: string): {
  valid: boolean;
  data?: TicketQRData & { chk: string };
  error?: string;
} {
  try {
    const parsed = JSON.parse(raw);
    // Verify checksum
    const expectedChk = btoa(`${parsed.bid}:${parsed.amt}:BMS2024`).slice(0, 12);
    if (parsed.chk !== expectedChk) {
      return { valid: false, error: 'QR code checksum mismatch — ticket may be forged!' };
    }
    return {
      valid: true,
      data: {
        bookingId:   parsed.bid,
        movieTitle:  parsed.mov,
        theatreName: parsed.thx,
        showDate:    parsed.dt,
        showTime:    parsed.tm,
        seats:       parsed.sts.split(','),
        finalAmount: parsed.amt,
        userId:      parsed.uid,
        chk:         parsed.chk,
      },
    };
  } catch {
    return { valid: false, error: 'Invalid QR code format — cannot read ticket data.' };
  }
}
