/**
 * Translations for the parts of the site a non-English reader needs first:
 * navigation, the hero, section headings, the FAQ and the footer.
 *
 * Project descriptions, job titles and the certificate catalogue stay in
 * English on purpose. They are proper nouns and industry terms that recruiters
 * — including Japanese ones — expect to read untranslated, and a machine pass
 * over "AWS FSx migration" produces something worse than leaving it alone.
 *
 * Adding a language is one entry in `LANGUAGES` plus one block below. Any key
 * left out falls back to English rather than rendering blank.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'ja', label: 'Japanese', native: '日本語', dir: 'ltr' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली', dir: 'ltr' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

type Dictionary = {
  nav: Record<string, string>;
  hero: {
    availability: string;
    role: string;
    summary: string;
    getInTouch: string;
    viewExperience: string;
    hireMe: string;
  };
  sections: Record<string, { eyebrow: string; title: string; lead?: string }>;
  faq: { q: string; a: string }[];
  footer: { sections: string; credentials: string; tools: string; rights: string };
  ui: { language: string; skipToContent: string };
};

const en: Dictionary = {
  nav: {
    home: 'Home', about: 'About', skills: 'Skills', experience: 'Experience',
    projects: 'Projects', 'video-editing': 'Video', japan: 'Japan',
    certificates: 'Certificates', faq: 'FAQ', contact: 'Contact',
  },
  hero: {
    availability: 'Available for cloud & infrastructure roles in Japan',
    role: 'Cloud Infrastructure / AWS / Cloud DX Engineer',
    summary:
      'Previously full-stack and frontend focused. Now working deeper on cloud infrastructure, AWS operations, migration workflows, and automation, while continuing to build software end-to-end.',
    getInTouch: 'Get in touch',
    viewExperience: 'View experience',
    hireMe: 'Hire me',
  },
  sections: {
    about: { eyebrow: 'About', title: 'Infrastructure-first, with a full-stack foundation' },
    skills: { eyebrow: 'Skills', title: 'What I work with' },
    experience: { eyebrow: 'Experience', title: "Where I've worked" },
    projects: { eyebrow: 'Projects', title: 'Selected work' },
    certificates: { eyebrow: 'Certificates', title: 'Verified training & credentials' },
    faq: { eyebrow: 'FAQ', title: 'Who is Prabin Parajuli?' },
    contact: { eyebrow: 'Contact', title: "Let's talk" },
  },
  faq: [],
  footer: { sections: 'Sections', credentials: 'Credentials', tools: 'Tools', rights: 'All rights reserved.' },
  ui: { language: 'Language', skipToContent: 'Skip to content' },
};

const ja: Dictionary = {
  nav: {
    home: 'ホーム', about: '自己紹介', skills: 'スキル', experience: '職務経歴',
    projects: '制作実績', 'video-editing': '動画', japan: '日本での就労',
    certificates: '資格・修了証', faq: 'よくある質問', contact: 'お問い合わせ',
  },
  hero: {
    availability: '日本国内のクラウド／インフラ職を検討中',
    role: 'クラウドインフラ / AWS / クラウドDX エンジニア',
    summary:
      '以前はフルスタック・フロントエンド中心に開発していました。現在はクラウドインフラ、AWS運用、移行作業、自動化に軸足を移しつつ、ソフトウェア開発も一貫して続けています。',
    getInTouch: 'お問い合わせ',
    viewExperience: '職務経歴を見る',
    hireMe: '採用のご相談',
  },
  sections: {
    about: { eyebrow: '自己紹介', title: 'インフラを軸に、フルスタックの土台を持つエンジニア' },
    skills: { eyebrow: 'スキル', title: '使用技術' },
    experience: { eyebrow: '職務経歴', title: 'これまでの職務' },
    projects: { eyebrow: '制作実績', title: '主なプロジェクト' },
    certificates: { eyebrow: '資格・修了証', title: '取得済みの資格と研修' },
    faq: { eyebrow: 'よくある質問', title: 'プラビン・パラジュリとは' },
    contact: { eyebrow: 'お問い合わせ', title: 'ご連絡ください' },
  },
  faq: [
    {
      q: 'プラビン・パラジュリとはどのような人物ですか？',
      a: '千葉県市川市（東京圏）在住のクラウドインフラ／AWS／クラウドDXエンジニアです。ネパール出身で、WITS Corp（Wistron）にてAWS運用、IAM・セキュリティ、監視、ファイルサーバー移行を担当しています。ロンドン・メトロポリタン大学でコンピューティングの学士号を取得しました。',
    },
    {
      q: '現在の勤務地はどこですか？',
      a: '千葉県市川市に居住し、東京圏で勤務しています。日本での就労資格を保有しており、国内のクラウドインフラ・AWS関連職を検討しています。',
    },
    {
      q: 'どのような業務を担当していますか？',
      a: 'AWS上のクラウドインフラの運用改善が中心です。日々の運用、IAM・セキュリティ、監視とオブザーバビリティ、デプロイの信頼性向上、AWS FSxやRobocopyを用いたファイルサーバー移行などを担当しています。React、Next.js、TypeScript、Node.jsによる開発も行います。',
    },
    {
      q: 'これまでに何を開発しましたか？',
      a: 'ブラウザ上で動作する28種類のツールを備えたDO101（do101.online）、および本ポートフォリオ pprabin.com.np を開発しました。後者では間隔反復方式の日本語単語アプリと、Geminiを用いた音声文字起こしツールも稼働しています。',
    },
    {
      q: 'どのような資格を持っていますか？',
      a: 'AWS Academy Graduate（Cloud Foundations）を取得しています。加えて、クラウド、ネットワーク、Linux、プログラミング基礎、生成AIなど50以上の講座を修了しており、すべての修了証をポートフォリオ上で確認できます。',
    },
    {
      q: '対応可能な言語は？',
      a: '英語、ネパール語、日本語です。日常的に日本語環境のIT現場で業務を行っており、JLPT N2を学習中です。',
    },
    {
      q: '現在採用に応募していますか？',
      a: 'はい。日本国内のクラウドインフラ、AWS、クラウドDX関連職、およびクラウド運用とソフトウェア開発を兼ねる職種を検討しています。連絡先は prabin.parajuli.jp@gmail.com です。',
    },
  ],
  footer: { sections: 'セクション', credentials: '実績・資格', tools: 'ツール', rights: 'All rights reserved.' },
  ui: { language: '言語', skipToContent: '本文へスキップ' },
};

const ne: Dictionary = {
  nav: {
    home: 'गृहपृष्ठ', about: 'परिचय', skills: 'सीप', experience: 'अनुभव',
    projects: 'परियोजना', 'video-editing': 'भिडियो', japan: 'जापान',
    certificates: 'प्रमाणपत्र', faq: 'प्रश्नोत्तर', contact: 'सम्पर्क',
  },
  hero: {
    availability: 'जापानमा क्लाउड र इन्फ्रास्ट्रक्चर भूमिकाका लागि उपलब्ध',
    role: 'क्लाउड इन्फ्रास्ट्रक्चर / AWS / क्लाउड DX इन्जिनियर',
    summary:
      'पहिले फुल-स्ट्याक र फ्रन्टएन्डमा केन्द्रित थिएँ। अहिले क्लाउड इन्फ्रास्ट्रक्चर, AWS सञ्चालन, माइग्रेसन र स्वचालनमा गहिरो काम गर्दै छु, साथै सफ्टवेयर निर्माण पनि जारी छ।',
    getInTouch: 'सम्पर्क गर्नुहोस्',
    viewExperience: 'अनुभव हेर्नुहोस्',
    hireMe: 'काममा लिनुहोस्',
  },
  sections: {
    about: { eyebrow: 'परिचय', title: 'इन्फ्रास्ट्रक्चर प्राथमिकता, फुल-स्ट्याक जगसहित' },
    skills: { eyebrow: 'सीप', title: 'मैले प्रयोग गर्ने प्रविधि' },
    experience: { eyebrow: 'अनुभव', title: 'मैले काम गरेका ठाउँहरू' },
    projects: { eyebrow: 'परियोजना', title: 'छानिएका कामहरू' },
    certificates: { eyebrow: 'प्रमाणपत्र', title: 'प्रमाणित तालिम र योग्यता' },
    faq: { eyebrow: 'प्रश्नोत्तर', title: 'प्रबिन पराजुली को हुन्?' },
    contact: { eyebrow: 'सम्पर्क', title: 'कुरा गरौं' },
  },
  faq: [
    {
      q: 'प्रबिन पराजुली को हुन्?',
      a: 'प्रबिन पराजुली जापानको इचिकावा, चिबा (टोकियो क्षेत्र) मा बस्ने क्लाउड इन्फ्रास्ट्रक्चर / AWS / क्लाउड DX इन्जिनियर हुन्। उनी WITS Corp (Wistron) मा AWS सञ्चालन, IAM र सुरक्षा, अनुगमन तथा फाइल-सर्भर माइग्रेसनमा काम गर्छन्, र लन्डन मेट्रोपोलिटन विश्वविद्यालयबाट कम्प्युटिङमा स्नातक हुन्।',
    },
    {
      q: 'उनी कहाँ बस्छन्?',
      a: 'उनी जापानको चिबा प्रान्तअन्तर्गत इचिकावामा बस्छन्, जुन ठूलो टोकियो क्षेत्रभित्र पर्छ। उनीसँग जापानमा काम गर्ने अनुमति छ।',
    },
    {
      q: 'उनी के काम गर्छन्?',
      a: 'AWS मा क्लाउड इन्फ्रास्ट्रक्चर सञ्चालन र सुधार गर्छन् — दैनिक अपरेसन, IAM र सुरक्षा, अनुगमन, डिप्लोयमेन्ट विश्वसनीयता, र AWS FSx तथा Robocopy मार्फत फाइल-सर्भर माइग्रेसन। साथै React, Next.js, TypeScript र Node.js मा सफ्टवेयर पनि बनाउँछन्।',
    },
    {
      q: 'उनले के-के बनाएका छन्?',
      a: 'DO101 (do101.online) — ब्राउजरमै चल्ने २८ वटा उपकरणको प्लेटफर्म, र यो पोर्टफोलियो pprabin.com.np, जसमा जापानी शब्द सिक्ने फ्ल्यासकार्ड एप र Gemini प्रयोग गर्ने भ्वाइस ट्रान्सक्राइबर पनि चल्छन्।',
    },
    {
      q: 'उनीसँग कस्ता प्रमाणपत्र छन्?',
      a: 'AWS Academy Graduate — Cloud Foundations, र क्लाउड, नेटवर्किङ, लिनक्स, प्रोग्रामिङ आधार तथा जेनेरेटिभ AI समेटिएका ५० भन्दा बढी पाठ्यक्रम पूरा गरेका छन्। सबै प्रमाणपत्र यही पोर्टफोलियोमा हेर्न सकिन्छ।',
    },
    {
      q: 'उनी कुन भाषा बोल्छन्?',
      a: 'अंग्रेजी, नेपाली र जापानी। उनी दैनिक रूपमा जापानी भाषाको IT वातावरणमा काम गर्छन् र JLPT N2 को तयारी गर्दै छन्।',
    },
    {
      q: 'के उनी जागिरका लागि उपलब्ध छन्?',
      a: 'छन्। जापानमा क्लाउड इन्फ्रास्ट्रक्चर, AWS र क्लाउड DX भूमिकाहरू, तथा क्लाउड सञ्चालन र सफ्टवेयर विकास मिश्रित पदहरूका लागि खुला छन्। सम्पर्क: prabin.parajuli.jp@gmail.com',
    },
  ],
  footer: { sections: 'खण्डहरू', credentials: 'योग्यता', tools: 'उपकरण', rights: 'सर्वाधिकार सुरक्षित।' },
  ui: { language: 'भाषा', skipToContent: 'मुख्य सामग्रीमा जानुहोस्' },
};

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, ja, ne };

/** English is the fallback for anything a translation has not covered. */
export function dictionary(code: LanguageCode): Dictionary {
  const chosen = DICTIONARIES[code] ?? en;
  return {
    ...en,
    ...chosen,
    nav: { ...en.nav, ...chosen.nav },
    hero: { ...en.hero, ...chosen.hero },
    sections: { ...en.sections, ...chosen.sections },
    footer: { ...en.footer, ...chosen.footer },
    ui: { ...en.ui, ...chosen.ui },
  };
}
