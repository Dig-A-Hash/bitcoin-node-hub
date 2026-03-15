export interface NodeName {
  host: string;
  name: string;
  isTxIndex?: boolean;
  isIbd?: boolean;
  isError: boolean;
  isLoading?: boolean;
  hasLoaded?: boolean;
  lastError?: string | null;
}
