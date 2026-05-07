export type BreathingPattern = {
  id: string;
  name: string;
  description: string;
  // Each phase is [label, seconds]
  phases: [string, number][];
  benefit: string;
};

export const breathingPatterns: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal counts to steady the nervous system. Used by Navy SEALs.',
    phases: [
      ['Inhale', 4],
      ['Hold', 4],
      ['Exhale', 4],
      ['Hold', 4],
    ],
    benefit: 'Calms anxiety, sharpens focus',
  },
  {
    id: '478',
    name: '4-7-8',
    description: 'Slow exhale activates the parasympathetic system.',
    phases: [
      ['Inhale', 4],
      ['Hold', 7],
      ['Exhale', 8],
    ],
    benefit: 'Helps with sleep and panic',
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Five and a half seconds in, five and a half out.',
    phases: [
      ['Inhale', 5],
      ['Exhale', 5],
    ],
    benefit: 'Heart rate variability',
  },
  {
    id: 'sigh',
    name: 'Physiological Sigh',
    description: 'Two quick inhales, one long exhale. Fastest way to lower stress.',
    phases: [
      ['Inhale', 2],
      ['Inhale again', 1],
      ['Long exhale', 6],
    ],
    benefit: 'Quick stress relief',
  },
];

export type Meditation = {
  id: string;
  title: string;
  durationMin: number;
  category: 'mindfulness' | 'sleep' | 'focus' | 'anxiety';
  description: string;
};

export const meditations: Meditation[] = [
  { id: 'body-scan', title: 'Body Scan', durationMin: 10, category: 'mindfulness', description: 'Guide attention from head to toe.' },
  { id: 'open-aware', title: 'Open Awareness', durationMin: 8, category: 'mindfulness', description: 'Rest in spacious attention.' },
  { id: 'wind-down', title: 'Wind Down for Sleep', durationMin: 15, category: 'sleep', description: 'Release the day, enter rest.' },
  { id: 'rain-sounds', title: 'Rain on a Tin Roof', durationMin: 30, category: 'sleep', description: 'Ambient sound for sleep.' },
  { id: 'focus-flow', title: 'Focus Flow', durationMin: 12, category: 'focus', description: 'Settle into a single task.' },
  { id: 'panic-reset', title: 'Panic Reset', durationMin: 5, category: 'anxiety', description: 'Ground yourself when overwhelmed.' },
];

export type Therapist = {
  id: string;
  name: string;
  credentials: string;
  specialties: string[];
  modality: 'video' | 'in-person' | 'both';
  city: string;
  rate: string;
  online: boolean;
};

export const therapists: Therapist[] = [
  { id: 't1', name: 'Dr. Aanya Mehta', credentials: 'PhD, Clinical Psychology', specialties: ['Anxiety', 'CBT'], modality: 'video', city: 'Mumbai', rate: '₹2,200 / session', online: true },
  { id: 't2', name: 'Marcus Hale, LPC', credentials: 'Licensed Pro Counselor', specialties: ['Trauma', 'EMDR'], modality: 'both', city: 'Austin, TX', rate: '$110 / session', online: true },
  { id: 't3', name: 'Nadia Rahman', credentials: 'MA, Couples Therapy', specialties: ['Relationships', 'Gottman'], modality: 'video', city: 'Toronto', rate: '$140 / session', online: false },
  { id: 't4', name: 'Dr. Kenji Watanabe', credentials: 'MD, Psychiatry', specialties: ['Mood disorders', 'Medication'], modality: 'in-person', city: 'Tokyo', rate: '¥18,000 / visit', online: false },
  { id: 't5', name: 'Sofia Reyes, LCSW', credentials: 'Licensed Clinical SW', specialties: ['Grief', 'Latinx mental health'], modality: 'video', city: 'Madrid', rate: '€80 / session', online: true },
  { id: 't6', name: 'Dr. Priya Krishnan', credentials: 'PsyD, ACT-trained', specialties: ['ADHD', 'Burnout'], modality: 'video', city: 'Bengaluru', rate: '₹1,800 / session', online: true },
];

export type Place = {
  id: string;
  name: string;
  kind: 'clinic' | 'group' | 'crisis' | 'wellness';
  city: string;
  description: string;
  phone?: string;
  website?: string;
};

