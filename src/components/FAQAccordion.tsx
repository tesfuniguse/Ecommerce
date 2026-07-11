import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Truck, RotateCcw, Wallet } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'shipping' | 'returns' | 'et_switch';
  questionEn: string;
  questionAm: string;
  answerEn: string;
  answerAm: string;
}

interface FAQAccordionProps {
  lang: 'en' | 'am';
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'ship-1',
    category: 'shipping',
    questionEn: 'How long does shipping take within Ethiopia?',
    questionAm: 'በኢትዮጵያ ውስጥ ማድረሻ ምን ያህል ጊዜ ይወስዳል?',
    answerEn: 'For deliveries within Addis Ababa, we offer same-day or next-day express delivery. For regional cities (such as Hawassa, Adama, Bahir Dar, and Dire Dawa), delivery typically takes 2 to 3 business days via national postal or local courier partners.',
    answerAm: 'በአዲስ አበባ ውስጥ ለሚደረጉ ትዕዛዞች በዕለቱ ወይም በነገታው ፈጣን ማድረሻ እናቀርባለን። ለክልል ከተሞች (እንደ ሐዋሳ፣ አዳማ፣ ባሕር ዳር እና ድሬዳዋ) ማድረስ በአገር አቀፍ ፖስታ ወይም በአካባቢው መልዕክተኞች በኩል ከ2 እስከ 3 የሥራ ቀናት ይወስዳል።',
  },
  {
    id: 'ship-2',
    category: 'shipping',
    questionEn: 'Do you offer international shipping for handcrafted leather products?',
    questionAm: 'በእጅ ለተሠሩ የቆዳ ውጤቶች ዓለም አቀፍ ማድረሻ አገልግሎት ታቀርባላችሁ?',
    answerEn: 'Yes, we ship globally via trusted courier services like DHL Express. International delivery takes approximately 5 to 9 business days depending on customs processing in the destination country. Customs duties are determined by the destination country\'s laws.',
    answerAm: 'አዎ፣ እንደ DHL Express ባሉ የታመኑ ዓለም አቀፍ ፈጣን መልዕክተኞች አማካኝነት በዓለም ዙሪያ እንልካለን። እንደ መድረሻው አገር የጉምሩክ ሂደት ሁኔታ ዓለም አቀፍ ማድረሻ በግምት ከ5 እስከ 9 የሥራ ቀናት ይወስዳል።',
  },
  {
    id: 'ret-1',
    category: 'returns',
    questionEn: 'What is your return and exchange policy?',
    questionAm: 'የዕቃ መመለስ እና መለወጥ ፖሊሲያችሁ ምንድን ነው?',
    answerEn: 'We accept returns and exchanges on non-custom items within 14 days of receipt, provided the handcrafted leather goods are in pristine, unused condition with original packaging. Please contact our support desk to initiate a return or exchange.',
    answerAm: 'እጅ ሥራዎቹ ምንም ዓይነት ጉዳት ሳይደርስባቸው፣ ጥቅም ላይ ሳይውሉ እና በኦሪጅናል ማሸጊያቸው ካሉ ከተረከቡበት ቀን ጀምሮ ባሉት 14 ቀናት ውስጥ ለየት ባሉ ትዕዛዞች ካልሆነ በስተቀር መመለስ ወይም መለወጥ እንቀበላለን። ዕቃዎችን ለመመለስ ወይም ለመለወጥ እባክዎ የድጋፍ ሰጪያችንን ያነጋግሩ።',
  },
  {
    id: 'ret-2',
    category: 'returns',
    questionEn: 'Can I request adjustments for bespoke custom-sized jackets or shoes?',
    questionAm: 'በትዕዛዝ ለተሰፉ ጃኬቶች ወይም ጫማዎች ማስተካከያ መጠየቅ እችላለሁ?',
    answerEn: 'Absolutely. We offer a complementary premium sizing refinement service for bespoke footwear and apparel. If your leather jacket or shoe requires a minor custom adjustment to fit perfectly, our local master artisans will refine it free of charge within 7 days of request.',
    answerAm: 'በፍጹም። በትዕዛዝ ለተሠሩ ጫማዎች እና አልባሳት ነፃ የልኬት ማስተካከያ አገልግሎት እናቀርባለን። የእርስዎ የቆዳ ጃኬት ወይም ጫማ በትክክል እንዲስማማዎት አነስተኛ ማስተካከያ የሚያስፈልገው ከሆነ፣ ዋና የእጅ ባለሙያዎቻችን በ7 ቀናት ውስጥ ያለምንም ተጨማሪ ክፍያ ያስተካክሉታል።',
  },
  {
    id: 'ets-1',
    category: 'et_switch',
    questionEn: 'What is ET-Switch and how do I make a secure payment?',
    questionAm: 'ኢቲ-ስዊች (ET-Switch) ምንድን ነው እና እንዴት በደህና መክፈል እችላለሁ?',
    answerEn: 'ET-Switch is the unified national payment gateway of Ethiopia, providing interoperability between all commercial banks and mobile wallets. During checkout, choose "ET-Switch Unified Payment" to pay securely using bank cards (EthioPay), direct account debits (CBE, Awash, Dashen, etc.), or digital mobile wallets (Telebirr, CBE Birr). All transactions are encrypted and certified by the National Bank of Ethiopia.',
    answerAm: 'ኢቲ-ስዊች (ET-Switch) በሁሉም የኢትዮጵያ የንግድ ባንኮች እና የሞባይል ዋሌቶች መካከል ቅንጅት የሚፈጥር አገር አቀፍ የክፍያ ሥርዓት ነው። በቼክአውት ወቅት "Unified Payment (ET-Switch)" የሚለውን በመምረጥ በባንክ ካርዶች (EthioPay)፣ በቀጥታ የባንክ ሒሳብ ዝውውር (ንግድ ባንክ፣ ዳሽን፣ አዋሽ፣ ወዘተ) ወይም በሞባይል ዋሌቶች (ቴሌብር፣ ሲቢኢ ብር) በከፍተኛ ጥበቃ መክፈል ይችላሉ።',
  },
  {
    id: 'ets-2',
    category: 'et_switch',
    questionEn: 'Are there extra charges when using the ET-Switch payment gateway?',
    questionAm: 'በኢቲ-ስዊች መክፈያ ሥርዓት ሲጠቀሙ ተጨማሪ የአገልግሎት ክፍያ ይጠየቃል?',
    answerEn: 'No. Zema Leather absorbs all transaction processing fees. Customers only pay the exact checkout amount of their premium handcrafted products without any hidden surcharges.',
    answerAm: 'በፍጹም። ዜማ ሌዘር (Zema Leather) ሁሉንም የኢቲ-ስዊች የግብይት ክፍያዎች ራሱ የሚሸፍን በመሆኑ፣ ያለ ምንም ተጨማሪ ድብቅ ክፍያ የእቃውን ዋጋ ብቻ ይከፍላሉ።',
  }
];

