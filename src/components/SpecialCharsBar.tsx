import './SpecialCharsBar.css';

export interface SpecialCharsBarProps {
  onCharacterClick: (char: string) => void;
}

export const SpecialCharsBar: React.FC<SpecialCharsBarProps> = ({ onCharacterClick }) => {
  // Common special characters organized by category
  const specialChars = [
    // Brackets and parentheses
    '(', ')', '[', ']', '{', '}', '<', '>',
    // Quotes and punctuation
    '"', "'", '`', ',', '.', ';', ':', '!', '?',
    // Math and symbols
    '+', '-', '*', '/', '=', '%', '&', '|', '^', '~',
    // Other common symbols
    '@', '#', '$', '_', '\\', '/', '|',
  ];

  return (
    <div className="special-chars-bar">
      <div className="special-chars-container">
        {specialChars.map((char, index) => (
          <button
            key={index}
            className="special-char-button"
            onClick={() => onCharacterClick(char)}
            title={`Insert ${char}`}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
};
