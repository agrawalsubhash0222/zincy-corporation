import React, { createContext, useContext, useState } from 'react';

export type OnboardingData = {
    businessName: string;
    ownerName: string;
    mobile: string;
    email: string;
    projectTypes: string[];
    requirement: string;
    budget: string;
    timeline: string;
};

const initialData: OnboardingData = {
    businessName: '',
    ownerName: '',
    mobile: '',
    email: '',
    projectTypes: [],
    requirement: '',
    budget: '',
    timeline: '',
};

type OnboardingContextType = {
    data: OnboardingData;
    updateData: (values: Partial<OnboardingData>) => void;
    resetData: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<OnboardingData>(initialData);

    const updateData = (values: Partial<OnboardingData>) => {
        setData((prev) => ({
            ...prev,
            ...values,
        }));
    };

    const resetData = () => {
        setData(initialData);
    };

    return (
        <OnboardingContext.Provider value={{ data, updateData, resetData }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);

    if (!context) {
        throw new Error('useOnboarding must be used inside OnboardingProvider');
    }

    return context;
}