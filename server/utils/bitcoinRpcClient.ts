import { z } from 'zod';
import { createBitcoinRpc } from './createBitcoinRpc'; // Adjust path as needed
import type {
  BlockchainInfo,
  NetworkInfo,
  MempoolInfo,
  MiningInfo,
  NetTotals,
  MemoryInfo,
  Difficulty,
  IndexInfo,
} from '~~/shared/types/bitcoinCore';

// Define the structure of an RPC request
interface RpcRequest {
  method: string;
  params?: any[];
  id?: string;
}

// Define the structure of an RPC response
interface RpcResponse<T> {
  result: T | null;
  error: { code: number; message: string } | null;
  id: string;
}

// Bitcoin RPC Client class
export class BitcoinRpcClient {
  private rpc: ReturnType<typeof createBitcoinRpc>;

  constructor(nodeIndex: number) {
    const credentials = getBitcoinNodeCredentials();
    if (!credentials[nodeIndex]) {
      throw new Error(`Invalid node index: ${nodeIndex}`);
    }
    this.rpc = createBitcoinRpc(credentials[nodeIndex]);
  }

  // Generic method to make an RPC call
  private async makeRpcCall<T>(
    method: string,
    params: any[] = [],
    id = 'nuxt-rpc'
  ): Promise<T> {
    const response = await this.rpc.post<RpcResponse<T>>('', {
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

  // Specific RPC methods
  async getBlockchainInfo(): Promise<BlockchainInfo> {
    return this.makeRpcCall<BlockchainInfo>('getblockchaininfo');
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    return this.makeRpcCall<NetworkInfo>('getnetworkinfo');
  }

  async getMempoolInfo(): Promise<MempoolInfo> {
    return this.makeRpcCall<MempoolInfo>('getmempoolinfo');
  }

  async getMiningInfo(): Promise<MiningInfo> {
    return this.makeRpcCall<MiningInfo>('getmininginfo');
  }

  async getNetTotals(): Promise<NetTotals> {
    return this.makeRpcCall<NetTotals>('getnettotals');
  }

  async getMemoryInfo(): Promise<MemoryInfo> {
    return this.makeRpcCall<MemoryInfo>('getmemoryinfo');
  }

  async getDifficulty(): Promise<Difficulty> {
    return this.makeRpcCall<Difficulty>('getdifficulty');
  }

  async getIndexInfo(): Promise<IndexInfo> {
    return this.makeRpcCall<IndexInfo>('getindexinfo');
  }

  // Generic method for custom RPC calls
  async customCall<T>(method: string, params: any[] = []): Promise<T> {
    return this.makeRpcCall<T>(method, params);
  }
}
