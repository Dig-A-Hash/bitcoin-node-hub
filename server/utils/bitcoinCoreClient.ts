import BitcoinCore from 'bitcoin-core';

// Initialize the BitcoinCore client as a singleton
const client = new BitcoinCore({
  host: `http://${process.env.BITCOIN_RPC_HOST}:${process.env.BITCOIN_RPC_PORT}`,
  username: process.env.BITCOIN_RPC_USER,
  password: process.env.BITCOIN_RPC_PASSWORD,
});

export default client;
