import { useState, useEffect } from 'react';

export function useTypewriter(texts: string[], typingSpeed = 50, deletingSpeed = 30, pauseDuration = 2000) {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPaused) {
      timer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timer);
    }

    const currentText = texts[loopNum % texts.length];

    if (isDeleting) {
      timer = setTimeout(() => {
        setText(currentText.substring(0, text.length - 1));
      }, deletingSpeed);
    } else {
      timer = setTimeout(() => {
        setText(currentText.substring(0, text.length + 1));
      }, typingSpeed);
    }

    if (!isDeleting && text === currentText) {
      setIsPaused(true);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, isPaused, texts, typingSpeed, deletingSpeed, pauseDuration]);

  return text;
}
