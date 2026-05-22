import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { branch } from 'src/app/interfaces/branch';

const selectedBranchKey = 'selected_branch';

export const apiClient = axios.create();

apiClient.interceptors.request.use(async (config) => {
  const url = config.url || '';

  if (url.includes('/auth') || url.includes('/branches') || url.includes('/security')) {
    return config;
  }

  const storedBranch = await Preferences.get({ key: selectedBranchKey });

  if (!storedBranch.value) {
    return config;
  }

  const selectedBranch = JSON.parse(storedBranch.value) as branch;

  config.headers = {
    ...config.headers,
    'x-codempresa': selectedBranch.CODEMPRESA,
    'x-codfilial': selectedBranch.CODFILIAL,
  } as any;

  config.params = {
    ...(config.params || {}),
    codempresa: selectedBranch.CODEMPRESA,
    codfilial: selectedBranch.CODFILIAL,
  };

  return config;
});