export default function FAQAccordion({ lang }: FAQAccordionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'shipping' | 'returns' | 'et_switch'>('all');

  const toggleItem = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  const filteredFAQs = activeCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(item => item.category === activeCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shipping':
        return <Truck className="w-3.5 h-3.5" />;
      case 'returns':
        return <RotateCcw className="w-3.5 h-3.5" />;
      case 'et_switch':
        return <Wallet className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div id="faq-accordion-section" className="bg-stone-950 border border-stone-850/60 rounded-xl p-6 md:p-8 max-w-4xl mx-auto my-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-900 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-1.5">
            <HelpCircle className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
              {lang === 'en' ? 'Support Center' : 'የድጋፍ ማዕከል'}
            </span>
          </div>
          <h3 className="text-lg font-sans font-medium text-stone-100 tracking-tight">
            {lang === 'en' ? 'Frequently Asked Questions' : 'ተደጋግመው የሚጠየቁ ጥያቄዎች'}
          </h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            {lang === 'en' 
              ? 'Learn more about shipping, sizing refinements, returns, and unified ET-Switch payment integrations.' 
              : 'ስለ ማድረሻ፣ ስለ ልኬት ማስተካከያዎች፣ ስለ ዕቃ መመለስ እና ስለ ኢቲ-ስዊች የተቀናጀ የክፍያ ሥርዓቶች በዝርዝር ይወቁ።'}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'shipping', 'returns', 'et_switch'] as const).map((cat) => (
            <button
              key={cat}
              id={`faq-filter-${cat}`}
              onClick={() => {
                setActiveCategory(cat);
                setActiveId(null);
              }}
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer border ${
                activeCategory === cat
                  ? 'bg-amber-600 text-stone-950 border-amber-500'
                  : 'bg-stone-900 text-stone-400 border-stone-850 hover:bg-stone-850/80 hover:text-stone-200'
              }`}
            >
              {cat === 'all' && (lang === 'en' ? 'All' : 'ሁሉም')}
              {cat === 'shipping' && (lang === 'en' ? 'Shipping' : 'ማድረሻ')}
              {cat === 'returns' && (lang === 'en' ? 'Returns' : 'መልስ')}
              {cat === 'et_switch' && (lang === 'en' ? 'ET-Switch' : 'ኢቲ-ስዊች')}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredFAQs.map((item) => {
          const isOpen = activeId === item.id;
          return (
            <div
              key={item.id}
              id={`faq-item-${item.id}`}
              className={`border rounded transition-all duration-300 ${
                isOpen 
                  ? 'border-amber-500/20 bg-stone-900/30 shadow-md' 
                  : 'border-stone-900 bg-stone-900/10 hover:border-stone-850 hover:bg-stone-900/20'
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex justify-between items-center px-4 py-4 text-left cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3 pr-4">
                  <div className={`p-1.5 rounded border transition-colors shrink-0 ${
                    isOpen 
                      ? 'bg-amber-600/10 border-amber-500/20 text-amber-500' 
                      : 'bg-stone-900/80 border-stone-850 text-stone-400'
                  }`}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <span className={`text-xs md:text-sm font-sans font-medium transition-colors ${
                    isOpen ? 'text-stone-100' : 'text-stone-300 hover:text-stone-100'
                  }`}>
                    {lang === 'en' ? item.questionEn : item.questionAm}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-amber-500' : ''
                }`} />
              </button>

              {/* Accordion Answer Content */}
              <div className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-[250px] border-t border-stone-900/50' : 'max-h-0'
              }`}>
                <div className="p-4 bg-stone-950/20 text-stone-400 text-xs md:text-sm leading-relaxed font-sans">
                  {lang === 'en' ? item.answerEn : item.answerAm}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
