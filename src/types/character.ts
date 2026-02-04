export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export enum BodyType {
  Fat = 'Fat',
  Male = 'Male',
  Female = 'Female',
  Thin = 'Thin',
  Hulk = 'Hulk'
}

export enum FaceType {
  Average_Normal = 'Average_Normal',
  Average_Pointy = 'Average_Pointy',
  Average_Wide = 'Average_Wide',
  HeavyJaw_Normal = 'HeavyJaw_Normal',
  Narrow_Normal = 'Narrow_Normal',
  Narrow_Pointy = 'Narrow_Pointy',
  Narrow_Wide = 'Narrow_Wide'
}

export enum HairType {
  Afro = 'Afro',
  Bob = 'Bob',
  Bowlcut = 'Bowlcut',
  Braidbun = 'Braidbun',
  Bravo = 'Bravo',
  Burgundy = 'Burgundy',
  Cleopatra = 'Cleopatra',
  Curly = 'Curly',
  Cute = 'Cute',
  Decent = 'Decent',
  Elder = 'Elder',
  Fancybun = 'Fancybun',
  Firestarter = 'Firestarter',
  Flowy = 'Flowy',
  Fringe = 'Fringe',
  Frozen = 'Frozen',
  Gaston = 'Gaston',
  GreasySwoop = 'GreasySwoop',
  Junkie = 'Junkie',
  Keeper = 'Keeper',
  Lackland = 'Lackland',
  Locks = 'Locks',
  Long = 'Long',
  Mess = 'Mess',
  Mohawk = 'Mohawk',
  Mop = 'Mop',
  Pigtails = 'Pigtails',
  Ponytails = 'Ponytails',
  Primal = 'Primal',
  Princess = 'Princess',
  Randy = 'Randy',
  Recruit = 'Recruit',
  Revolt = 'Revolt',
  Rockstar = 'Rockstar',
  Rookie = 'Rookie',
  Savage = 'Savage',
  Scorpiontail = 'Scorpiontail',
  Scrapper = 'Scrapper',
  Senorita = 'Senorita',
  Shaved = 'Shaved',
  ShaveTopBraid = 'ShaveTopBraid',
  Snazzy = 'Snazzy',
  Spikes = 'Spikes',
  Sticky = 'Sticky',
  Topdog = 'Topdog',
  Troubadour = 'Troubadour',
  Tuft = 'Tuft',
  Warden = 'Warden',
  Wavy = 'Wavy'
}

export interface CharacterDefinition {
  gender: Gender;
  bodyType: BodyType;
  faceType: FaceType;
  hairType: HairType;
  skinColor: string; // hex string e.g., '#ffccaa'
  hairColor: string; // hex string e.g., '#ff0000'
}

export const SKIN_COLORS = [
  '#f5d0ba', // Light
  '#e8b08d', // Medium
  '#d68d60', // Tan
  '#a36a46', // Dark
  '#5c3a24'  // Very Dark
];

export const HAIR_COLORS = [
  '#ffffff', // White
  '#ffff00', // Blonde
  '#995500', // Brown
  '#000000', // Black
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff'  // Blue
];
