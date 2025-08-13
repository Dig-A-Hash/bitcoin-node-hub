import { ref, watch } from 'vue';

export function useCustomColorMode() {
  const mode = ref(localStorage.getItem('theme') || 'light');

  watch(
    mode,
    (newMode) => {
      localStorage.setItem('theme', newMode);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newMode);
    },
    { immediate: true }
  );

  const toggleColorMode = () => {
    mode.value = mode.value === 'light' ? 'dark' : 'light';
  };

  return { mode, toggleColorMode };
}
