import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  // Function to parse and format the message content
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let listCounter = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <div key={`list-${listCounter++}`} className="space-y-3 my-4">
            {currentList.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground mt-0.5">
                  {index + 1}
                </div>
                <div 
                  className="flex-1 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              </div>
            ))}
          </div>
        );
        currentList = [];
      }
    };

    // Helper: look ahead to next non-empty line
    const peekNextNonEmpty = (startIndex: number) => {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const n = lines[i].trim();
        if (n) return n;
      }
      return '';
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (currentList.length > 0) {
          flushList();
        }
        return;
      }

      // Handle score patterns (enhanced):
      //  - "Score: 8/10"
      //  - "Score 8/10"
      //  - "Score" (on its own) and next line starts with "Excellent/Good/Average/Poor/Outstanding"
      //  - "Answer: Good"
      const inlineScore =
        trimmedLine.match(/(?:\*\*)?Score\s*:\s*(\d+(?:\.\d+)?\s*\/\s*\d+)(?:\*\*)?/i) ||
        trimmedLine.match(/(?:\*\*)?Score\s+(\d+(?:\.\d+)?\s*\/\s*\d+)(?:\*\*)?/i) ||
        trimmedLine.match(/(?:\*\*)?Answer\s*:\s*(Excellent|Good|Average|Poor|Outstanding)(?:\*\*)?/i);

      // "Score" header alone:
      const isJustScoreHeader = /^(\*\*)?Score(\*\*)?$/i.test(trimmedLine);

      if (inlineScore || isJustScoreHeader || /^(Score|Answer)\s*(\d+)?/i.test(trimmedLine)) {
        flushList();

        let scoreLabel: string | null = null;

        if (inlineScore) {
          scoreLabel = inlineScore[1]; // either "8/10" OR "Excellent|Good|..."
        } else if (isJustScoreHeader) {
          // Peek next line to infer label
          const next = peekNextNonEmpty(index);
          const nextGrade = next.match(/^(Excellent|Good|Average|Poor|Outstanding)\b/i);
          const nextNumeric = next.match(/(\d+(?:\.\d+)?\s*\/\s*\d+)/);
          if (nextGrade) {
            scoreLabel = nextGrade[1];
          } else if (nextNumeric) {
            scoreLabel = nextNumeric[1];
          } else {
            // Fallback if nothing found
            scoreLabel = 'Excellent';
          }
        } else {
          // Matches "Score" or "Answer" loosely; try to infer from same or next line
          const sameLineGrade = trimmedLine.match(/(Excellent|Good|Average|Poor|Outstanding)/i);
          const sameLineNumeric = trimmedLine.match(/(\d+(?:\.\d+)?\s*\/\s*\d+)/);
          if (sameLineGrade) {
            scoreLabel = sameLineGrade[1];
          } else if (sameLineNumeric) {
            scoreLabel = sameLineNumeric[1];
          } else {
            const next = peekNextNonEmpty(index);
            const nextGrade = next.match(/^(Excellent|Good|Average|Poor|Outstanding)\b/i);
            const nextNumeric = next.match(/(\d+(?:\.\d+)?\s*\/\s*\d+)/);
            scoreLabel = nextGrade?.[1] || nextNumeric?.[1] || 'Excellent';
          }
        }

        let displayText = scoreLabel || 'Excellent';
        let percentage = 85; // reasonable default

        if (displayText && displayText.includes('/')) {
          const [current, total] = displayText.split('/').map(s => Number(String(s).replace(/\s+/g, '')));
          if (!isNaN(current) && !isNaN(total) && total > 0) {
            percentage = Math.max(0, Math.min(100, (current / total) * 100));
          }
        } else if (typeof displayText === 'string') {
          const t = displayText.toLowerCase();
          if (t.includes('outstanding') || t.includes('excellent')) percentage = 90;
          else if (t.includes('good')) percentage = 75;
          else if (t.includes('average')) percentage = 60;
          else if (t.includes('poor')) percentage = 40;
        }

        elements.push(
          <div key={`score-${index}`} className="my-6 p-4 bg-gradient-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Your Score</span>
              </div>
              <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                {displayText}
              </Badge>
              <div className="flex-1 bg-secondary/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
        return;
      }

      // Handle section headers
      const headerMatch = trimmedLine.match(/\*\*(.*?):\*\*/);
      if (headerMatch) {
        flushList();
        const [, headerText] = headerMatch;
        elements.push(
          <div key={`header-${index}`} className="flex items-center gap-2 mt-6 mb-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{headerText}</h3>
          </div>
        );
        return;
      }

      // Handle numbered list items with optional bold formatting
      const listMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
      if (listMatch) {
        const [, /*num*/, content] = listMatch;
        // Check if it has bold title format
        const boldTitleMatch = content.match(/^\*\*(.*?)\*\*:\s*(.*)/);
        if (boldTitleMatch) {
          const [, title, description] = boldTitleMatch;
          currentList.push(
            `<div class="font-semibold text-foreground mb-1">${title}</div><div class="text-muted-foreground">${description}</div>`
          );
        } else {
          // Simple numbered item
          currentList.push(
            `<div class="text-muted-foreground">${content}</div>`
          );
        }
        return;
      }

      // Handle bullet points
      const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.*)/);
      if (bulletMatch) {
        const [, content] = bulletMatch;
        currentList.push(
          `<div class="text-muted-foreground">${content}</div>`
        );
        return;
      }

      // Handle regular bold text
      const boldPattern = /\*\*(.*?)\*\*/g;
      if (boldPattern.test(trimmedLine)) {
        flushList();
        const formattedLine = trimmedLine.replace(boldPattern, '<strong class="font-semibold text-foreground">$1</strong>');
        elements.push(
          <p 
            key={`text-${index}`} 
            className="text-sm leading-relaxed my-2 text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
        return;
      }

      // Handle regular text
      if (trimmedLine && !trimmedLine.match(/^(\d+)\./)) {
        flushList();
        elements.push(
          <p key={`text-${index}`} className="text-sm leading-relaxed my-2 text-muted-foreground">
            {trimmedLine}
          </p>
        );
      }
    });

    // Flush any remaining list items
    flushList();

    return elements;
  };

  return (
    <div className="space-y-2">
      {formatContent(content)}
    </div>
  );
};

export default FormattedMessage;
