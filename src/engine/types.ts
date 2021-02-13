export type NoteName = string

export type ChordQuality = 'm' | 'maj' | null | 'dim' | 'aug' | 'sus' | 'alt'

export type Accidental = '#' | 'b' | null

export type Modifier = Accidental

export type NoteRole =
  | 'root'
  | 'third'
  | 'fifth'
  | 'seventh'
  | 'ninth'
  | 'eleventh'
  | 'interval'

export type Note = {
  accidental: Accidental
  midiNote: number
  note: NoteName
  octave: number
  role: NoteRole
  vexNote: string
}

export type Chord = {
  name: string
  guitar: string
  interval: number
  notes: Array<Note>
  quality: ChordQuality
  root: NoteName
  rootModifier: Modifier
  bass: NoteName
  bassNote: Note
}

export type ChordLane = Array<Chord | undefined>
