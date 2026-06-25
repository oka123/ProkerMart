
import midtransClient from 'midtrans-client';

export const snap = new midtransClient.Snap({
    isProduction: false,  // Ubah ke true jika nanti proyek sudah live/production
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});