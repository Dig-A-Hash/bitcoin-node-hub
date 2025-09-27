import credentialsFromFile from '~~/server/utils/bitcoinNodeCredentials.json';
import { HttpStatusCode } from 'axios';

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
      throw new StatusError(HttpStatusCode.NotFound, `Host Not Found: ${host}`);
    }

    return [matchingNode];
  }

  return nodes;
}
