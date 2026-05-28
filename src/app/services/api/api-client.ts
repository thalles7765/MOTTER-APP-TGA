import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { branch } from 'src/app/interfaces/branch';

const selectedBranchKey = 'selected_branch';

export const apiClient = axios.create();

apiClient.interceptors.request.use(async (config) => {
  const url = config.url || '';

  if (url.includes('/auth') || url.includes('/branches') || url.includes('/security') || url.includes('/configs') || url.includes('/users')) {
    return config;
  }

  const storedBranch = await Preferences.get({ key: selectedBranchKey });

  if (!storedBranch.value) {
    return config;
  }

  let selectedBranch: branch | null = null;

  try {
    selectedBranch = JSON.parse(storedBranch.value) as branch;
  } catch (error) {
    await Preferences.remove({ key: selectedBranchKey });
    return config;
  }

  if (!selectedBranch?.CODEMPRESA || !selectedBranch?.CODFILIAL) {
    return config;
  }

  config.headers = {
    ...config.headers,
    'x-codempresa': selectedBranch.CODEMPRESA,
    'x-codfilial': selectedBranch.CODFILIAL,
  } as any;

  config.params = {
    codempresa: selectedBranch.CODEMPRESA,
    codfilial: selectedBranch.CODFILIAL,
    ...(config.params || {}),
  };

  return config;
});
