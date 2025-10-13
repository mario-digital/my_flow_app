'use client';

import { useState, type ReactElement } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WelcomeStep } from './welcome-step';
import { CreateContextStep } from './create-context-step';
import { SampleDataStep } from './sample-data-step';
import { cn } from '@/lib/utils';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps): ReactElement {
  const [currentStep, setCurrentStep] = useState(1);
  const [contextName, setContextName] = useState('Work');
  const [contextIcon, setContextIcon] = useState('💼');
  const [contextColor, setContextColor] = useState('#3b82f6');
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);

  const totalSteps = 3;

  const handleNext = (): void => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = (): void => {
    // Mark onboarding as seen
    localStorage.setItem('has_seen_onboarding', 'true');
    onClose();
  };

  const handleCreateSampleData = async (): Promise<void> => {
    setIsCreatingSampleData(true);
    try {
      // Call API to create sample contexts and flows
      const response = await fetch('/api/onboarding/sample-data', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create sample data');
      }

      // Mark onboarding as seen
      localStorage.setItem('has_seen_onboarding', 'true');

      // Complete onboarding
      onComplete();
    } catch (error) {
      console.error('Error creating sample data:', error);
      // Show error state (handled in parent)
    } finally {
      setIsCreatingSampleData(false);
    }
  };

  const handleStartFresh = async (): Promise<void> => {
    // Create the single context user configured
    try {
      const response = await fetch('/api/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: contextName,
          icon: contextIcon,
          color: contextColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create context');
      }

      // Mark onboarding as seen
      localStorage.setItem('has_seen_onboarding', 'true');

      // Complete onboarding
      onComplete();
    } catch (error) {
      console.error('Error creating context:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent
        className="
        bg-modal-bg
        border border-modal-border
        rounded-modal
        shadow-modal
        p-6
        max-w-[560px] w-full
        animate-scale-fade-in
      "
      >
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">
          {currentStep === 1 && 'Welcome to My Flow'}
          {currentStep === 2 && 'Create Your First Context'}
          {currentStep === 3 && 'Choose Your Starting Point'}
        </DialogTitle>

        {/* Accessible description for screen readers */}
        <DialogDescription className="sr-only">
          {currentStep === 1 &&
            "Organize your life with contexts and flows. Let's get you started!"}
          {currentStep === 2 &&
            'Set up your first context with a name, emoji, and color'}
          {currentStep === 3 &&
            'Choose to start with sample data or create your own from scratch'}
        </DialogDescription>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="
            absolute right-4 top-4
            w-8 h-8
            flex items-center justify-center
            rounded-md
            text-text-muted
            transition-colors duration-fast
            hover:text-text-primary
            hover:bg-bg-tertiary
          "
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-normal',
                  i < currentStep ? 'bg-context' : 'bg-bg-tertiary'
                )}
              />
            ))}
          </div>
          <p className="text-tiny text-text-muted text-center mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && <WelcomeStep />}

          {currentStep === 2 && (
            <CreateContextStep
              contextName={contextName}
              contextIcon={contextIcon}
              contextColor={contextColor}
              onContextNameChange={setContextName}
              onContextIconChange={setContextIcon}
              onContextColorChange={setContextColor}
            />
          )}

          {currentStep === 3 && (
            <SampleDataStep
              onCreateSampleData={() => void handleCreateSampleData()}
              onStartFresh={() => void handleStartFresh()}
            />
          )}
        </div>

        {/* Footer */}
        {currentStep < 3 && (
          <DialogFooter className="flex gap-3 justify-between mt-6">
            <div className="flex gap-3">
              {/* Back button (secondary) */}
              {currentStep > 1 && (
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              )}

              {/* Skip button (secondary) */}
              <Button variant="secondary" onClick={handleSkip}>
                Skip
              </Button>
            </div>

            {/* Next button (primary) */}
            <Button
              onClick={handleNext}
              disabled={currentStep === 2 && !contextName.trim()}
            >
              {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
            </Button>
          </DialogFooter>
        )}

        {/* Loading state for sample data creation */}
        {isCreatingSampleData && (
          <div className="absolute inset-0 bg-modal-bg/80 flex items-center justify-center rounded-modal">
            <div className="text-center space-y-3">
              <div className="animate-spin w-8 h-8 border-4 border-context border-t-transparent rounded-full mx-auto" />
              <p className="text-base text-text-primary">
                Creating your sample data...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
