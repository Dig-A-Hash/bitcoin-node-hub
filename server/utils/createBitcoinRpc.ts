import axios from 'axios';

export const createBitcoinRpc = (node: BitcoinNodeCredential) => {
  const auth = Buffer.from(`${node.user}:${node.password}`).toString('base64');
  const url = `http://${node.host}:${node.port}`;

  return axios.create({
    baseURL: url,
    headers: {
      'Content-Type': 'text/plain',
      Authorization: `Basic ${auth}`,
    },
  });
};
