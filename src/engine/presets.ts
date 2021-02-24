import type { Preset } from "./types"

const presets: Array<Preset> = [
  {
    id: '11',
    name: 'Jazz 2 beat changes',
    string: '[A] C ; ; D7; ; C C/B;Am7 E/G#;C/G Fmaj7;Dm7 G7alt [N1] C9 F#dim7; C9 . Ab7 G7 [A] [N1]',
    tempo: 160,
    swing: true,
    style: 'jazz',
  },
  {
    id: '1',
    name: 'Basic I-vi-ii7-V',
    string: '[A] C;Am;Dm7;G',
    tempo: 130,
    swing: true
  },
  {
    id: '2',
    name: '12 Bar Blues',
    string: '[A] A;A;A;A7;D;D7;A;A7;E7;D7;A;E7',
    tempo: 150,
    style: 'jazz',
    swing: true
  },
  {
    id: '3',
    name: 'Octavario',
    string:
      '[A] Fm;C#m;Fm;Abm;Eb/Bb;Abm6/Bb;Eb/Bb;Abm6;Eb/G;Abm6;Cm/G;D/F#;Bdim;A/E C#m;D;A/E C#m;C;Em;Bb/F Dm;Db;Bb/F;Db;E;G',
    tempo: 84
  },
  {
    id: '5',
    name: 'Chromatic',
    string: '[A] Em9;Ebmaj9;C/D;Dbmaj7#11',
    tempo: 160
  },
  {
    id: 'african',
    name: 'African',
    string: '[A] B D#m;G#m G#m/F#;A/E E/F#; !2/4 G#m ; !4/4 A . . C#m',
    tempo: 98
  },
  {
    id: '7',
    name: 'Getting lucky',
    string: '[A] Am7;Cadd9;Em7;D',
    tempo: 115
  }
]

export default presets