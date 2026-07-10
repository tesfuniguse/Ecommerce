/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'travel-bag-1',
    nameEn: 'Abyssinia Premium Weekend Travel Bag',
    nameAm: 'አቢሲኒያ የቅንጦት የጉዞ ቦርሳ',
    descriptionEn: 'Handcrafted from full-grain Ethiopian highland cowhide leather. This spacious weekend travel bag features elegant brass hardware, multiple inner pockets, and a durable canvas lining. Perfect for business trips or weekend getaways.',
    descriptionAm: 'ከፍተኛ ጥራት ካለው የኢትዮጵያ ወይፈን ቆዳ በእጅ የተሰራ ሰፊ የጉዞ ቦርሳ። ውብ የናስ መቆለፊያዎች፣ በርካታ የውስጥ ኪሶች እና ጠንካራ የሸራ ሽፋን አለው። ለስራ ጉዞዎች ወይም ለዕረፍት ፍጹም ምርጫ።',
    priceETB: 18500,
    category: 'Travel Bags',
    images: [
      '/src/assets/images/ethiopian_leather_travel_bag_1782296345901.jpg',
      'https://picsum.photos/seed/travelbag-detail1/800/600',
      'https://picsum.photos/seed/travelbag-detail2/800/600'
    ],
    featuresEn: [
      '100% full-grain highland cowhide leather',
      'Water-resistant canvas lining',
      'YKK brass zippers and robust metal buckles',
      'Detachable padded shoulder strap',
      'Complimentary leather luggage tag'
    ],
    featuresAm: [
      '100% ንጹህ የወይፈን ቆዳ',
      'ውሃ የማያስገባ የውስጥ ሸራ ሽፋን',
      'ከፍተኛ ጥራት ያላቸው የናስ ዚፖች እና መቆለፊያዎች',
      'ሊነቀል የሚችል በትከሻ የሚንጠለጠል ቀበቶ',
      'ነጻ የቆዳ የጉዞ ስም መለጠፊያ'
    ],
    rating: 4.9,
    reviewsCount: 34,
    inventory: 12,
    isFeatured: true,
    isBestSeller: true,
    colorsEn: ['Dark Brown', 'Cognac Tan'],
    colorsAm: ['ጥቁር ቡናማ', 'ቀይ ቡናማ']
  },
  {
    id: 'messenger-bag-1',
    nameEn: 'Sheger Classic Messenger Bag',
    nameAm: 'ሸገር ክላሲክ የመልዕክተኛ ቦርሳ',
    descriptionEn: 'The perfect companion for the modern professional. Crafted from rich tan pull-up leather that develops a beautiful patina over time. Fits up to a 15-inch laptop, with dedicated compartments for pens, documents, and cards.',
    descriptionAm: 'ለዘመናዊው ባለሙያ ፍጹም ጓደኛ። ጊዜ ባለፈ ቁጥር ይበልጥ ውበት በሚያገኝ ቀይ-ቡናማ ቆዳ የተሰራ። እስከ 15 ኢንች ላፕቶፕ የሚይዝ ሲሆን ለስክሪብቶዎች፣ ሰነዶች እና ካርዶች ልዩ ክፍሎች አሉት።',
    priceETB: 12500,
    category: 'Leather Bags',
    images: [
      '/src/assets/images/ethiopian_leather_messenger_bag_1782296359538.jpg',
      'https://picsum.photos/seed/messenger-detail1/800/600'
    ],
    featuresEn: [
      'Aged pull-up cowhide leather',
      'Padded 15" laptop sleeve',
      'Quick-access magnetic snap closures',
      'Rear pocket for tablets or files',
      'Adjustable heavy-duty shoulder strap'
    ],
    featuresAm: [
      'የቆየ ውበት ያለው የወይፈን ቆዳ',
      'ለላፕቶፕ ጥበቃ የሚሆን ስፖንጅ ያለው ክፍል',
      'በቀላሉ የሚከፈቱ ማግኔቲክ መቆለፊያዎች',
      'ለውስጥ ታብሌት ወይም ሰነዶች የጀርባ ኪስ',
      'እንደ ፍላጎትዎ ሊረዝም የሚችል ጠንካራ ቀበቶ'
    ],
    rating: 4.8,
    reviewsCount: 28,
    inventory: 15,
    isFeatured: true,
    isNewArrival: true,
    colorsEn: ['Tan Camel', 'Vintage Brown'],
    colorsAm: ['ቀይ ቡናማ', 'ቪንቴጅ ቡናማ']
  },
  {
    id: 'wallet-set-1',
    nameEn: 'Lalibela Handmade Wallet & Belt Combo',
    nameAm: 'ላሊበላ የኪስ ቦርሳ እና ቀበቶ ስብስብ',
    descriptionEn: 'An exceptional gift set representing Ethiopia\'s centuries-old leathercraft. Includes a slim bi-fold wallet with RFID protection and a hand-burnished dress belt with a solid steel buckle.',
    descriptionAm: 'የኢትዮጵያን የዘመናት የቆዳ ስራ ጥበብ የሚያሳይ ልዩ የስጦታ ስብስብ። RFID መረጃ ጠላፊዎችን የሚከላከል ቀጭን የኪስ ቦርሳ እና በብረት ዘለበት የተሰራ ቀበቶ ያካትታል።',
    priceETB: 4800,
    category: 'Handmade Leather Accessories',
    images: [
      '/src/assets/images/ethiopian_leather_accessories_1782296373268.jpg',
      'https://picsum.photos/seed/acc-detail1/800/600',
      'https://picsum.photos/seed/acc-detail2/800/600'
    ],
    featuresEn: [
      'Premium calfskin leather texture',
      'Bi-fold wallet with 6 card slots and double bill compartment',
      'Belt width: 35mm with solid brass buckle',
      'Elegant wooden gift box packaging',
      'RFID blocking technology in wallet'
    ],
    featuresAm: [
      'ከጥጃ ቆዳ የተሰራ ለስላሳ ገጽታ',
      '6 የካርድ ክፍሎች እና 2 የገንዘብ ማስቀመጫ ያለው ቦርሳ',
      'ቀበቶው ስፋት፡ 35 ሚሜ ከጠንካራ ናስ ጋር',
      'ማራኪ የእንጨት ሳጥን የስጦታ ማሸጊያ',
      'የኤሌክትሮኒክስ ሌቦችን የሚከላከል ቴክኖሎጂ'
    ],
    rating: 4.9,
    reviewsCount: 52,
    inventory: 20,
    isBestSeller: true,
    sizes: ['32', '34', '36', '38', '40'], // belt sizes
    sizeInventory: { '32': 4, '34': 6, '36': 5, '38': 3, '40': 2 },
    colorsEn: ['Chestnut Brown', 'Classic Black'],
    colorsAm: ['ቡናማ', 'ጥቁር']
  },
  {
    id: 'shoes-1',
    nameEn: 'Axum Gentleman Oxfords',
    nameAm: 'አክሱም የክብር ኦክስፎርድ ጫማዎች',
    descriptionEn: 'Walk with confidence. Crafted with full-grain calf leather and welted leather soles. These Oxford shoes offer unmatched comfort with high breathability, suitable for formal occasions, weddings, and executive meetings.',
    descriptionAm: 'በኩራት ይራመዱ። ጥራት ካለው የጥጃ ቆዳ እና ጠንካራ የቆዳ ሶል የተሰራ። እነዚህ የኦክስፎርድ ጫማዎች ለይፋዊ ስብሰባዎች፣ ሰርግ እና የቢሮ ስራዎች ተስማሚ ናቸው።',
    priceETB: 8500,
    category: 'Shoes',
    images: [
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=600&auto=format&fit=crop'
    ],
    featuresEn: [
      'Premium full-grain Ethiopian calf leather',
      'Genuine leather sole with rubber grip insert',
      'Breathable leather lining',
      'Memory foam cushioned insole',
      'Hand-painted patina finish'
    ],
    featuresAm: [
      'ከፍተኛ ጥራት ያለው የኢትዮጵያ ጥጃ ቆዳ',
      'የቆዳ ሶል ከላስቲክ ግሪፕ ጋር',
      'አየር የሚያስገባ የውስጥ ቆዳ ሽፋን',
      'ለስላሳ ስፖንጅ ያለው ውስጠኛ ክፍል',
      'በእጅ የተቀባ ውብ አጨራረስ'
    ],
    rating: 4.7,
    reviewsCount: 19,
    inventory: 8,
    isFeatured: true,
    sizes: ['40', '41', '42', '43', '44'],
    sizeInventory: { '40': 2, '41': 2, '42': 2, '43': 1, '44': 1 },
    colorsEn: ['Mahogany Black', 'Cognac Tan'],
    colorsAm: ['ጥቁር', 'ቀይ ቡናማ']
  },
  {
    id: 'jacket-1',
    nameEn: 'Semien Rugged Leather Jacket',
    nameAm: 'ሰሜን ረገስ የቆዳ ጃኬት',
    descriptionEn: 'Designed to withstand the elements while keeping you stylish. This classic biker-style leather jacket is cut from select premium sheepskin leather, known for its buttery softness and natural durability.',
    descriptionAm: 'ቅንጦት እና ጥንካሬን ያጣመረ። ይህ የታወቀው የሞተርሳይክለኛ ስታይል ጃኬት የተሰራው እጅግ ለስላሳ እና ጠንካራ በሆነው የኢትዮጵያ በግ ቆዳ ነው።',
    priceETB: 19800,
    category: 'Jackets',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?q=80&w=600&auto=format&fit=crop'
    ],
    featuresEn: [
      'Premium highland sheepskin leather',
      'Satin-polyester interior lining',
      'Heavy-duty asymmetric steel zippers',
      'Four external zippered pockets, two inner pockets',
      'Tailored slim-fit cut'
    ],
    featuresAm: [
      'ከፍተኛ ጥራት ያለው የበግ ቆዳ',
      'ለስላሳ የሳቲን-ፖሊስተር የውስጥ ጨርቅ',
      'ጠንካራ የብረት ዚፖች',
      'አራት የውጪ ዚፕ ኪሶች እና ሁለት የውስጥ ኪሶች',
      'ቅልጥፍና ያለው ጠባብ ስታይል'
    ],
    rating: 4.8,
    reviewsCount: 15,
    inventory: 5,
    isNewArrival: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sizeInventory: { 'S': 1, 'M': 1, 'L': 2, 'XL': 1, 'XXL': 0 },
    colorsEn: ['Coal Black', 'Espresso Brown'],
    colorsAm: ['ጥቁር', 'ቡናማ']
  },
  {
    id: 'backpack-1',
    nameEn: 'Gibe Explorer Rugged Backpack',
    nameAm: 'ጊቤ የጀብዱ የጀርባ ቦርሳ',
    descriptionEn: 'The ultimate explorer\'s companion. Combines premium heavy-weight waxed canvas with full-grain leather straps and accents. Perfect for hikers, photographers, or students who appreciate vintage design.',
    descriptionAm: 'ለጀብደኞች ታላቅ ቦርሳ። ከፍተኛ ጥራት ያለው ሰም የተቀባ ሸራ እና ጠንካራ የቆዳ ማንጠልጠያዎችን ያጣመረ። ለተራራ ወጣዮች፣ ፎቶግራፍ አንሺዎች ወይም ተማሪዎች ተመራጭ።',
    priceETB: 9500,
    category: 'Backpacks',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=600&auto=format&fit=crop'
    ],
    featuresEn: [
      'Water-resistant waxed cotton canvas with cowhide leather trims',
      'Roll-top closure with adjustable leather straps',
      'Dedicated 15.6" laptop compartment',
      'Side water bottle pockets and quick-access front zip pocket',
      'Padded breathable mesh shoulder straps'
    ],
    featuresAm: [
      'ውሃ የማያስገባ ሰም የተከተተበት ሸራ እና የወይፈን ቆዳ',
      'በቆዳ ማንጠልጠያ የሚቆለፍ የላይኛው ክፍል',
      'የተለየ የ15.6 ኢንች ላፕቶፕ ማስቀመጫ',
      'የጎን የውሃ ጆግ ኪሶች እና የፊት ዚፕ ኪስ',
      'ለትከሻ ምቾት የሚሆን አየር የሚያስገባ ስፖንጅ'
    ],
    rating: 4.6,
    reviewsCount: 11,
    inventory: 14,
    colorsEn: ['Olive Green & Tan', 'Charcoal & Black'],
    colorsAm: ['ወይራ አረንጓዴ እና ቡናማ', 'ጥቁር እና አመድማ']
  },
  {
    id: 'wallet-1',
    nameEn: 'Zula Minimalist Cardholder Wallet',
    nameAm: 'ዙላ አነስተኛ የካርድ መያዣ ቦርሳ',
    descriptionEn: 'A slim, minimalist design for those who prefer to carry only the essentials. Features card slots on both sides and a center pocket for folded cash, fits perfectly in front pockets.',
    descriptionAm: 'አስፈላጊ የሆኑ ነገሮችን ብቻ መያዝ ለሚመርጡ ቀጭን እና አነስተኛ የኪስ ቦርሳ። በሁለቱም በኩል የካርድ ማስቀመጫዎች እና በመሃል የብር ኪስ አለው።',
    priceETB: 1500,
    category: 'Wallets',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop'
    ],
    featuresEn: [
      'Hand-stitched Ethiopian calf leather',
      'Holds up to 6-8 cards and cash',
      'Super slim profile (only 0.4cm thick)',
      'Debossed brand emblem',
      'Premium gift sleeve included'
    ],
    featuresAm: [
      'በእጅ የተሰፋ የኢትዮጵያ ጥጃ ቆዳ',
      'እስከ 6-8 ካርዶችን እና ጥሬ ብር ይይዛል',
      'እጅግ ቀጭን ቅርፅ (0.4 ሳ.ሜ ብቻ ውፍረት)',
      'የታተመበት ውብ አርማ',
      'ልዩ የስጦታ ማሸጊያ ያካትታል'
    ],
    rating: 4.9,
    reviewsCount: 42,
    inventory: 45,
    isBestSeller: true,
    colorsEn: ['Saddle Brown', 'Jet Black'],
    colorsAm: ['ቡናማ', 'ጥቁር']
  },
  {
    id: 'belt-1',
    nameEn: 'Entoto Classic Burnished Belt',
    nameAm: 'እንጦጦ የቆዳ ቀበቶ',
    descriptionEn: 'Crafted from a single strip of heavy vegetable-tanned steerhide leather. Hand-burnished edges and a polished nickel-finish buckle make this belt perfect for jeans or business suits.',
    descriptionAm: 'ከጠንካራ እና በጥንቃቄ ከተዘጋጀ የቆዳ ንጣፍ የተሰራ። በዕጅ የተወለወለ ጠርዝ እና ውብ የሆነ የብረት መቆለፊያ ያለው ቀበቶ ለጂንስ ወይም ለቢሮ ልብሶች ተስማሚ ነው።',
    priceETB: 2200,
    category: 'Belts',
    images: [
      'https://images.unsplash.com/photo-1624222247344-550fb8be8972?q=80&w=600&auto=format&fit=crop'
    ],
    featuresEn: [
      'Solid 4mm thick vegetable-tanned leather',
      'Hand-painted and burnished edges',
      'Heavy-duty alloy buckle in satin silver',
      'Classic 5-hole adjustment spacing',
      'Belt width: 1.5 inches'
    ],
    featuresAm: [
      'ጠንካራ 4ሚሜ ውፍረት ያለው የቆዳ ቀበቶ',
      'በእጅ የተለቀለቀ እና የተወለወለ ጠርዝ',
      'ጠንካራና ማራኪ የብር ቀለም መቆለፊያ',
      'ለማስተካከያ የሚሆኑ አምስት ቀዳዳዎች',
      'ቀበቶው ስፋት፡ 1.5 ኢንች'
    ],
    rating: 4.8,
    reviewsCount: 30,
    inventory: 35,
    sizes: ['32', '34', '36', '38', '40', '42'],
    sizeInventory: { '32': 5, '34': 8, '36': 10, '38': 6, '40': 4, '42': 2 },
    colorsEn: ['Mahogany', 'Midnight Black'],
    colorsAm: ['ቡናማ', 'ጥቁር']
  }
];