export const places: Place[] = [
  { id: 'p1', name: 'NIMHANS Centre for Well Being', kind: 'clinic', city: 'Bengaluru', description: 'Outpatient mental-health services and assessment.', phone: '+91 80 26995253', website: 'https://nimhans.ac.in' },
  { id: 'p2', name: 'Vandrevala Foundation', kind: 'crisis', city: 'India (Nationwide)', description: '24/7 free mental-health helpline.', phone: '1860 2662 345' },
  { id: 'p3', name: 'iCall', kind: 'crisis', city: 'India (TISS)', description: 'Email and phone counseling, Mon-Sat 8am-10pm.', phone: '+91 9152987821', website: 'https://icallhelpline.org' },
  { id: 'p4', name: 'Crisis Text Line', kind: 'crisis', city: 'US / UK / Canada / Ireland', description: 'Text HOME to 741741 for 24/7 free crisis support.', phone: '741741' },
  { id: 'p5', name: '988 Suicide & Crisis Lifeline', kind: 'crisis', city: 'United States', description: '24/7 confidential support. Call or text 988.', phone: '988' },
  { id: 'p6', name: 'Samaritans', kind: 'crisis', city: 'UK & Ireland', description: 'Free 24/7 emotional support.', phone: '116 123', website: 'https://samaritans.org' },
  { id: 'p7', name: 'Mind Cafe', kind: 'wellness', city: 'Singapore', description: 'Drop-in mental-wellness space and groups.', website: 'https://mind.sg' },
  { id: 'p8', name: 'NAMI Connection Recovery', kind: 'group', city: 'United States (Online groups)', description: 'Peer-led support groups for those living with mental illness.', website: 'https://nami.org' },
  { id: 'p9', name: 'Black Dog Institute Clinic', kind: 'clinic', city: 'Sydney', description: 'Specialist mood disorder clinic and online programs.', website: 'https://blackdoginstitute.org.au' },
  { id: 'p10', name: 'Befrienders Worldwide', kind: 'crisis', city: 'Global directory', description: 'Find a crisis line in your country.', website: 'https://befrienders.org' },
];

export type Hotline = {
  region: string;
  name: string;
  phone: string;
  text?: string;
};

export const crisisHotlines: Hotline[] = [
  { region: 'United States', name: '988 Suicide & Crisis Lifeline', phone: '988', text: 'Text 988' },
  { region: 'United States', name: 'Crisis Text Line', phone: '741741', text: 'Text HOME to 741741' },
  { region: 'India', name: 'Vandrevala Foundation', phone: '18602662345' },
  { region: 'India', name: 'iCall (TISS)', phone: '+919152987821' },
  { region: 'United Kingdom', name: 'Samaritans', phone: '116123' },
  { region: 'Canada', name: 'Talk Suicide Canada', phone: '18334564566' },
  { region: 'Australia', name: 'Lifeline', phone: '131114' },
  { region: 'Global', name: 'Befrienders Worldwide directory', phone: '', text: 'befrienders.org' },
];

export const groundingSteps = [
  { sense: 'See', prompt: 'Notice 5 things you can see. Look slow.' },
  { sense: 'Touch', prompt: 'Notice 4 things you can feel. Texture, temperature, pressure.' },
  { sense: 'Hear', prompt: 'Notice 3 things you can hear, distant or near.' },
  { sense: 'Smell', prompt: 'Notice 2 things you can smell. Or 2 favorite scents.' },
  { sense: 'Taste', prompt: 'Notice 1 thing you can taste. Or sip water slowly.' },
];

export type DailyPrompt = {
  feeling: string;
  reflection: string;
};

export const dailyPrompts: DailyPrompt[] = [
  { feeling: 'How are you arriving today?', reflection: 'One thing that already feels okay.' },
  { feeling: 'What is loud in your head right now?', reflection: 'What deserves more attention than it is getting?' },
  { feeling: 'Where in your body are you holding tension?', reflection: 'A moment of softness from today.' },
  { feeling: 'What is one feeling you can name right now?', reflection: 'A boundary you held this week.' },
  { feeling: 'What did you need today that you did not get?', reflection: 'Something small you are grateful for.' },
  { feeling: 'What is your energy like, 1-10?', reflection: 'A person who saw you this week.' },
  { feeling: 'What story are you telling yourself?', reflection: 'A kinder version of that story.' },
];

export const journalPrompts: string[] = [
  'What am I avoiding, and why?',
  'What have I been carrying that is not mine?',
  'When did I last feel proud of myself?',
  'What would the next right step look like?',
  'What am I afraid will happen if I rest?',
  'What does my body need right now?',
  'Who is one person I want to reach out to?',
  'What is something I let go of this week?',
  'What is the kindest thing I could say to myself today?',
  'If a friend were in my situation, what would I tell them?',
];

export const sleepSounds = [
  { id: 'rain', name: 'Rain on a tin roof', emoji: '🌧️' },
  { id: 'forest', name: 'Forest at dusk', emoji: '🌲' },
  { id: 'ocean', name: 'Ocean shoreline', emoji: '🌊' },
  { id: 'fire', name: 'Crackling fireplace', emoji: '🔥' },
  { id: 'fan', name: 'White noise / fan', emoji: '🌀' },
  { id: 'cafe', name: 'Soft cafe ambience', emoji: '☕' },
];

export const moodLabels = ['Awful', 'Low', 'Okay', 'Good', 'Great'];

export const assessments = [
  { id: 'phq2', title: 'Depression check (PHQ-2)', minutes: 1, description: 'Two questions to flag low mood.' },
  { id: 'gad2', title: 'Anxiety check (GAD-2)', minutes: 1, description: 'Two questions to flag worry.' },
  { id: 'sleep', title: 'Sleep quality scan', minutes: 2, description: 'How rested are you?' },
  { id: 'burnout', title: 'Burnout self-check', minutes: 3, description: 'Energy, cynicism, efficacy.' },
];
