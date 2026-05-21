import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import axios from 'axios';
import { branch } from 'src/app/interfaces/branch';
import { environment } from 'src/environments/environment';

export type BranchPolicy = {
  defaultBranch: number | null;
  canSelectBranch: boolean;
};

const selectedBranchKey = 'selected_branch';
const branchPolicyKey = 'branch_policy';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private selectedBranchSubject = new BehaviorSubject<branch | null>(null);
  private branchesSubject = new BehaviorSubject<branch[]>([]);

  selectedBranch$ = this.selectedBranchSubject.asObservable();
  branches$ = this.branchesSubject.asObservable();

  constructor() {
    this.hydrateSelectedBranch();
  }

  async getBranches(forceRefresh = false) {
    if (!forceRefresh && this.branchesSubject.value.length > 0) {
      return this.branchesSubject.value;
    }

    const response = await axios.get(`${environment.url_api}/branches`, { withCredentials: true });
    const branches = response.data?.data || [];
    this.branchesSubject.next(branches);

    return branches;
  }

  async updateDefaultBranch(defaultBranch: number) {
    return axios.put(
      `${environment.url_api}/users/branch`,
      { default_branch: defaultBranch },
      { withCredentials: true }
    );
  }

  async setSelectedBranch(selectedBranch: branch) {
    this.selectedBranchSubject.next(selectedBranch);
    await Preferences.set({ key: selectedBranchKey, value: JSON.stringify(selectedBranch) });
  }

  async getSelectedBranch() {
    const currentBranch = this.selectedBranchSubject.value;

    if (currentBranch) {
      return currentBranch;
    }

    const storedBranch = await Preferences.get({ key: selectedBranchKey });

    if (!storedBranch.value) {
      return null;
    }

    const selectedBranch = JSON.parse(storedBranch.value) as branch;
    this.selectedBranchSubject.next(selectedBranch);

    return selectedBranch;
  }

  async clearSelectedBranch() {
    this.selectedBranchSubject.next(null);
    await Preferences.remove({ key: selectedBranchKey });
  }

  async setBranchPolicy(policy: BranchPolicy) {
    await Preferences.set({ key: branchPolicyKey, value: JSON.stringify(policy) });
  }

  async getBranchPolicy(): Promise<BranchPolicy> {
    const storedPolicy = await Preferences.get({ key: branchPolicyKey });

    if (!storedPolicy.value) {
      return { defaultBranch: null, canSelectBranch: false };
    }

    return JSON.parse(storedPolicy.value) as BranchPolicy;
  }

  async clearBranchPolicy() {
    await Preferences.remove({ key: branchPolicyKey });
  }

  resolveDefaultBranch(branches: branch[], defaultBranch: number | null) {
    if (!defaultBranch) {
      return null;
    }

    return branches.find((item) => item.CODFILIAL === defaultBranch) || null;
  }

  private async hydrateSelectedBranch() {
    const selectedBranch = await this.getSelectedBranch();

    if (selectedBranch) {
      this.selectedBranchSubject.next(selectedBranch);
    }
  }
}
