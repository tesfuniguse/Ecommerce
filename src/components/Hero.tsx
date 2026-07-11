/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Star, ShieldCheck, Award } from 'lucide-react';

interface HeroProps {
  currentLang: 'en' | 'am';
  onExplore: () => void;
}

export default function Hero({ currentLang, onExplore }: HeroProps) {
  return (
    <div className="relative bg-stone-950 overflow-hidden border-b border-stone-800">
      
      {/* Background with luxury styling and generated image representation */}
      <div className="absolute inset-0 opacity-40">
        <img
          src="/src/assets/images/ethiopian_leather_travel_bag_1782296345901.jpg"
          alt="Ethiopian Leather Craftsmanship"
          className="w-full h-full object-cover filter blur-[2px] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/40"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 md:pt-44 md:pb-32 flex flex-col justify-center min-h-[500px]">
        <div className="max-w-2xl">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-amber-600/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-500 text-xs font-mono tracking-wider uppercase mb-6">
            <Award className="w-3.5 h-3.5" />
            <span>{currentLang === 'en' ? 'Authentic Ethiopian Highland Leather' : 'እውነተኛ የኢትዮጵያ ሀይላንድ ሌዘር'}</span>
          </div>

          {/* Heading */}
          <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-100 tracking-tight leading-none mb-6">
            {currentLang === 'en' ? (
              <>
                Uncompromising Luxury <br />
                <span className="text-amber-500">Handcrafted in Ethiopia</span>
              </>
            ) : (
              <>
                አስተማማኝ የቅንጦት ጥራት <br />
                <span className="text-amber-500">በኢትዮጵያ በእጅ የተሰራ</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-300 mb-8 leading-relaxed">
            {currentLang === 'en' ? (
              'Discover our curated selection of premium full-grain bags, wallets, belts, shoes, and bespoke accessories. Combining centuries of traditional tanning heritage with sophisticated modern Italian cuts.'
            ) : (
              'የእኛን በጥንቃቄ የተዘጋጁ ቦርሳዎች፣ የኪስ ቦርሳዎች፣ ቀበቶዎች፣ ጫማዎች እና ልዩ ተጨማሪ ምርቶች ስብስብ ያግኙ። የዘመናት ባህላዊ የቆዳ ፍቅፋቂ ጥበብን ከዘመናዊ ጣሊያን ዲዛይኖች ጋር አዋህደናል።'
            )}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onExplore}
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-sans font-semibold tracking-wider px-8 py-4 rounded-md text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-900/20 cursor-pointer"
            >
              <span>{currentLang === 'en' ? 'Explore Collections' : 'ስብስቦችን ይጎብኙ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://wa.me/251911223344"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-stone-700 bg-stone-900/50 hover:bg-stone-800 text-stone-200 hover:text-stone-100 px-8 py-4 rounded-md text-xs font-semibold tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>{currentLang === 'en' ? 'WhatsApp Support' : 'የዋትስአፕ እገዛ'}</span>
            </a>
          </div>

        </div>
      </div>

      {/* Feature stats band */}
      <div className="bg-stone-900 border-t border-stone-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            
            <div className="flex items-center space-x-4 px-4 border-b md:border-b-0 md:border-r border-stone-800 pb-4 md:pb-0">
              <div className="p-3 bg-stone-800/80 rounded-lg text-amber-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">
                  {currentLang === 'en' ? '100% Genuine Guarantee' : 'የ100% እውነተኛነት ዋስትና'}
                </p>
                <p className="text-stone-300 text-xs">
                  {currentLang === 'en' ? 'Premium hand-selected full-grain cow & sheep hides' : 'የተመረጡ እውነተኛ የወይፈን እና የበግ ቆዳዎች'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 px-4 border-b md:border-b-0 md:border-r border-stone-800 pb-4 md:pb-0">
              <div className="p-3 bg-stone-800/80 rounded-lg text-amber-500">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">
                  {currentLang === 'en' ? 'Heritage Craftsmanship' : 'የባህላዊ እደ-ጥበብ ትውፊት'}
                </p>
                <p className="text-stone-300 text-xs">
                  {currentLang === 'en' ? 'Ethically source, hand-stitched by local master artisans' : 'ለአካባቢ ጥበቃ እና በእጅ የተሰሩ ምርቶች'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 px-4">
              <div className="p-3 bg-stone-800/80 rounded-lg text-amber-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">
                  {currentLang === 'en' ? 'Secure ET-Switch Gateway' : 'አስተማማኝ ክፍያ በኢቲ-ስዊች'}
                </p>
                <p className="text-stone-300 text-xs">
                  {currentLang === 'en' ? 'Instant digital receipts and automated delivery tracking' : 'ፈጣን ዲጂታል ደረሰኞች እና ትዕዛዝ ክትትል'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
