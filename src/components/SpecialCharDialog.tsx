import React, { useState } from 'react';
import './Dialog.css';
import './SpecialCharDialog.css';

export interface SpecialCharDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterSelect: (char: string) => void;
}

export const SpecialCharDialog: React.FC<SpecialCharDialogProps> = ({
  isOpen,
  onClose,
  onCharacterSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('common');

  if (!isOpen) return null;

  const characterCategories = {
    common: {
      name: 'Common',
      chars: [
        '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+',
        '[', ']', '{', '}', '\\', '|', ';', ':', "'", '"', '<', '>', ',', '.',
        '/', '?', '`', '~'
      ]
    },
    currency: {
      name: 'Currency',
      chars: ['$', '¢', '£', '¥', '€', '₹', '₽', '₩', '₪', '฿', '₦', '₱']
    },
    math: {
      name: 'Math',
      chars: [
        '±', '×', '÷', '=', '≠', '≈', '≤', '≥', '∞', '√', '∑', '∏',
        '∫', '∂', '°', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰',
        '½', '⅓', '⅔', '¼', '¾', '⅛', '⅜', '⅝', '⅞'
      ]
    },
    arrows: {
      name: 'Arrows',
      chars: [
        '←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇑', '⇓', '⇔', '⇕',
        '⤴', '⤵', '↩', '↪', '↺', '↻', '⟲', '⟳'
      ]
    },
    symbols: {
      name: 'Symbols',
      chars: [
        '©', '®', '™', '§', '¶', '†', '‡', '•', '‣', '⁃', '◦',
        '▪', '▫', '◊', '○', '●', '□', '■', '△', '▲', '▽', '▼',
        '◇', '◆', '★', '☆', '♠', '♣', '♥', '♦'
      ]
    },
    punctuation: {
      name: 'Punctuation',
      chars: [
        '‐', '‑', '–', '—', '―', '‖', '‗', '\u2018', '\u2019', '\u201C', '\u201D',
        '‚', '„', '‹', '›', '«', '»', '¡', '¿', '·', '…', '′', '″'
      ]
    },
    greek: {
      name: 'Greek',
      chars: [
        'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
        'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
        'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ',
        'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'
      ]
    },
    accents: {
      name: 'Accents',
      chars: [
        'à', 'á', 'â', 'ã', 'ä', 'å', 'è', 'é', 'ê', 'ë', 'ì', 'í',
        'î', 'ï', 'ò', 'ó', 'ô', 'õ', 'ö', 'ù', 'ú', 'û', 'ü', 'ý',
        'ÿ', 'ñ', 'ç', 'ß', 'æ', 'œ', 'ð', 'þ',
        'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í',
        'Î', 'Ï', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ù', 'Ú', 'Û', 'Ü', 'Ý',
        'Ÿ', 'Ñ', 'Ç'
      ]
    }
  };

  const handleCharClick = (char: string) => {
    onCharacterSelect(char);
    onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog special-char-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Insert Special Character</h2>
          <button className="dialog-close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="dialog-content">
          {/* Category tabs */}
          <div className="char-categories">
            {Object.entries(characterCategories).map(([key, category]) => (
              <button
                key={key}
                className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Character grid */}
          <div className="char-grid">
            {(characterCategories as any)[selectedCategory].chars.map((char: string, index: number) => (
              <button
                key={index}
                className="char-button"
                onClick={() => handleCharClick(char)}
                title={`Insert ${char}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
