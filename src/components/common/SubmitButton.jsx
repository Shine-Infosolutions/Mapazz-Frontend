import React from 'react';
import { useFormSubmission } from '../../hooks/useFormSubmission';

const SubmitButton = ({ 
  onSubmit, 
  children = "Submit", 
  confirmMessage,
  buttonType = "submit",
  className = "",
  disabled = false,
  ...props 
}) => {
  const { handleSubmit, isSubmitting } = useFormSubmission();

  const getDefaultMessage = () => {
    switch(buttonType) {
      case 'create': return 'Do you want to create again?';
      case 'update': return 'Do you want to update again?';
      case 'add': return 'Do you want to add again?';
      case 'stay': return 'Do you want to stay and resubmit?';
      default: return 'Do you want to resubmit?';
    }
  };

  const getLoadingText = () => {
    switch(buttonType) {
      case 'create': return 'Creating...';
      case 'update': return 'Updating...';
      case 'add': return 'Adding...';
      case 'stay': return 'Processing...';
      default: return 'Submitting...';
    }
  };

  const onClick = () => {
    handleSubmit(onSubmit, confirmMessage || getDefaultMessage());
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className={`${className} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isSubmitting ? getLoadingText() : children}
    </button>
  );
};

export default SubmitButton;

// Quick button variants
export const CreateButton = (props) => <SubmitButton buttonType="create" {...props} />;
export const UpdateButton = (props) => <SubmitButton buttonType="update" {...props} />;
export const AddButton = (props) => <SubmitButton buttonType="add" {...props} />;
export const StayButton = (props) => <SubmitButton buttonType="stay" {...props} />;