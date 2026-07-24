import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export type ClientSetupData = {
    onboardingRequestId: number | null;

    businessName: string;

    ownerName: string;
    ownerContact: string;
    ownerEmail: string;
    secondaryContact: string;

    contacts: string[];
    whatsappContact: string;
    email: string;
    businessType: string;
    businessLogo: string;

    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;

    gstRegistered: string;
    gstNumber: string;
    panNumber: string;
    msmeNumber: string;
    fssaiNumber: string;
};

type ClientSetupContextValue = {
    data: ClientSetupData;
    updateData: (
        values: Partial<ClientSetupData>,
    ) => void;
    resetData: () => void;
};

const createInitialData = (): ClientSetupData => ({
    onboardingRequestId: null,

    businessName: '',

    ownerName: '',
    ownerContact: '',
    ownerEmail: '',
    secondaryContact: '',

    contacts: [],
    whatsappContact: '',
    email: '',
    businessType: '',
    businessLogo: '',

    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',

    gstRegistered: '',
    gstNumber: '',
    panNumber: '',
    msmeNumber: '',
    fssaiNumber: '',
});

const ClientSetupContext =
    createContext<ClientSetupContextValue | undefined>(
        undefined,
    );

type ClientSetupProviderProps = {
    children: React.ReactNode;
};

export function ClientSetupProvider({
    children,
}: ClientSetupProviderProps) {
    const [data, setData] = useState<ClientSetupData>(
        createInitialData,
    );

    const updateData = useCallback(
        (values: Partial<ClientSetupData>) => {
            setData((currentData) => ({
                ...currentData,
                ...values,
            }));
        },
        [],
    );

    const resetData = useCallback(() => {
        setData(createInitialData());
    }, []);

    const contextValue = useMemo(
        () => ({
            data,
            updateData,
            resetData,
        }),
        [data, updateData, resetData],
    );

    return (
        <ClientSetupContext.Provider
            value={contextValue}
        >
            {children}
        </ClientSetupContext.Provider>
    );
}

export function useClientSetup(): ClientSetupContextValue {
    const context = useContext(ClientSetupContext);

    if (!context) {
        throw new Error(
            'useClientSetup must be used inside ClientSetupProvider',
        );
    }

    return context;
}