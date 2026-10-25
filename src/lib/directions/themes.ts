export type ArtDirectionId = 'landscape' | 'instrument' | 'darkroom';

export interface DirectionTheme {
  id: ArtDirectionId;
  code: string;
  name: string;
  subtitle: string;
  headline: string;
  lead: string;
  ctaLabel: string;
  ground: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  mutedInk: string;
  accent: string;
  accentFg: string;
  displayFontClass: string;
  ideaSentence: string;
  plates: {
    src: string;
    alt: string;
    title: string;
    caption: string;
  }[];
}

export const DIRECTION_THEMES: Record<ArtDirectionId, DirectionTheme> = {
  landscape: {
    id: 'landscape',
    code: 'Direction A',
    name: 'Probability Landscape',
    subtitle: 'Waddington topographic relief map',
    headline: 'See where your decision leads.',
    lead: 'Your dilemma becomes a carved stone landscape. Likely futures cut deep valleys, and the recommended path flows down the lowest ground as a single cobalt river.',
    ctaLabel: 'Map this decision',
    ground: '#F1F0EC',
    surface: '#E4E2DC',
    surfaceAlt: '#D8D5CD',
    ink: '#141413',
    mutedInk: '#3D3B37',
    accent: '#1456C8',
    accentFg: '#FFFFFF',
    displayFontClass: 'font-serif',
    ideaSentence:
      'In Probability Landscape, the Bayesian tree becomes a sculpted Waddington watershed where valley depth encodes likelihood and the recommended path is the single cobalt river line.',
    plates: [
      {
        src: '/assets/landscape-watershed.png',
        alt: 'Topographical contour map showing five branching valleys from a central ridge with one cobalt river line',
        title: 'Watershed bifurcation',
        caption:
          'From the present pass at top center, five baseline futures carve distinct valleys. The 32% enterprise pivot cuts the widest trough.',
      },
      {
        src: '/assets/landscape-profile.png',
        alt: 'Cross-section elevation profile of five probability valleys showing depth proportional to likelihood',
        title: 'Valley cross-section',
        caption:
          'Probability is encoded once as valley depth. Water naturally collects in the deepest channel unless a contrarian force reshapes the slope.',
      },
      {
        src: '/assets/landscape-canyon.png',
        alt: 'Second-order topographical contours showing a valley splitting into five deeper canyons',
        title: 'Stepping into a future',
        caption:
          'Selecting any valley and projecting forward carves five second-order canyons downslope while conserving cumulative path mass.',
      },
      {
        src: '/assets/landscape-basin.png',
        alt: 'Hydrological contour basin showing contrarian and tail-risk side channels',
        title: 'Unexplored side channels',
        caption:
          'Twenty percent of probability mass stays held in reserve so expanding +5 more futures carves contrarian and tail-risk side valleys.',
      },
    ],
  },
  instrument: {
    id: 'instrument',
    code: 'Direction B',
    name: 'The Instrument',
    subtitle: 'Machined horological movement',
    headline: 'Every choice turns the next.',
    lead: 'Your decision is assembled as a physical watch calibre on a brushed silver dial. Futures are interlocking gear wheels scaled by likelihood, and the recommended path is the ruby-jewelled train.',
    ctaLabel: 'Set the movement',
    ground: '#F4F4F2',
    surface: '#E6E6E0',
    surfaceAlt: '#DCDCD4',
    ink: '#111317',
    mutedInk: '#3B3E45',
    accent: '#B81D33',
    accentFg: '#FFFFFF',
    displayFontClass: 'font-sans font-bold',
    ideaSentence:
      'In The Instrument, the decision tree becomes a machined horological movement where gear diameter encodes branch likelihood and the recommended path is the ruby-jewelled gear train.',
    plates: [
      {
        src: '/assets/instrument-train.png',
        alt: 'Horological gear train schematic showing interlocking toothed wheels with one ruby-jewelled wheel',
        title: 'The decision gear train',
        caption:
          'Each future branch is a machined wheel whose diameter and tooth count match its conditional probability.',
      },
      {
        src: '/assets/instrument-escapement.png',
        alt: 'Central mainspring barrel wheel meshing with two secondary complication gears',
        title: 'Mainspring to escapement',
        caption:
          'The present dilemma acts as the central barrel. Torque transfers along the ruby-jewelled bridge to the highest-utility trajectory.',
      },
      {
        src: '/assets/instrument-coaxial.png',
        alt: 'Coaxial horological wheels stacked across depth rings on a gridded silver dial plate',
        title: 'Coaxial depth strata',
        caption:
          'Stepping deeper into a future engages a coaxial wheel plane underneath, preserving the exact mechanical ratio of prior choices.',
      },
      {
        src: '/assets/instrument-caliber.png',
        alt: 'Four-wheel horological complication train showing contrarian satellite gears',
        title: 'Complication expansion',
        caption:
          'Expanding +5 more futures engages the outer contrarian and tail-risk satellite wheels from the 20% reserve barrel.',
      },
    ],
  },
  darkroom: {
    id: 'darkroom',
    code: 'Direction C',
    name: 'The Dark Room',
    subtitle: 'Physically lit architectural gallery',
    headline: 'Five futures in plain light.',
    lead: 'One deep gallery room from top to bottom. Your futures stand as monolithic stone and bronze steles scaled by likelihood, with real overhead spotlights illuminating the recommended path.',
    ctaLabel: 'Light this decision',
    ground: '#0E1013',
    surface: '#171B21',
    surfaceAlt: '#21262E',
    ink: '#F1F0EC',
    mutedInk: '#B8B5AC',
    accent: '#E0A838',
    accentFg: '#111317',
    displayFontClass: 'font-serif',
    ideaSentence:
      'In The Dark Room, the branching futures become architectural steles on a basalt gallery floor where height encodes likelihood and a single tungsten spotlight illuminates the recommended path.',
    plates: [
      {
        src: '/assets/darkroom-exhibit-1.png',
        alt: 'Five architectural steles in a dark room with a warm tungsten spotlight illuminating the tallest bronze stele',
        title: 'Key light on the lead path',
        caption:
          'Instead of glowing neon spheres, five physical steles stand on a matte basalt floor. One overhead tungsten beam lights the recommended path.',
      },
      {
        src: '/assets/darkroom-exhibit-2.png',
        alt: 'Three architectural monoliths casting directional shade across a dark gallery floor',
        title: 'Mass and chiaroscuro',
        caption:
          'Stele height and footprint encode branch probability directly, while unchosen counterfactuals recede into gallery half-light.',
      },
      {
        src: '/assets/darkroom-exhibit-3.png',
        alt: 'Five steles arranged in depth perspective with the central bronze monolith under a spotlight cone',
        title: 'Gallery depth perspective',
        caption:
          'Projecting the next five futures places a new row of steles deeper in the room and pans the overhead beam forward.',
      },
      {
        src: '/assets/darkroom-exhibit-4.png',
        alt: 'Close study of bronze and slate steles under directional key light',
        title: 'Real materials, zero glow',
        caption:
          'Satin bronze, matte slate, and directional chiaroscuro replace decorative glass cards and sci-fi HUD chrome.',
      },
    ],
  },
};
