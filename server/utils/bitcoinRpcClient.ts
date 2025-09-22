import axios from 'axios';
import type {
  BanEntry,
  BlockchainInfo,
  NetworkInfo,
  MempoolInfo,
  MiningInfo,
  NetTotals,
  MemoryInfo,
  Difficulty,
  IndexInfo,
  MempoolEntry,
  PeerInfo,
  Transaction,
  RawMempoolVerbose,
} from '~~/shared/types/bitcoinCore';
import { AxiosInstance } from 'axios';

/**
 * Interface defining the structure of a Bitcoin RPC response.
 * @template T - The type of the result data.
 */
interface RpcResponse<T> {
  /** The result of the RPC call, or null if an error occurred. */
  result: T | null;
  /** Error details, if any, or null if the call succeeded. */
  error: { code: number; message: string } | null;
  /** The ID of the RPC request, used to match requests and responses. */
  id: string;
}

/**
 * A client for making JSON-RPC calls to a Bitcoin node.
 * Provides methods to interact with Bitcoin Core APIs for retrieving blockchain, network, and other node information.
 */
export class BitcoinRpcClient {
  /** The Axios instance used for making HTTP requests to the Bitcoin node. */
  private axiosInstance: AxiosInstance;
  /** The name of the Bitcoin node, if provided in credentials; otherwise, the host. */
  public readonly name: string;
  /** The host address of the Bitcoin node. */
  public readonly host: string;

  /** Methods for managing banned IP addresses and subnets. */
  public ban = {
    /**
     * Clears all banned IP addresses or subnets from the node's ban list.
     * @returns A promise resolving to true if the bans were successfully cleared.
     */
    clearBanned: async (): Promise<boolean> => {
      return this.rpc<boolean>('clearbanned');
    },
    /**
     * Retrieves the list of banned IP addresses or subnets.
     * @returns A promise resolving to an array of ban entries.
     */
    listBanned: async (): Promise<BanEntry[]> => {
      return this.rpc<BanEntry[]>('listbanned');
    },
    /**
     * Removes a specific IP address or subnet from the ban list.
     * @param ip - The IP address or subnet to unban (e.g., "192.168.0.420" or "192.168.0.0/24").
     * @returns A promise resolving to true if the ban was successfully removed.
     */
    removeBan: async (ip: string): Promise<boolean> => {
      return this.rpc<boolean>('setban', [ip, 'remove']);
    },
    /**
     * Bans a specified IP address or subnet from connecting to the node.
     * @param ip - The IP address or subnet to ban (e.g., "192.168.0.69" or "192.168.0.0/24").
     * @param banTime - The duration of the ban in seconds (0 for permanent ban).
     * @param absolute - If true, banTime is an absolute Unix timestamp; if false, it’s relative to now.
     * @returns A promise resolving to true if the ban was successfully set.
     */
    setBan: async (
      ip: string,
      banTime: number = 0,
      absolute: boolean = false
    ): Promise<boolean> => {
      return this.rpc<boolean>('setban', [ip, 'add', banTime, absolute]);
    },
  };

  /** Methods for querying blockchain state and information. */
  public blockchain = {
    /**
     * Retrieves detailed information about a block specified by its hash or height.
     * @returns A promise resolving to the block information.
     */
    getBlock: async (blockHash: string): Promise<Block> => {
      return this.rpc<Block>('getblock', [blockHash]);
    },
    /**
     * Retrieves information about the blockchain state, including chain details and synchronization status.
     * @returns A promise resolving to the blockchain information.
     */
    getBlockchainInfo: async (): Promise<BlockchainInfo> => {
      return this.rpc<BlockchainInfo>('getblockchaininfo');
    },
    /**
     * Retrieves information about the blockchain state, including chain details and synchronization status.
     * @returns A promise resolving to the blockchain information.
     */
    getBlockCount: async (): Promise<number> => {
      return this.rpc<number>('getblockcount');
    },
    /**
     * Retrieves the block hash for a given block height.
     * @returns A promise resolving to the blockchain information.
     */
    getBlockHash: async (count: number): Promise<string> => {
      return this.rpc<string>('getblockhash', [count]);
    },
    /**
     * Retrieves detailed information about a Tx specified by its txid.
     * @returns A promise resolving to the Tx information.
     */
    getRawTransaction: async (
      txid: string,
      isGetExtendedInfo: boolean = true
    ): Promise<Transaction> => {
      return this.rpc<Transaction>('getrawtransaction', [
        txid,
        isGetExtendedInfo,
      ]);
    },
  };

  /** Methods for querying node configuration and index information. */
  public config = {
    /**
     * Retrieves information about the node's indexes, such as address or transaction indexes.
     * @returns A promise resolving to the index information.
     */
    getIndexInfo: async (): Promise<IndexInfo> => {
      return this.rpc<IndexInfo>('getindexinfo');
    },
  };

