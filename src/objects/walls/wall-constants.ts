// Mask -> Frame Index mapping (Standard 4x4)
// Indices based on:
// Row 0: TL(0), T(1), TR(2), V(3)
// Row 1: L(4),  C(5), R(6),  H(7)
// Row 2: BL(8), B(9), BR(10), Iso(11) ? or similar
// MAPPING index is the bitmask (N=1, E=2, S=4, W=8)
export const WALL_ATLAS_MAPPING = [
    12, // 0: None -> Single/Iso
    13, // 1: N -> End (Frame 12)
    14, // 2: E -> End (Frame 13)
    15, // 3: N+E -> Corner Bottom Left (Frame 4)
    8,  // 4: S -> End (Frame 14)
    9,  // 5: N+S -> Vertical Rail (Frame 3)
    10, // 6: E+S -> Corner Top Left (Frame 0)
    11, // 7: N+E+S -> T-Junction Left (Frame 8)
    4,  // 8: W -> End (Frame 15)
    5,  // 9: N+W -> Corner Bottom Right (Frame 5)
    6,  // 10: E+W -> Horizontal Rail (Frame 2)
    7,  // 11: N+E+W -> T-Junction Bottom (Frame 9)
    0,  // 12: W+S -> Corner Top Right (Frame 1)
    1,  // 13: N+W+S -> T-Junction Right (Frame 10)
    2,  // 14: W+E+S -> T-Junction Top (Frame 11)
    6   // 15: All -> Cross/Center (Frame 6)
];

export const WALL_SOLID_COLOR = 0x444444;
