import React, { useState } from 'react';
import { Layers, ChevronDown, Check, BookOpen, Sparkles } from 'lucide-react';
import { PRACTICE_SHEETS, SHEET_CATEGORIES, type PracticeSheet } from '../../data/sheets';

interface SheetSelectorProps {
  selectedSheet: PracticeSheet;
  onSelectSheet: (sheet: PracticeSheet) => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
  selectedSheet,
  onSelectSheet
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} className="text-yellow-400" />
          Select Practice Sheet
        </label>
        <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium border border-yellow-400/20">
          {selectedSheet.questions.length} Problems
        </span>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-700/60 hover:border-yellow-400/50 rounded-xl transition-all duration-300 shadow-lg text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-lg border border-yellow-400/30 text-yellow-400 group-hover:scale-105 transition-transform duration-300">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="font-semibold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-2">
              {selectedSheet.name}
            </div>
            <p className="text-xs text-gray-400 line-clamp-1">
              {selectedSheet.description}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 group-hover:text-yellow-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl shadow-2xl z-30 max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar animate-fadeIn">
            {PRACTICE_SHEETS.map((sheet) => {
              const isSelected = sheet.id === selectedSheet.id;
              return (
                <button
                  key={sheet.id}
                  onClick={() => {
                    onSelectSheet(sheet);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/10 border border-yellow-400/40 text-white'
                      : 'hover:bg-gray-800/60 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {isSelected ? (
                        <Check size={16} className="text-yellow-400" />
                      ) : (
                        <Sparkles size={14} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {sheet.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{sheet.questions.length} questions</span>
                        {sheet.author && (
                          <>
                            <span>•</span>
                            <span>{sheet.author}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                    {sheet.category}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
