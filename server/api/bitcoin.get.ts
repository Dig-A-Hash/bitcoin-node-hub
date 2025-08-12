/// <reference path="../../types/bitcoin.d.ts" />
import bitcoin from 'bitcoin';
import type { H3Event } from 'h3';

const client = new bitcoin.Client({
  host: process.env.BITCOIN_RPC_HOST || '192.168.7.253',
  port: Number(process.env.BITCOIN_RPC_PORT) || 8332,
  user: process.env.BITCOIN_RPC_USER || '',
  pass: process.env.BITCOIN_RPC_PASSWORD || '',
  timeout: 5000, // Set a 5-second timeout for connections
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Log environment variables (avoid logging password in production)
    console.log({
      host: process.env.BITCOIN_RPC_HOST,
      port: process.env.BITCOIN_RPC_PORT,
      user: process.env.BITCOIN_RPC_USER,
    });

    const result = await new Promise((resolve, reject) => {
      client.getPeerInfo((err: Error | null, res: any) => {
        if (err) {
          console.error('RPC Error Details:', { message: err.message });
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    return { success: true, result, host: process.env.BITCOIN_RPC_HOST };
  } catch (error: any) {
    console.error('Handler Error:', { message: error.message });
    return {
      success: false,
      error: { message: error.message },
      host: process.env.BITCOIN_RPC_HOST,
    };
  }
});
