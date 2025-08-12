import BitcoinCore from 'bitcoin-core';
import { type BitcoinNodeCredential } from '~~/server/utils/bitcoinCoreTypes';

export const getBitcoinClients = (): BitcoinCore[] => {
  const nodes: BitcoinNodeCredential[] = process.env.BITCOIN_NODES
    ? JSON.parse(process.env.BITCOIN_NODES)
    : [];
  return nodes.map(
    (node: BitcoinNodeCredential, index: number) =>
      new BitcoinCore({
        host: `http://${node.host}:${node.port}`,
        username: node.user,
        password: node.password,
      })
  );
};
