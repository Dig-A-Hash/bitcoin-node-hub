export function useHelpers() {
  const router = useRouter();

  function navigateToPeers(index: number) {
    router.push(`/peers/${index}`);
  }

  function navigateToNodeInfo(index: number) {
    router.push(`/node-info/${index}`);
  }

  return { navigateToPeers, navigateToNodeInfo };
}
