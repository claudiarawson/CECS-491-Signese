// src/data/lessonGroups.ts
// Defines groups for Numbers and Alphabet lessons for lesson flow logic

export type LessonSign = {
  label: string;
  gifUrl: string;
};

export type LessonGroup = {
  id: string;
  title: string;
  signs: LessonSign[];
};

export const NUMBER_GROUPS: LessonGroup[] = [
  {
    id: 'numbers-1-5',
    title: 'Numbers 1–5',
    signs: [
      { label: '1', gifUrl: require('../assets/asl/numbers/number01.gif') },
      { label: '2', gifUrl: require('../assets/asl/numbers/number02.jpg') },
      { label: '3', gifUrl: require('../assets/asl/numbers/number03.jpg') },
      { label: '4', gifUrl: require('../assets/asl/numbers/number04.jpg') },
      { label: '5', gifUrl: require('../assets/asl/numbers/number05.jpg') },
    ]
  },
  {
    id: 'numbers-6-10',
    title: 'Numbers 6–10',
    signs: [
      { label: '6', gifUrl: require('../assets/asl/numbers/number06.jpg') },
      { label: '7', gifUrl: require('../assets/asl/numbers/number07.jpg') },
      { label: '8', gifUrl: require('../assets/asl/numbers/number08.jpg') },
      { label: '9', gifUrl: require('../assets/asl/numbers/number09.jpg') },
      { label: '10', gifUrl: require('../assets/asl/numbers/number10.gif') },
    ]
  }
];

export const ALPHABET_GROUPS: LessonGroup[] = [
  {
    id: 'alphabet-a-d',
    title: 'A–D',
    signs: [
      { label: 'A', gifUrl: require('../assets/asl/alphabet/A.jpg') },
      { label: 'B', gifUrl: require('../assets/asl/alphabet/B.png') },
      { label: 'C', gifUrl: require('../assets/asl/alphabet/C.png') },
      { label: 'D', gifUrl: require('../assets/asl/alphabet/D.jpg') },
    ],
  },
  {
    id: 'alphabet-e-h',
    title: 'E–H',
    signs: [
      { label: 'E', gifUrl: require('../assets/asl/alphabet/E.png') },
      { label: 'F', gifUrl: require('../assets/asl/alphabet/F.jpg') },
      { label: 'G', gifUrl: require('../assets/asl/alphabet/G.png') },
      { label: 'H', gifUrl: require('../assets/asl/alphabet/H.png') },
    ],
  },
  {
    id: 'alphabet-i-m',
    title: 'I–M',
    signs: [
      { label: 'I', gifUrl: require('../assets/asl/alphabet/I.jpg') },
      { label: 'J', gifUrl: require('../assets/asl/alphabet/J.gif') },
      { label: 'K', gifUrl: require('../assets/asl/alphabet/K.png') },
      { label: 'L', gifUrl: require('../assets/asl/alphabet/L.png') },
      { label: 'M', gifUrl: require('../assets/asl/alphabet/M.png') },
    ],
  },
  {
    id: 'alphabet-n-r',
    title: 'N–R',
    signs: [
      { label: 'N', gifUrl: require('../assets/asl/alphabet/N.png') },
      { label: 'O', gifUrl: require('../assets/asl/alphabet/O.jpg') },
      { label: 'P', gifUrl: require('../assets/asl/alphabet/P.png') },
      { label: 'Q', gifUrl: require('../assets/asl/alphabet/Q.png') },
      { label: 'R', gifUrl: require('../assets/asl/alphabet/R.png') },
    ],
  },
  {
    id: 'alphabet-s-v',
    title: 'S–V',
    signs: [
      { label: 'S', gifUrl: require('../assets/asl/alphabet/S.png') },
      { label: 'T', gifUrl: require('../assets/asl/alphabet/T.png') },
      { label: 'U', gifUrl: require('../assets/asl/alphabet/U.png') },
      { label: 'V', gifUrl: require('../assets/asl/alphabet/V.jpg') },
    ],
  },
  {
    id: 'alphabet-w-z',
    title: 'W–Z',
    signs: [
      { label: 'W', gifUrl: require('../assets/asl/alphabet/W.png') },
      { label: 'X', gifUrl: require('../assets/asl/alphabet/X.png') },
      { label: 'Y', gifUrl: require('../assets/asl/alphabet/Y.png') },
      { label: 'Z', gifUrl: require('../assets/asl/alphabet/Z.gif') },
    ],
  },
];
