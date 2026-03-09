import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_IDS_KEY = 'saved_sign_ids';

export async function getSavedIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_IDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting saved IDs:', error);
    return [];
  }
}

export async function toggleSavedId(signId: string): Promise<boolean> {
  try {
    const current = await getSavedIds();
    const isCurrentlySaved = current.includes(signId);
    let newSaved: string[];
    if (isCurrentlySaved) {
      newSaved = current.filter(id => id !== signId);
    } else {
      newSaved = [...current, signId];
    }
    await AsyncStorage.setItem(SAVED_IDS_KEY, JSON.stringify(newSaved));
    return !isCurrentlySaved; // return true if now saved
  } catch (error) {
    console.error('Error toggling saved ID:', error);
    return false; // assume not saved on error
  }
}

export async function isSaved(signId: string): Promise<boolean> {
  try {
    const current = await getSavedIds();
    return current.includes(signId);
  } catch (error) {
    console.error('Error checking if saved:', error);
    return false;
  }
}