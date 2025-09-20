export function useHelpers() {
  const router = useRouter();

  function navigateToPeers(index: number) {
    router.push(`/peers?i=${index}`);
  }

  function navigateToNodeInfo(index: number) {
    router.push(`/node-info?i=${index}`);
  }

  return { navigateToPeers, navigateToNodeInfo };
}
