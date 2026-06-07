export type FutureFeatureKey =
  | 'ocr-scanning'
  | 'image-insertion'
  | 'firebase-sync'
  | 'cloud-backup'
  | 'collaboration'
  | 'audio-playback';

export type FutureFeatureStatus = {
  key: FutureFeatureKey;
  enabled: false;
  message: string;
};

export function getFutureFeatureStatus(key: FutureFeatureKey): FutureFeatureStatus {
  return {
    key,
    enabled: false,
    message: 'This extension point is intentionally disabled in the offline APK build.'
  };
}
