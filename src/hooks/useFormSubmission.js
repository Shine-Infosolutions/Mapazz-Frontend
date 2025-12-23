import { useState, useRef } from 'react';

export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTime = useRef(0);

  const handleSubmit = async (submitFunction, confirmMessage = "Do you want to resubmit?") => {
    const now = Date.now();
    
    // Check if double-clicked within 2 seconds
    if (now - lastSubmitTime.current < 2000 && isSubmitting) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }

    lastSubmitTime.current = now;
    setIsSubmitting(true);

    try {
      await submitFunction();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
};