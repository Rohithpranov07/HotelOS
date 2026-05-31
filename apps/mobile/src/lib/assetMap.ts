// Maps server-side `image_key` strings to bundled local image requires.
// React Native's require() can't accept dynamic strings, so this lookup
// table is the bridge between the API's serializable shape and the bundle.

export const ASSET_MAP: Record<string, number> = {
  // housekeeping + comforts + spa + recreation
  maidcare: require('../../assets/maidcare.jpg'),
  spa: require('../../assets/spa.jpg'),
  towels: require('../../assets/towels.jpg'),
  bedding: require('../../assets/bedding.jpg'),
  toiletry: require('../../assets/toiletry.jpg'),
  hangers: require('../../assets/hangers.jpg'),
  adapter: require('../../assets/adapter.jpg'),
  bar: require('../../assets/bar.webp'),
  bonfire: require('../../assets/bonfire.jpg'),
  gym: require('../../assets/gym.jpg'),
  kidsplay: require('../../assets/kidsplay.jpg'),
  golf: require('../../assets/golf.webp'),
  garden: require('../../assets/garden.webp'),
  indoorgames: require('../../assets/indoorgames.webp'),

  // attractions (Kodaikanal)
  lake: require('../../assets/lake.jpg'),
  Coakers: require('../../assets/Coakers.jpg'),
  Bryantpark: require('../../assets/Bryantpark.jpg'),
  pillarrocks: require('../../assets/pillarrocks.jpg'),
  Berijam: require('../../assets/Berijam.jpg'),
  Silvercascade: require('../../assets/Silvercascade.jpg'),
  Kuruji: require('../../assets/Kuruji.jpg'),

  // rooms
  ExecutiveRoom1: require('../../assets/rooms/ExecutiveRoom1.jpg'),
  ExecutiveRoom2: require('../../assets/rooms/ExecutiveRoom2.jpg'),
  ExecutiveRoom3: require('../../assets/rooms/ExecutiveRoom3.jpg'),
  ExecutiveRoom4: require('../../assets/rooms/ExecutiveRoom4.jpg'),
  Deluxdouble1: require('../../assets/rooms/Deluxdouble1.jpg'),
  Deluxdouble2: require('../../assets/rooms/Deluxdouble2.jpg'),
  Deluxdouble3: require('../../assets/rooms/Deluxdouble3.jpg'),
  Deluxdouble4: require('../../assets/rooms/Deluxdouble4.jpg'),
  Deluxdouble5: require('../../assets/rooms/Deluxdouble5.jpg'),
  FamilyRoom1: require('../../assets/rooms/FamilyRoom1.jpg'),
  FamilyRoom2: require('../../assets/rooms/FamilyRoom2.jpg'),
  FamilyRoom3: require('../../assets/rooms/FamilyRoom3.jpg'),
  FamilyRoom4: require('../../assets/rooms/FamilyRoom4.jpg'),
  FamilyRoom5: require('../../assets/rooms/FamilyRoom5.jpg'),
  JRSuiteRoom1: require('../../assets/rooms/JRSuiteRoom1.jpg'),
  JRSuiteRoom2: require('../../assets/rooms/JRSuiteRoom2.jpg'),
  JRSuiteRoom3: require('../../assets/rooms/JRSuiteRoom3.jpg'),
  JRSuiteRoom4: require('../../assets/rooms/JRSuiteRoom4.jpg'),
  JRSuiteRoom5: require('../../assets/rooms/JRSuiteRoom5.jpg'),
  SuiteRoom1: require('../../assets/rooms/SuiteRoom1.jpg'),
  SuiteRoom2: require('../../assets/rooms/SuiteRoom2.jpg'),
  SuiteRoom3: require('../../assets/rooms/SuiteRoom3.jpg'),
  SuiteRoom4: require('../../assets/rooms/SuiteRoom4.jpg'),
  SuiteRoom5: require('../../assets/rooms/SuiteRoom5.jpg'),
};

export function resolveAsset(key?: string | null): number | undefined {
  if (!key) return undefined;
  return ASSET_MAP[key];
}
