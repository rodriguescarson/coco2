// Article content for the Articles (blog) section. Each article carries its full
// body plus a list of Sources so the health/wellness information is properly
// cited (App Store Guideline 1.4.1 — medical apps must cite their information).
//
// Bodies are written as plain paragraphs. Keep claims modest, educational, and
// non-diagnostic; anything clinical points back to a cited source.

export type ArticleSource = {
  label: string;
  url: string;
};

export type Article = {
  id: string;
  title: string;
  topic: string;
  read: string;
  summary: string;
  /** Full article, one string per paragraph. */
  body: string[];
  sources: ArticleSource[];
};

export const articles: Article[] = [
  {
    id: 'a1',
    title: 'Why does anxiety lie to you?',
    topic: 'Anxiety',
    read: '4 min',
    summary: 'A primer on cognitive distortions and the simple practice of naming them out loud.',
    body: [
      'Anxiety is good at sounding certain. It tells you the worst outcome is the most likely one, that one mistake defines you, that everyone noticed. These are not facts — they are patterns of thinking that researchers in cognitive behavioural therapy (CBT) call "cognitive distortions."',
      'A few of the common ones: catastrophising (jumping to the worst case), mind-reading (assuming you know what others think), and all-or-nothing thinking (treating anything short of perfect as failure). Once you can name the pattern, it loses some of its grip.',
      'The practice is small and repeatable. When a thought spikes, write it down word for word. Then ask: which distortion is this? Is there a more balanced way to say the same thing? You are not forcing positivity — you are checking the claim against the evidence, the way you would for a friend.',
      'This is one of the most studied skills in modern talk therapy, and you can rehearse it on your own between sessions. It is a skill, not a personality trait, which means it gets easier with practice.',
      'Coco is an educational companion, not a therapist. If anxiety is interfering with your daily life, a licensed clinician can help you build these skills with support.',
    ],
    sources: [
      { label: 'American Psychological Association — What Is Cognitive Behavioral Therapy?', url: 'https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral' },
      { label: 'NHS — Cognitive behavioural therapy (CBT)', url: 'https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/overview/' },
      { label: 'Beck Institute for Cognitive Behavior Therapy', url: 'https://beckinstitute.org/about/intro-to-cbt/' },
    ],
  },
  {
    id: 'a2',
    title: 'The physiological sigh, in 60 seconds',
    topic: 'Breathing',
    read: '2 min',
    summary: 'A double-inhale, long-exhale pattern studied at Stanford for lowering stress.',
    body: [
      'The physiological sigh is a breathing pattern your body already does on its own — usually when you cry, or just before you fall asleep. It is two inhales through the nose (a full one, then a short second sip) followed by a long, slow exhale through the mouth.',
      'A 2023 randomised study from Stanford Medicine compared brief daily breathing practices with mindfulness meditation. The cyclic-sighing group — emphasising extended exhales — reported the largest improvement in mood and the biggest drop in breathing rate over the month.',
      'The mechanism is straightforward: a longer exhale nudges the parasympathetic ("rest and digest") branch of your nervous system, which can slow heart rate. The second inhale helps reinflate small air sacs in the lungs.',
      'To try it now: inhale fully through your nose, take one more short sip of air on top, then let a long exhale out through your mouth. One to three rounds is often enough to take the edge off.',
      'This is a self-regulation tool, not a treatment for any medical condition. If you feel light-headed, return to normal breathing.',
    ],
    sources: [
      { label: 'Balban et al. (2023), Cell Reports Medicine — Brief structured respiration practices enhance mood and reduce physiological arousal', url: 'https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(22)00474-8' },
      { label: 'Stanford Medicine News — Controlled breathing exercise study', url: 'https://med.stanford.edu/news/all-news/2023/01/cyclic-sighing-breathing-stress.html' },
    ],
  },
  {
    id: 'a3',
    title: 'Sleep hygiene without the lectures',
    topic: 'Sleep',
    read: '5 min',
    summary: 'Three things that actually move the needle on sleep, ranked by effort.',
    body: [
      'Most sleep advice is a long list nobody follows. Here are three changes public-health guidance consistently rates as high-impact, ordered from easiest to hardest.',
      'One: keep a consistent wake-up time, even on weekends. Your body clock anchors to when you get up and see light, more than to when you go to bed. A steady wake time gradually pulls your sleep onset earlier too.',
      'Two: get bright light early and dim light late. Morning daylight strengthens your circadian rhythm; bright screens and overhead light at night push it the wrong way. Lowering lights in the last hour before bed is a small, free lever.',
      'Three: protect the wind-down. Caffeine has a long tail (roughly half of it can still be in your system six hours later), and a hot, bright, busy bedroom makes sleep harder. Cool, dark, and boring is the goal.',
      'If you regularly struggle to fall or stay asleep despite these, that is worth raising with a doctor — persistent insomnia is treatable, and conditions like sleep apnea need proper assessment.',
    ],
    sources: [
      { label: 'CDC — About Sleep / Tips for Better Sleep', url: 'https://www.cdc.gov/sleep/about/index.html' },
      { label: 'American Academy of Sleep Medicine — Healthy Sleep Habits', url: 'https://sleepeducation.org/healthy-sleep/healthy-sleep-habits/' },
      { label: 'NHS — How to get to sleep', url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/how-to-get-to-sleep/' },
    ],
  },
  {
    id: 'a4',
    title: 'Talking to a friend in crisis',
    topic: 'Crisis',
    read: '6 min',
    summary: 'What to say, what to skip, and when to take it seriously.',
    body: [
      'If you are worried someone you care about might be thinking about suicide, the most helpful thing you can do is ask directly and calmly. Research and crisis-line guidance are clear that asking about suicide does not plant the idea — it more often brings relief that someone noticed.',
      'A simple framework from suicide-prevention training: ask the question plainly ("Are you thinking about suicide?"), keep them company rather than rushing to fix it, listen without judgement, and help them connect to support — a trusted person or a crisis line.',
      'What to skip: arguing about whether their feelings are valid, promising secrecy, or leaving someone alone if they are in immediate danger. You do not have to have the perfect words. Staying, listening, and helping them take the next step matters more.',
      'If there is immediate danger, contact local emergency services. In the US you can call or text 988 (Suicide & Crisis Lifeline). In the UK, Samaritans is 116 123. Many other countries have free lines — Coco\'s SOS screen lists several, or see Befrienders Worldwide.',
      'You are allowed to look after yourself too. Supporting someone in crisis is heavy; lean on your own support and the same hotlines if you need to.',
    ],
    sources: [
      { label: '988 Suicide & Crisis Lifeline (US)', url: 'https://988lifeline.org/' },
      { label: '#BeThe1To — 5 action steps for helping someone in emotional pain', url: 'https://www.bethe1to.com/bethe1to-steps-evidence/' },
      { label: 'WHO — Preventing suicide: a resource for the public', url: 'https://www.who.int/publications/i/item/9789240026629' },
      { label: 'Befrienders Worldwide — find a crisis line', url: 'https://befrienders.org/' },
    ],
  },
  {
    id: 'a5',
    title: 'Journaling without "Dear diary"',
    topic: 'Journaling',
    read: '3 min',
    summary: 'Prompts that make journaling work even if you have always hated it.',
    body: [
      'You do not need to keep a diary to get something from writing. The most-studied version is "expressive writing": short, private sessions where you write continuously about a difficult experience and how you feel about it.',
      'In the original studies by social psychologist James Pennebaker, people who wrote about an emotional topic for around 15 minutes on a few consecutive days showed measurable benefits to mood and even physical-health markers over the following months, compared with people who wrote about neutral topics.',
      'It works better as a prompt than a blank page. Try: "What am I avoiding, and why?" or "What have I been carrying that isn\'t mine?" Set a short timer, write without editing, and let it be messy. Spelling does not matter.',
      'A few cautions from the research: writing about trauma can briefly stir things up before it settles, so go at your own pace and stop if it feels overwhelming. It is a reflective practice, not a replacement for therapy when you need it.',
    ],
    sources: [
      { label: 'Pennebaker & Beall (1986), Journal of Abnormal Psychology — Confronting a traumatic event', url: 'https://psycnet.apa.org/record/1987-01100-001' },
      { label: 'University of Rochester Medical Center — Journaling for Mental Health', url: 'https://www.urmc.rochester.edu/encyclopedia/content.aspx?ContentID=4552&ContentTypeID=1' },
      { label: 'APA Monitor — Writing to heal', url: 'https://www.apa.org/monitor/jun02/writing' },
    ],
  },
];

export function getArticle(id: string | undefined): Article | undefined {
  return articles.find((a) => a.id === id);
}
