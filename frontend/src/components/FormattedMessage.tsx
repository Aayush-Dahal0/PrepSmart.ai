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

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (currentList.length > 0) {
          flushList();
        }
        return;
      }

      // Handle score pattern
      const scoreMatch = trimmedLine.match(/\*\*Score:\s*(\d+(?:\.\d+)?\/\d+)\*\*/);
      if (scoreMatch) {
        flushList();
        const [, score] = scoreMatch;
        const [current, total] = score.split('/').map(Number);
        const percentage = (current / total) * 100;
        
        elements.push(
          <div key={`score-${index}`} className="my-6 p-4 bg-gradient-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Your Score</span>
              </div>
              <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                {score}
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
        const [, , content] = listMatch;
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