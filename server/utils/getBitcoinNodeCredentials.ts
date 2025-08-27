import credentialsFromFile from '~~/server/utils/bitcoinNodeCredentials.json';
import { BitcoinNodeCredential } from '~~/server/types/bitcoinCore';

export function getBitcoinNodeCredentials(
  host?: string
): BitcoinNodeCredential[] {
  const config = useRuntimeConfig();
  let nodes: BitcoinNodeCredential[] = [];
  if (!config.bitcoinNodeCredentials) {
    // Get node credentials from file.
    nodes = credentialsFromFile;
  } else {
    // Get node credentials from env.
    nodes = config.bitcoinNodeCredentials;
  }

  // return only one item if a host is passed.
  if (host) {
    const matchingNode = nodes.find((node) => node.host === host);
    if (!matchingNode) {
      const err = new Error();
      err.name = 'ZodError';
      err.message = `No node found with host: ${host}`;
      throw err;
    }

    return [matchingNode];
  }

  return nodes;
}
