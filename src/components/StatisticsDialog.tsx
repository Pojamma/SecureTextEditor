import './Dialog.css';

export interface StatisticsData {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  sentences: number;
}

export interface StatisticsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: StatisticsData;
}

export const StatisticsDialog: React.FC<StatisticsDialogProps> = ({
  isOpen,
  onClose,
  statistics,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Document Statistics</h2>
          <button className="dialog-close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="dialog-content">
          <div className="statistics-grid">
            <div className="stat-item">
              <span className="stat-label">Characters (with spaces):</span>
              <span className="stat-value">{statistics.characters.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Characters (no spaces):</span>
              <span className="stat-value">{statistics.charactersNoSpaces.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Words:</span>
              <span className="stat-value">{statistics.words.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Lines:</span>
              <span className="stat-value">{statistics.lines.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Paragraphs:</span>
              <span className="stat-value">{statistics.paragraphs.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Sentences:</span>
              <span className="stat-value">{statistics.sentences.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="button button-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
