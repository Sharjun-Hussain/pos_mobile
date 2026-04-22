import { Preferences } from '@capacitor/preferences';

export const capacitorStorage = {
  getItem: async (name) => {
    const { value } = await Preferences.get({ key: name });
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await Preferences.set({
      key: name,
      value: JSON.stringify(value),
    });
  },
  removeItem: async (name) => {
    await Preferences.remove({ key: name });
  },
};
