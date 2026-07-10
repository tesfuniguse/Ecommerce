/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ruler, Check, Sparkles, ChevronRight, HelpCircle, Info, RefreshCw, ThumbsUp, Sliders } from 'lucide-react';

interface FindMySizeAssistantProps {
  currentLang: 'en' | 'am';
  category: string; // 'jackets' | 'shoes' | 'belts' | 'accessories'
  availableSizes?: string[];
  onApplySize: (size: string) => void;
  onClose: () => void;
}

export default function FindMySizeAssistant({
  currentLang,
  category: initialCategory,
  availableSizes = [],
  onApplySize,
  onClose,
}: FindMySizeAssistantProps) {
  // Determine normalized active category
  const getNormalizedCategory = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('shoe') || c.includes('footwear')) return 'shoes';
    if (c.includes('belt')) return 'belts';
    if (c.includes('jacket') || c.includes('apparel')) return 'jackets';
    return 'jackets'; // Default fallback
  };

  const [activeCategory, setActiveCategory] = useState<'jackets' | 'shoes' | 'belts'>(
    getNormalizedCategory(initialCategory)
  );

  const [inputMode, setInputMode] = useState<'measurements' | 'brands'>('measurements');
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  // Input states
  // 1. Jackets
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [chest, setChest] = useState<number>(38); // inches
  const [sleeve, setSleeve] = useState<number>(33); // inches
  const [jacketBrand, setJacketBrand] = useState<string>('zara');
  const [jacketBrandSize, setJacketBrandSize] = useState<string>('M');

  // 2. Shoes
  const [footLength, setFootLength] = useState<number>(26.5); // cm by default
  const [shoeGender, setShoeGender] = useState<'male' | 'female'>('male');
  const [shoeBrand, setShoeBrand] = useState<string>('nike');
  const [shoeBrandSize, setShoeBrandSize] = useState<string>('9.5');

  // 3. Belts
  const [waist, setWaist] = useState<number>(32); // inches
  const [pantSize, setPantSize] = useState<number>(32);

  // Result Recommendation State
  const [recommendedSize, setRecommendedSize] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [explanationAm, setExplanationAm] = useState<string>('');
  const [fitPercentage, setFitPercentage] = useState<number>(95);

  // Calculate and Update recommendations dynamically based on inputs
  useEffect(() => {
    let rec = '';
    let expEn = '';
    let expAm = '';
    let fit = 95;

    if (activeCategory === 'jackets') {
      if (inputMode === 'measurements') {
        // Convert to inches for mapping logic if currently in cm
        const chestVal = unit === 'cm' ? chest / 2.54 : chest;
        
        if (chestVal < 37) {
          rec = 'S';
          expEn = `Based on your ${chest}${unit} chest measurement, our slim-cut Small (S) is the ideal match. Genuine sheepskin stretches slightly for a personalized silhouette.`;
          expAm = `በእርስዎ ${chest}${unit} የደረት ልኬት መሠረት፣ የእኛ ጠባብ ስታይል ስሞል (S) ተስማሚ ነው። እውነተኛ የበግ ቆዳ ለሰውነትዎ ምቹ ለመሆን በትንሹ ይለጠጣል።`;
        } else if (chestVal >= 37 && chestVal <= 40) {
          rec = 'M';
          expEn = `A chest measurement of ${chest}${unit} aligns perfectly with our Medium (M). This provides a sharp, structured biker silhouette without feeling restrictive.`;
          expAm = `የ${chest}${unit} የደረት ልኬት ከእኛ ሚዲየም (M) ጋር በትክክል ይጣጣማል። ይህ ምንም ዓይነት መጨናነቅ ሳይኖርብዎት ውብ የጃኬት ቅርፅ ይሰጥዎታል።`;
        } else if (chestVal > 40 && chestVal <= 44) {
          rec = 'L';
          expEn = `For your ${chest}${unit} chest, we recommend Large (L). This allows comfortable shoulder rotation and room for light layered clothing beneath.`;
          expAm = `ለእርስዎ ${chest}${unit} ደረት፣ ላርጅ (L) እንመክራለን። ይህ ለትከሻዎ ምቾትን የሚሰጥ ሲሆን በውስጥም ቀጭን ሹራብ ለመልበስ ያስችላል።`;
        } else if (chestVal > 44 && chestVal <= 48) {
          rec = 'XL';
          expEn = `With a ${chest}${unit} chest, X-Large (XL) will yield a tailored premium look. Designed to complement high-density shoulders with authentic highland leather durability.`;
          expAm = `በ${chest}${unit} ደረት፣ ኤክስትራ ላርጅ (XL) የተዋበ መልክ ይሰጥዎታል። ለትከሻዎችዎ ምቾት እንዲሰጥ እና ዘላቂነት እንዲኖረው ተደርጎ የተሰራ ነው።`;
        } else {
          rec = 'XXL';
          expEn = `Your robust ${chest}${unit} chest maps to XX-Large (XXL). This ensures adequate drape along the hemline and proper fit across the chest panels.`;
          expAm = `የእርስዎ ${chest}${unit} የደረት ልኬት ከኤክስትራ ኤክስትራ ላርጅ (XXL) ጋር ይዛመዳል። ይህ በደረቱ ዙሪያ በቂ ምቾት እና ተስማሚነትን ያረጋግጣል።`;
        }
        
        // Sleeve trim helper
        const sleeveVal = unit === 'cm' ? sleeve / 2.54 : sleeve;
        if (sleeveVal > 35 && rec !== 'XXL' && rec !== 'XL') {
          fit = 88;
          expEn += ` Note: Your sleeves are relatively long; consider sizing up if you prefer a longer arm coverage.`;
          expAm += ` ማሳሰቢያ፡ የእጅዎ ርዝመት ረዘም ያለ ስለሆነ ረጅም እጅጌ የሚመርጡ ከሆነ አንድ መጠን ከፍ ቢያደርጉ ይመረጣል።`;
        }
      } else {
        // Brand mappings
        const isSlimBrand = jacketBrand === 'zara' || jacketBrand === 'hm';
        if (isSlimBrand) {
          rec = jacketBrandSize;
          expEn = `Zara and H&M share similar slim-fit patterns with our boutique. Your standard size ${jacketBrandSize} will fit like a glove in our Ethiopian leather.`;
          expAm = `ዛራ እና ኤች ኤንድ ኤም ከእኛ ጋር ተመሳሳይ የሆኑ ጠባብ ዲዛይኖችን ያጋራሉ። የእርስዎ መደበኛ መጠን ${jacketBrandSize} በእኛ የኢትዮጵያ ቆዳ ላይ ልክ ልክዎ ይሆናል።`;
        } else {
          // Relaxed brands (Nike, Levi's) - recommend sizing UP because leather is slim cut
          const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
          const idx = sizes.indexOf(jacketBrandSize);
          if (idx !== -1 && idx < sizes.length - 1) {
            rec = sizes[idx + 1];
            fit = 90;
            expEn = `Since ${jacketBrand === 'nike' ? 'Nike' : "Levi's"} is cut relaxed, we recommend sizing up to ${rec} for our tailored Ethiopian leather jacket.`;
            expAm = `${jacketBrand === 'nike' ? 'ናይኪ' : 'ሌቪስ'} ሰፋ ያሉ ልብሶች ስለሚሰሩ፣ ለእኛ ጠባብ የቆዳ ጃኬት መጠንዎን ወደ ${rec} ከፍ ቢያደርጉ ይመረጣል።`;
          } else {
            rec = jacketBrandSize;
            expEn = `Your typical size ${jacketBrandSize} is our best recommendation. Fits closely for an authentic handcrafted aesthetic.`;
            expAm = `የእርስዎ መደበኛ መጠን ${jacketBrandSize} የእኛ ምርጥ ምርጫ ነው። ለእጅ ጥበብ ውጤቱ ውበት እንዲሰጥ በልኩ የተሰራ ነው።`;
          }
        }
      }
    } else if (activeCategory === 'shoes') {
      if (inputMode === 'measurements') {
        // Foot length mapping
        const lengthCm = unit === 'in' ? footLength * 2.54 : footLength;
        
        if (lengthCm < 25.0) {
          rec = '39';
          expEn = `For a foot length of ${footLength}${unit}, size 39 fits snugly. Handcrafted with genuine calfskin which molds perfectly to your foot arch.`;
          expAm = `ለእግር ርዝመት ${footLength}${unit}፣ መጠን 39 በትክክል ይስማማል። ከጥጃ ቆዳ የተሰራው ይህ ጫማ ከእግርዎ ቅርፅ ጋር በፍጥነት ይላመዳል።`;
        } else if (lengthCm >= 25.0 && lengthCm < 25.8) {
          rec = '40';
          expEn = `A foot length of ${footLength}${unit} translates to European size 40. Accommodates standard width comfortably with luxury leather breathability.`;
          expAm = `የእግርዎ ርዝመት ${footLength}${unit} ከሆነ የጫማ መጠንዎ 40 ነው። መደበኛውን የእግር ስፋት በአስተማማኝ ሁኔታ ያስተናግዳል።`;
        } else if (lengthCm >= 25.8 && lengthCm < 26.4) {
          rec = '41';
          expEn = `Your ${footLength}${unit} foot length maps to size 41. Perfect for gentleman Oxfords, allowing adequate wiggle room for toes while preventing heel slippage.`;
          expAm = `የእርስዎ ${footLength}${unit} የእግር ርዝመት ከጫማ መጠን 41 ጋር ይጣጣማል። ለኦክስፎርድ ጫማዎች ፍጹም ሲሆን ለጣቶችዎ በቂ ምቾት ይሰጣል።`;
        } else if (lengthCm >= 26.4 && lengthCm < 27.1) {
          rec = '42';
          expEn = `Size 42 is highly recommended for a foot length of ${footLength}${unit}. Our hand-burnished dress soles are welted to absorb impact beautifully at this scale.`;
          expAm = `ለእግር ርዝመት ${footLength}${unit} መጠን 42 በጣም ይመከራል። በእጅ የተወለወለው የእኛ ሶል ለዚህ መጠን እግር ምቹ እረፍት ይሰጣል።`;
        } else if (lengthCm >= 27.1 && lengthCm < 27.7) {
          rec = '43';
          expEn = `Your measurement of ${footLength}${unit} indicates size 43. Engineered with a cushioned memory foam insole for exceptional executive comfort.`;
          expAm = `የእርስዎ ${footLength}${unit} ልኬት የጫማ መጠን 43ን ያሳያል። እጅግ አስደናቂ ምቾት ለመስጠት በውስጡ ልዩ ስፖንጅ ተደርጎለታል።`;
        } else if (lengthCm >= 27.7 && lengthCm < 28.4) {
          rec = '44';
          expEn = `At ${footLength}${unit}, size 44 provides the optimal fit. Ensures that the premium calf leather uppers flex at the correct point of your foot.`;
          expAm = `በ${footLength}${unit} የእግር ርዝመት፣ የጫማ መጠን 44 የተሻለውን ተስማሚነት ይሰጣል። የጥጃው ቆዳ በሚራመዱበት ወቅት ተጣጣፊነት እንዲኖረው ይረዳል።`;
        } else {
          rec = '45';
          expEn = `For a foot length exceeding 28.4cm, size 45 is the recommended choice to prevent pinching along the toe box.`;
          expAm = `ከ28.4 ሴ.ሜ በላይ ለሆነ የእግር ርዝመት፣ በጣቶቹ አካባቢ ምንም መጨናነቅ እንዳይኖር መጠን 45 የተመረጠ ምርጫ ነው።`;
        }
      } else {
        // Shoe brand sizes mapped to EU
        const numSize = parseFloat(shoeBrandSize);
        if (shoeBrand === 'nike' || shoeBrand === 'adidas') {
          // Sneaker sizes run small relative to dress shoes. People size down by 0.5 to 1 full size.
          if (numSize <= 7.0) rec = '39';
          else if (numSize === 7.5 || numSize === 8.0) rec = '40';
          else if (numSize === 8.5 || numSize === 9.0) rec = '41';
          else if (numSize === 9.5) rec = '42';
          else if (numSize === 10.0 || numSize === 10.5) rec = '43';
          else if (numSize === 11.0 || numSize === 11.5) rec = '44';
          else rec = '45';

          expEn = `Sneakers like ${shoeBrand === 'nike' ? 'Nike' : 'Adidas'} run small. Dress shoes use traditional sizing. Sizing down to ${rec} guarantees a solid, non-slip luxury fit.`;
          expAm = `እንደ ${shoeBrand === 'nike' ? 'ናይኪ' : 'አዲዳስ'} ያሉ የስፖርት ጫማዎች መጠናቸው አነስተኛ ነው። የቆዳ ጫማዎች ግን መደበኛውን መጠን ስለሚጠቀሙ መጠን ${rec} በትክክል ይስማማዎታል።`;
        } else {
          // Clarks / Dress Shoes (run true to dress shoe size)
          if (numSize <= 6.5) rec = '39';
          else if (numSize === 7.0 || numSize === 7.5) rec = '40';
          else if (numSize === 8.0 || numSize === 8.5) rec = '41';
          else if (numSize === 9.0 || numSize === 9.5) rec = '42';
          else if (numSize === 10.0 || numSize === 10.5) rec = '43';
          else if (numSize === 11.0 || numSize === 11.5) rec = '44';
          else rec = '45';

          expEn = `Clarks and traditional dress shoes share precise sizing with our Ethiopian leather oxfords. Your standard dress shoe size maps directly to ${rec}.`;
          expAm = `ክላርክስ እና ባህላዊ የቆዳ ጫማዎች ከእኛ የኦክስፎርድ ጫማዎች ጋር ተመሳሳይ ልኬት አላቸው። የእርስዎ መደበኛ መጠን ወደ ${rec} በቀጥታ ይተረጎማል።`;
        }
      }
    } else if (activeCategory === 'belts') {
      // Belt sizing is Waist + 2 inches
      let baseWaist = waist;
      if (inputMode === 'measurements') {
        baseWaist = unit === 'cm' ? waist / 2.54 : waist;
      } else {
        baseWaist = pantSize;
      }

      // Round to nearest belt size (even numbers starting from 32 to 42)
      const idealBeltSize = Math.ceil(baseWaist) + 2;
      let matchedBelt = 34;

      if (idealBeltSize <= 32) matchedBelt = 32;
      else if (idealBeltSize <= 34) matchedBelt = 34;
      else if (idealBeltSize <= 36) matchedBelt = 36;
      else if (idealBeltSize <= 38) matchedBelt = 38;
      else if (idealBeltSize <= 40) matchedBelt = 40;
      else matchedBelt = 42;

      rec = matchedBelt.toString();
      
      expEn = `The master golden rule of leather belts: Always order 2 inches larger than your pants/waist size. For a ${Math.round(baseWaist)}" waist, belt size ${rec} is the absolute perfect fit, buckling right in the neat center hole.`;
      expAm = `የቆዳ ቀበቶዎች ወርቃማ ህግ፡- ሁልጊዜ ከሱሪዎ/ወገብዎ መጠን በ2 ኢንች የሚበልጥ ይዘዙ። ለ${Math.round(baseWaist)}" ወገብ፣ የቀበቶ መጠን ${rec} ትክክለኛው ምርጫ ሲሆን ልክ በመሃለኛው ቀዳዳ ላይ ይታሰራል።`;
    }

    setRecommendedSize(rec);
    setExplanation(expEn);
    setExplanationAm(expAm);
    setFitPercentage(fit);
  }, [activeCategory, inputMode, unit, chest, sleeve, jacketBrand, jacketBrandSize, footLength, shoeGender, shoeBrand, shoeBrandSize, waist, pantSize]);

  // Adjust parameters when switching categories or modes
  const handleCategoryChange = (cat: 'jackets' | 'shoes' | 'belts') => {
    setActiveCategory(cat);
    if (cat === 'shoes') {
      setUnit('cm'); // Shoes footprint measurements are best in cm
    } else {
      setUnit('in');
    }
  };

  const isSizeAvailable = availableSizes.length === 0 || availableSizes.includes(recommendedSize);

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex bg-stone-950/60 p-1 rounded-md border border-stone-850">
        <button
          type="button"
          onClick={() => handleCategoryChange('jackets')}
          className={`flex-1 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
            activeCategory === 'jackets'
              ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {currentLang === 'en' ? 'Jackets & Apparel' : 'ጃኬቶች እና አልባሳት'}
        </button>
        <button
          type="button"
          onClick={() => handleCategoryChange('shoes')}
          className={`flex-1 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
            activeCategory === 'shoes'
              ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {currentLang === 'en' ? 'Oxfords / Shoes' : 'ጫማዎች'}
        </button>
        <button
          type="button"
          onClick={() => handleCategoryChange('belts')}
          className={`flex-1 py-2 text-xs font-mono rounded transition-all cursor-pointer ${
            activeCategory === 'belts'
              ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {currentLang === 'en' ? 'Leather Belts' : 'ቀበቶዎች'}
        </button>
      </div>

      {/* Input Mode Tabs */}
      <div className="flex gap-4 border-b border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setInputMode('measurements')}
          className={`text-xs font-mono pb-1 border-b-2 transition-all cursor-pointer ${
            inputMode === 'measurements'
              ? 'border-amber-500 text-stone-100 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          {currentLang === 'en' ? '📐 Input My Measurements' : '📐 ልኬቶቼን አስገባ'}
        </button>
        <button
          type="button"
          onClick={() => setInputMode('brands')}
          className={`text-xs font-mono pb-1 border-b-2 transition-all cursor-pointer ${
            inputMode === 'brands'
              ? 'border-amber-500 text-stone-100 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          {currentLang === 'en' ? '🏷️ Match Global Brands' : '🏷️ ከታወቁ ብራንዶች አወዳድር'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Input Controls */}
        <div className="md:col-span-6 space-y-5 bg-stone-900/50 p-4 rounded-lg border border-stone-850/60">
          
          {/* UNIT SELECTOR (Only for Measurements mode) */}
          {inputMode === 'measurements' && (
            <div className="flex justify-between items-center bg-stone-950/30 p-2 rounded border border-stone-850/40">
              <span className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                {currentLang === 'en' ? 'Measurement Unit' : 'መለኪያ መለኪያ'}
              </span>
              <div className="flex bg-stone-900 rounded p-0.5 border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    if (unit === 'cm') {
                      setUnit('in');
                      // Approximate conversions to avoid slider overflow
                      if (activeCategory === 'jackets') {
                        setChest(Math.round(chest / 2.54));
                        setSleeve(Math.round(sleeve / 2.54));
                      } else if (activeCategory === 'shoes') {
                        setFootLength(parseFloat((footLength / 2.54).toFixed(1)));
                      } else {
                        setWaist(Math.round(waist / 2.54));
                      }
                    }
                  }}
                  className={`px-2 py-1 text-[10px] font-mono rounded ${
                    unit === 'in' ? 'bg-amber-600/20 text-amber-500 font-bold' : 'text-stone-400'
                  }`}
                >
                  Inches (in)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (unit === 'in') {
                      setUnit('cm');
                      if (activeCategory === 'jackets') {
                        setChest(Math.round(chest * 2.54));
                        setSleeve(Math.round(sleeve * 2.54));
                      } else if (activeCategory === 'shoes') {
                        setFootLength(parseFloat((footLength * 2.54).toFixed(1)));
                      } else {
                        setWaist(Math.round(waist * 2.54));
                      }
                    }
                  }}
                  className={`px-2 py-1 text-[10px] font-mono rounded ${
                    unit === 'cm' ? 'bg-amber-600/20 text-amber-500 font-bold' : 'text-stone-400'
                  }`}
                >
                  Metric (cm)
                </button>
              </div>
            </div>
          )}

          {/* 1. JACKETS CONTROLS */}
          {activeCategory === 'jackets' && (
            <div className="space-y-4">
              {inputMode === 'measurements' ? (
                <>
                  {/* Chest measurement */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{currentLang === 'en' ? 'Chest Circumference' : 'የደረት ዙሪያ'}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-stone-500 cursor-pointer" title={currentLang === 'en' ? 'Measure around the fullest part of your chest, keeping tape horizontal.' : 'ቴፑን አግድም በማድረግ በደረትዎ ሰፊ ቦታ ላይ ይለኩ።'} />
                      </span>
                      <span className="text-amber-500 font-bold text-sm">{chest} {unit}</span>
                    </div>
                    <input
                      type="range"
                      min={unit === 'in' ? 32 : 80}
                      max={unit === 'in' ? 56 : 142}
                      value={chest}
                      onChange={(e) => setChest(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-600">
                      <span>{unit === 'in' ? '32"' : '80 cm'}</span>
                      <span>{unit === 'in' ? '44"' : '110 cm'}</span>
                      <span>{unit === 'in' ? '56"' : '142 cm'}</span>
                    </div>
                  </div>

                  {/* Sleeve length */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{currentLang === 'en' ? 'Sleeve / Arm Length' : 'የእጅጌ ርዝመት'}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-stone-500 cursor-pointer" title={currentLang === 'en' ? 'Measure from the center back of your neck to your wrist.' : 'ከአንገትዎ ጀርባ መሃል ጀምሮ በትከሻዎ በኩል እስከ እጅዎ አንጓ ድረስ ይለኩ።'} />
                      </span>
                      <span className="text-amber-500 font-bold text-sm">{sleeve} {unit}</span>
                    </div>
                    <input
                      type="range"
                      min={unit === 'in' ? 28 : 71}
                      max={unit === 'in' ? 38 : 96}
                      value={sleeve}
                      onChange={(e) => setSleeve(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-600">
                      <span>{unit === 'in' ? '28"' : '71 cm'}</span>
                      <span>{unit === 'in' ? '33"' : '84 cm'}</span>
                      <span>{unit === 'in' ? '38"' : '96 cm'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Brand select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400">
                      {currentLang === 'en' ? 'Choose Reference Brand' : 'የማጣቀሻ ብራንድ ይምረጡ'}
                    </label>
                    <select
                      value={jacketBrand}
                      onChange={(e) => setJacketBrand(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded p-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="zara">Zara (Slim Cut)</option>
                      <option value="hm">H&M (Modern Fit)</option>
                      <option value="levis">Levi's (Classic Fit)</option>
                      <option value="nike">Nike / Adidas (Relaxed Athletic)</option>
                    </select>
                  </div>

                  {/* Typical Size select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400">
                      {currentLang === 'en' ? 'Your Typical Size' : 'የእርስዎ የተለመደ መጠን'}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setJacketBrandSize(sz)}
                          className={`py-2 text-xs font-mono font-bold border rounded transition-all cursor-pointer ${
                            jacketBrandSize === sz
                              ? 'bg-amber-600/20 text-amber-500 border-amber-500'
                              : 'bg-stone-950 border-stone-850 hover:border-stone-750 text-stone-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. SHOES CONTROLS */}
          {activeCategory === 'shoes' && (
            <div className="space-y-4">
              {inputMode === 'measurements' ? (
                <>
                  {/* Foot Length slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{currentLang === 'en' ? 'Longest Foot Length' : 'ረጅሙ የእግር ርዝመት'}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-stone-500 cursor-pointer" title={currentLang === 'en' ? 'Place foot flat on paper, trace outline, and measure from heel back to longest toe tip.' : 'እግርዎን በወረቀት ላይ በማድረግ ይሳሉ፤ ከዚያም ተረከዝዎ ጀምሮ እስከ ረጅሙ ጣትዎ ድረስ ይለኩ።'} />
                      </span>
                      <span className="text-amber-500 font-bold text-sm">{footLength} {unit}</span>
                    </div>
                    <input
                      type="range"
                      min={unit === 'in' ? 9.2 : 23.5}
                      max={unit === 'in' ? 11.8 : 30.0}
                      step={0.1}
                      value={footLength}
                      onChange={(e) => setFootLength(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-600">
                      <span>{unit === 'in' ? '9.2"' : '23.5 cm'}</span>
                      <span>{unit === 'in' ? '10.5"' : '26.8 cm'}</span>
                      <span>{unit === 'in' ? '11.8"' : '30.0 cm'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Brand select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400">
                      {currentLang === 'en' ? 'Choose Shoe Brand' : 'የጫማ ብራንድ ይምረጡ'}
                    </label>
                    <select
                      value={shoeBrand}
                      onChange={(e) => setShoeBrand(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded p-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="nike">Nike Sneaker</option>
                      <option value="adidas">Adidas Sneaker</option>
                      <option value="clarks">Clarks / Dress Shoe</option>
                      <option value="dress">Standard Oxford/Dress Shoe</option>
                    </select>
                  </div>

                  {/* US Men's / UK Shoe size select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400">
                      {currentLang === 'en' ? "US Men's Size" : 'US የወንዶች የጫማ መጠን'}
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {['7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0', '10.5', '11.0', '11.5', '12.0', '12.5'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setShoeBrandSize(sz)}
                          className={`py-1.5 text-xs font-mono border rounded transition-all cursor-pointer ${
                            shoeBrandSize === sz
                              ? 'bg-amber-600/20 text-amber-500 border-amber-500 font-bold'
                              : 'bg-stone-950 border-stone-850 hover:border-stone-750 text-stone-400'
                          }`}
                        >
                          US {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. BELTS CONTROLS */}
          {activeCategory === 'belts' && (
            <div className="space-y-4">
              {inputMode === 'measurements' ? (
                <>
                  {/* Waist measurement */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{currentLang === 'en' ? 'Natural Waist Circumference' : 'የወገብ ዙሪያ ልኬት'}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-stone-500 cursor-pointer" title={currentLang === 'en' ? 'Measure around where you typically wear your pants.' : 'ብዙውን ጊዜ ሱሪዎን በሚያሰሩበት ወገብ ዙሪያ ይለኩ።'} />
                      </span>
                      <span className="text-amber-500 font-bold text-sm">{waist} {unit}</span>
                    </div>
                    <input
                      type="range"
                      min={unit === 'in' ? 26 : 66}
                      max={unit === 'in' ? 44 : 112}
                      value={waist}
                      onChange={(e) => setWaist(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-600">
                      <span>{unit === 'in' ? '26"' : '66 cm'}</span>
                      <span>{unit === 'in' ? '34"' : '86 cm'}</span>
                      <span>{unit === 'in' ? '44"' : '112 cm'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Typical pant size (Levi's style waist tag) */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-stone-400 uppercase tracking-wider">
                        {currentLang === 'en' ? 'Typical Pant Waist Size (Tag)' : 'የሱሪ ወገብ መጠን (ታግ)'}
                      </span>
                      <span className="text-amber-500 font-bold text-sm">W{pantSize}</span>
                    </div>
                    <input
                      type="range"
                      min={28}
                      max={42}
                      step={1}
                      value={pantSize}
                      onChange={(e) => setPantSize(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-600">
                      <span>W28</span>
                      <span>W34</span>
                      <span>W42</span>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-relaxed italic mt-1.5">
                      {currentLang === 'en'
                        ? '💡 Use your standard jeans size (e.g. Levi’s 501 leather label size).'
                        : '💡 የእርስዎን መደበኛ የጂንስ ሱሪ መጠን (ለምሳሌ ሌቪስ 501) ይጠቀሙ።'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick tips box */}
          <div className="bg-stone-950/40 p-3 rounded border border-stone-850/60 flex items-start gap-2 text-[11px] text-stone-400">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-mono text-stone-300 font-bold block mb-0.5">
                {currentLang === 'en' ? 'Craftsman Sizing Secret' : 'የእጅ ጥበብ ባለሙያው ምስጢር'}
              </span>
              <p className="leading-relaxed">
                {activeCategory === 'jackets' && (currentLang === 'en' 
                  ? 'Our sheepskin jackets feature a structured European slim-fit design. Sizing down gives a highly tailored aesthetic, while sizing up is perfect for layered winter wear.'
                  : 'የእኛ የበግ ቆዳ ጃኬቶች የአውሮፓ ጠባብ ስታይል ዲዛይን አላቸው። አነስተኛ መጠን መምረጥ ለሰውነትዎ ልክ ልክ ሲያደርገው፣ መጠን ከፍ ማድረግ ደግሞ በውስጡ ሹራብ ለመልበስ ምቹ ያደርገዋል።')}
                {activeCategory === 'shoes' && (currentLang === 'en'
                  ? 'Ethiopian highland calfskin adapts to your feet’s natural pressure points over a week of active wear. It stretches up to 0.5 sizes for a seamless custom contours.'
                  : 'የኢትዮጵያ ከፍተኛ ጥራት ያለው የጥጃ ቆዳ ከተጫሙት ከአንድ ሳምንት በኋላ ከተፈጥሯዊ የእግርዎ ቅርፅ ጋር ሙሉ በሙሉ ይላመዳል። ፍጹም ምቾት ለመስጠት እስከ 0.5 መጠን የመለጠጥ አቅም አለው።')}
                {activeCategory === 'belts' && (currentLang === 'en'
                  ? 'Leather belts are measured from the buckle fold to the center hole, which allows maximum flexibility. Ordering exactly waist size results in a belt that is too short.'
                  : 'የቆዳ ቀበቶዎች የሚለኩት ከዘለበቱ እጥፋት ጀምሮ እስከ መሃለኛው ቀዳዳ ድረስ ሲሆን ይህም የተሻለ ተለዋዋጭነት ይሰጣል። ልክ በወገብዎ መጠን ካዘዙ ቀበቶው በጣም አጭር ይሆናል።')}
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Mapping & Dynamic Results */}
        <div className="md:col-span-6 flex flex-col justify-between h-full bg-stone-950/50 p-5 rounded-lg border border-stone-800 relative overflow-hidden">
          
          {/* Subtle Ambient Background Flare */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Result Heading */}
          <div className="text-center pb-4 border-b border-stone-850">
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">
              {currentLang === 'en' ? 'Your Tailored Result' : 'ለእርስዎ የተመረጠ ውጤት'}
            </span>
            
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-stone-300 font-bold text-sm">
                {currentLang === 'en' ? 'Recommended Ethiopian Size' : 'የሚመከር የኢትዮጵያ መጠን'}
              </span>
            </div>

            <div className="mt-3 relative inline-block">
              <motion.div
                key={recommendedSize}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-mono font-bold text-amber-500 tracking-tight"
              >
                {recommendedSize}
              </motion.div>
              <div className="absolute -top-1.5 -right-3 bg-emerald-600 text-stone-950 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md">
                {fitPercentage}% Match
              </div>
            </div>
          </div>

          {/* Visual Interactive Schematics (Dynamic SVGs based on user input values) */}
          <div className="py-6 flex justify-center items-center h-48 bg-stone-900/40 rounded border border-stone-850/50 my-4">
            
            {activeCategory === 'jackets' && (
              <svg className="w-36 h-36 text-stone-600" viewBox="0 0 100 100" fill="none">
                {/* Torso Outline */}
                <path d="M25,20 C35,15 65,15 75,20 L80,38 L72,42 L72,85 C72,87 68,90 60,90 L40,90 C32,90 28,87 28,85 L28,42 L20,38 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                {/* Collar */}
                <path d="M40,17 L50,26 L60,17" stroke="currentColor" strokeWidth="1.5" />
                <path d="M40,17 C45,21 55,21 60,17" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                {/* Interactive Chest highlight line */}
                <g className="animate-pulse">
                  <path d="M30,45 L70,45" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="30" cy="45" r="2.5" fill="#f59e0b" />
                  <circle cx="70" cy="45" r="2.5" fill="#f59e0b" />
                  <text x="50" y="40" textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="monospace" fontWeight="bold">
                    CHEST: {chest}{unit}
                  </text>
                </g>
                {/* Interactive Sleeve highlight line */}
                <g>
                  <path d="M75,20 L80,38 L75,56" stroke={sleeve > 32 ? '#f59e0b' : 'currentColor'} strokeWidth="1.5" strokeDasharray="1,1" />
                  <text x="83" y="32" fill="#a8a29e" fontSize="5" fontFamily="monospace">
                    SLEEVE
                  </text>
                </g>
              </svg>
            )}

            {activeCategory === 'shoes' && (
              <svg className="w-36 h-36 text-stone-600" viewBox="0 0 120 120" fill="none">
                {/* Outer sizing contour bounds */}
                <rect x="15" y="15" width="90" height="90" rx="4" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                {/* Foot outline blueprint style */}
                <path 
                  d="M45,25 C45,20 52,18 60,22 C68,26 73,32 75,40 C77,48 76,55 72,62 C68,69 66,74 68,82 C70,90 68,95 60,96 C52,97 48,93 46,88 C44,83 48,77 48,72 C48,67 43,60 41,52 C39,44 41,36 45,25 Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  fill="url(#footGrad)" 
                />
                <defs>
                  <radialGradient id="footGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#1c1917" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Toes details */}
                <circle cx="58" cy="24" r="3" fill="currentColor" opacity="0.3" />
                <circle cx="64" cy="27" r="2.5" fill="currentColor" opacity="0.3" />
                <circle cx="69" cy="31" r="2" fill="currentColor" opacity="0.3" />
                <circle cx="73" cy="36" r="1.5" fill="currentColor" opacity="0.3" />
                <circle cx="76" cy="42" r="1.2" fill="currentColor" opacity="0.3" />
                {/* Foot length interactive line with ticks */}
                <g className="animate-pulse">
                  <path d="M60,18 L60,98" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,3" />
                  <line x1="56" y1="18" x2="64" y2="18" stroke="#f59e0b" strokeWidth="2" />
                  <line x1="56" y1="98" x2="64" y2="98" stroke="#f59e0b" strokeWidth="2" />
                  <text x="65" y="58" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {footLength} {unit}
                  </text>
                </g>
              </svg>
            )}

            {activeCategory === 'belts' && (
              <svg className="w-48 h-24 text-stone-600" viewBox="0 0 160 80" fill="none">
                {/* Belt strap */}
                <rect x="15" y="32" width="130" height="16" rx="3" fill="#1c1917" stroke="currentColor" strokeWidth="1.5" />
                {/* Belt buckle */}
                <rect x="15" y="26" width="16" height="28" rx="2" fill="#78716c" stroke="#d6d3d1" strokeWidth="1.5" />
                {/* Buckle pin */}
                <line x1="23" y1="32" x2="31" y2="40" stroke="#d6d3d1" strokeWidth="2.5" strokeLinecap="round" />
                {/* Belt holes */}
                <circle cx="70" cy="40" r="1.5" fill="#0c0a09" stroke="#78716c" strokeWidth="0.5" />
                <circle cx="82" cy="40" r="1.5" fill="#0c0a09" stroke="#78716c" strokeWidth="0.5" />
                <circle cx="94" cy="40" r="1.5" fill="#0c0a09" stroke="#78716c" strokeWidth="0.5" />
                <circle cx="106" cy="40" r="1.5" fill="#0c0a09" stroke="#78716c" strokeWidth="0.5" />
                <circle cx="118" cy="40" r="1.5" fill="#0c0a09" stroke="#78716c" strokeWidth="0.5" />
                {/* Fastened highlight hole */}
                <g className="animate-pulse">
                  <circle cx="94" cy="40" r="3" fill="#f59e0b" />
                  <path d="M94,22 L94,34" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                  <polygon points="94,36 91,32 97,32" fill="#f59e0b" />
                  <text x="94" y="16" textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="monospace" fontWeight="bold">
                    CENTER HOLE: SIZE {recommendedSize}
                  </text>
                </g>
              </svg>
            )}

          </div>

          {/* Explanation paragraph */}
          <div className="bg-stone-900/60 border border-stone-850/60 rounded p-3 text-xs leading-relaxed text-stone-300 min-h-[70px]">
            <p className="flex gap-2">
              <ThumbsUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{currentLang === 'en' ? explanation : explanationAm}</span>
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="mt-6 space-y-3">
            {isSizeAvailable ? (
              <button
                type="button"
                onClick={() => {
                  onApplySize(recommendedSize);
                  onClose();
                }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-sans font-bold text-xs uppercase py-3 rounded-md transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/10 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {currentLang === 'en' 
                    ? `Apply Recommended Size (${recommendedSize})` 
                    : `የሚመከር መጠን ተጠቀም (${recommendedSize})`}
                </span>
              </button>
            ) : (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded text-center text-xs font-mono">
                {currentLang === 'en' 
                  ? `Sorry, size ${recommendedSize} is currently unavailable for this product.` 
                  : `ይቅርታ፣ የጫማ/ቀበቶ መጠን ${recommendedSize} በአሁኑ ወቅት በዚህ እቃ ላይ አይገኝም።`}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