  /** Methods for querying memory pool information. */
  public mempool = {
    /**
     * Retrieves information about the node's memory usage.
     * @returns A promise resolving to the memory information.
     */
    getMemoryInfo: async (): Promise<MemoryInfo> => {
      return this.rpc<MemoryInfo>('getmemoryinfo');
    },
    /**
     * Retrieves information about a specific transaction in the memory pool.
     * @param txid - The transaction ID to query.
     * @returns A promise resolving to the mempool entry information.
     */
    getMempoolEntry: async (txid: string): Promise<MempoolEntry> => {
      return this.rpc<MempoolEntry>('getmempoolentry', [txid]);
    },
    /**
     * Retrieves information about the node's memory pool.
     * @returns A promise resolving to the mempool information.
     */
    getMempoolInfo: async (): Promise<MempoolInfo> => {
      return this.rpc<MempoolInfo>('getmempoolinfo');
    },
    /**
     * Retrieves a list of transaction IDs in the node's memory pool.
     * @param isGetExtendedInfo - True to get extended info.
     * @returns A promise resolving to the mempool information.
     */
    getRawMempool: async (
      isGetExtendedInfo: boolean = true
    ): Promise<RawMempoolVerbose> => {
      return this.rpc<RawMempoolVerbose>('getrawmempool', [isGetExtendedInfo]);
    },
  };

  /** Methods for querying mining-related information. */
  public mining = {
    /**
     * Retrieves the current network difficulty for mining.
     * @returns A promise resolving to the difficulty information.
     */
    getDifficulty: async (): Promise<Difficulty> => {
      return this.rpc<Difficulty>('getdifficulty');
    },
    /**
     * Retrieves information about the node's mining state, including mining-related statistics.
     * @returns A promise resolving to the mining information.
     */
    getMiningInfo: async (): Promise<MiningInfo> => {
      return this.rpc<MiningInfo>('getmininginfo');
    },
  };

  /** Methods for querying network-related information. */
  public network = {
    /**
     * Retrieves information about the node's network state, including connections and protocol details.
     * @returns A promise resolving to the network information.
     */
    getNetworkInfo: async (): Promise<NetworkInfo> => {
      return this.rpc<NetworkInfo>('getnetworkinfo');
    },
    /**
     * Retrieves total network traffic statistics for the node.
     * @returns A promise resolving to the network totals information.
     */
    getNetTotals: async (): Promise<NetTotals> => {
      return this.rpc<NetTotals>('getnettotals');
    },
    /**
     * Retrieves information about the node's connected peers.
     * @returns A promise resolving to the peer information.
     */
    getPeerInfo: async (): Promise<PeerInfo[]> => {
      return this.rpc<PeerInfo[]>('getpeerinfo');
    },
    /**
     * Retrieves the node's uptime in seconds.
     * @returns A promise resolving to the uptime value.
     */
    getUptime: async (): Promise<number> => {
      return this.rpc<number>('uptime');
    },
  };

  /**
   * Creates a new BitcoinRpcClient instance for a specific Bitcoin node.
   * @param nodeIndex - The index of the node in the credentials configuration.
   * @param axiosInstance - The Axios instance for HTTP requests (optional, defaults to a new instance).
   * @throws Error if the node index is invalid or credentials are not found.
   */
  constructor(
    nodeIndex: number,
    axiosInstance: AxiosInstance = axios.create()
  ) {
    const credentials = getBitcoinNodeCredentials();
    if (!credentials[nodeIndex]) {
      throw new Error(`Invalid node index: ${nodeIndex}`);
    }
    const node = credentials[nodeIndex];
    const auth = Buffer.from(`${node.user}:${node.password}`).toString(
      'base64'
    );

    const url = `${node.protocol}://${node.host}:${node.port}`;
    this.axiosInstance = axiosInstance;
    this.axiosInstance.defaults.baseURL = url;
    this.axiosInstance.defaults.headers.common[
      'Authorization'
    ] = `Basic ${auth}`;
    this.axiosInstance.defaults.headers.common['Content-Type'] = 'text/plain';
    this.name = node.name || node.host; // Use name if provided, otherwise fallback to host
    this.host = node.host;
  }

  /**
   * Makes a generic JSON-RPC call to the Bitcoin node.
   * @template T - The expected type of the RPC response result.
   * @param method - The Bitcoin RPC method to call (e.g., 'getblockchaininfo').
   * @param params - Parameters for the RPC method, if any.
   * @param id - The request ID, must be unique for each request.
   * @returns A promise resolving to the RPC call result.
   * @throws Error if the RPC call fails or returns a null result.
   */
  private async rpc<T>(
    method: string,
    params: any[] = [],
    id = `nuxt-rpc-${method}-${Date.now()}`
  ): Promise<T> {
    const response = await this.axiosInstance.post<RpcResponse<T>>('', {
      jsonrpc: '1.0',
      id,
      method,
      params,
    });
    if (response.data.error) {
      throw new Error(response.data.error.message || 'RPC call failed');
    }
    if (response.data.result === null) {
      throw new Error('RPC call returned null result');
    }
    return response.data.result;
  }

  /**
   * Makes a custom JSON-RPC call to the Bitcoin node.
   * @template T - The expected type of the RPC response result.
   * @param method - The Bitcoin RPC method to call (e.g., 'getrawtransaction').
   * @param params - Parameters for the RPC method, if any.
   * @returns A promise resolving to the RPC call result.
   * @throws Error if the RPC call fails or returns a null result.
   */
  async customCall<T>(method: string, params: any[] = []): Promise<T> {
    return this.rpc<T>(method, params);
  }
}
