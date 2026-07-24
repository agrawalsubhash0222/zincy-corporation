import {
    getOnboardingRequests,
    OnboardingRequest,
    OnboardingStatus,
    updateOnboardingRequestStatus,
} from '@/services/onboardingRequestService';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import axios from 'axios';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<OnboardingStatus, string> = {
    SUBMITTED: 'Submitted',
    REVIEW: 'Review',
    CONTACTED: 'Contacted',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
};

const STATUS_OPTIONS: OnboardingStatus[] = [
    'REVIEW',
    'CONTACTED',
    'APPROVED',
    'REJECTED',
];

const ALLOWED_TRANSITIONS: Record<
    OnboardingStatus,
    OnboardingStatus[]
> = {
    SUBMITTED: ['REVIEW', 'REJECTED'],
    REVIEW: ['CONTACTED', 'REJECTED'],
    CONTACTED: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: [],
};

function normalizeStatus(
    status: string | null | undefined
): OnboardingStatus {
    const normalized = status
        ?.trim()
        .toUpperCase();

    if (normalized === 'PENDING') {
        return 'SUBMITTED';
    }

    if (
        normalized === 'SUBMITTED' ||
        normalized === 'REVIEW' ||
        normalized === 'CONTACTED' ||
        normalized === 'APPROVED' ||
        normalized === 'REJECTED'
    ) {
        return normalized;
    }

    return 'SUBMITTED';
}

function getErrorMessage(
    error: unknown,
    fallback: string
): string {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
            | {
                message?: string;
                detail?: string;
                error?: string;
            }
            | undefined;

        return (
            responseData?.message ||
            responseData?.detail ||
            responseData?.error ||
            error.message ||
            fallback
        );
    }

    if (error instanceof Error) {
        return error.message || fallback;
    }

    return fallback;
}

export default function AdminOnboardingRequestsScreen() {
    const [requests, setRequests] = useState<
        OnboardingRequest[]
    >([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [page, setPage] = useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(requests.length / PAGE_SIZE)
    );

    const paginatedRequests = useMemo(() => {
        const startIndex =
            (page - 1) * PAGE_SIZE;

        return requests.slice(
            startIndex,
            startIndex + PAGE_SIZE
        );
    }, [requests, page]);

    const loadRequests = useCallback(
        async (resetPage = false) => {
            try {
                const data =
                    await getOnboardingRequests();

                if (!Array.isArray(data)) {
                    throw new Error(
                        'The server returned an invalid onboarding request list.'
                    );
                }

                setRequests(data);

                if (resetPage) {
                    setPage(1);
                }
            } catch (error) {
                console.log(
                    'Load onboarding requests error:',
                    error
                );

                Alert.alert(
                    'Unable to load requests',
                    getErrorMessage(
                        error,
                        'Unable to load onboarding requests. Please try again.'
                    )
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    const canChangeStatus = (
        currentStatusValue: string,
        nextStatus: OnboardingStatus
    ): boolean => {
        const currentStatus =
            normalizeStatus(currentStatusValue);

        return ALLOWED_TRANSITIONS[
            currentStatus
        ].includes(nextStatus);
    };

    const updateRequestInList = (
        updatedRequest: OnboardingRequest
    ) => {
        setRequests((currentRequests) =>
            currentRequests.map((request) =>
                request.id === updatedRequest.id
                    ? updatedRequest
                    : request
            )
        );
    };

    const handleStatusChange = (
        item: OnboardingRequest,
        nextStatus: OnboardingStatus
    ) => {
        const currentStatus =
            normalizeStatus(item.status);

        if (
            !canChangeStatus(
                currentStatus,
                nextStatus
            )
        ) {
            Alert.alert(
                'Status change not allowed',
                `Status cannot be changed from ${STATUS_LABEL[currentStatus]
                } to ${STATUS_LABEL[nextStatus]}.`
            );

            return;
        }

        Alert.alert(
            'Update Status',
            `Move this request from ${STATUS_LABEL[currentStatus]
            } to ${STATUS_LABEL[nextStatus]}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            setUpdatingId(item.id);

                            const updatedRequest =
                                await updateOnboardingRequestStatus(
                                    item.id,
                                    nextStatus
                                );

                            updateRequestInList(
                                updatedRequest
                            );

                            Alert.alert(
                                'Status updated',
                                `Request moved to ${STATUS_LABEL[
                                nextStatus
                                ]
                                }.`
                            );
                        } catch (error) {
                            console.log(
                                'Update onboarding status error:',
                                error
                            );

                            Alert.alert(
                                'Unable to update',
                                getErrorMessage(
                                    error,
                                    'Unable to update status. Please try again.'
                                )
                            );

                            /*
                             * Reload because another screen or process
                             * may already have changed the status.
                             */
                            await loadRequests(false);
                        } finally {
                            setUpdatingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleOpenDetails = (
        item: OnboardingRequest
    ) => {
        router.push({
            pathname:
                '/admin/onboarding/onboarding-request-details',
            params: {
                onboardingRequestId: String(item.id),
            },
        });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRequests(true);
    };

    useEffect(() => {
        loadRequests(true);
    }, [loadRequests]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    if (loading) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F8FAFC',
                }}
            >
                <ActivityIndicator
                    size="large"
                    color="#0EA5E9"
                />

                <Text
                    style={{
                        marginTop: 12,
                        color: '#64748B',
                    }}
                >
                    Loading onboarding requests...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
            }}
        >
            <View style={{ padding: 18 }}>
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: '900',
                        color: '#0F172A',
                    }}
                >
                    Onboarding Requests
                </Text>

                <Text
                    style={{
                        marginTop: 4,
                        color: '#64748B',
                    }}
                >
                    Showing {paginatedRequests.length} of{' '}
                    {requests.length} requests
                </Text>
            </View>

            <FlatList
                data={paginatedRequests}
                keyExtractor={(item) =>
                    String(item.id)
                }
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 30,
                    flexGrow:
                        paginatedRequests.length === 0
                            ? 1
                            : undefined,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
                ListEmptyComponent={
                    <View
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 30,
                        }}
                    >
                        <Ionicons
                            name="document-text-outline"
                            size={42}
                            color="#94A3B8"
                        />

                        <Text
                            style={{
                                marginTop: 12,
                                fontSize: 16,
                                fontWeight: '800',
                                color: '#334155',
                            }}
                        >
                            No onboarding requests
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    requests.length > 0 ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent:
                                    'space-between',
                                alignItems: 'center',
                                marginTop: 10,
                                paddingVertical: 12,
                            }}
                        >
                            <TouchableOpacity
                                disabled={page === 1}
                                onPress={() =>
                                    setPage((previous) =>
                                        Math.max(
                                            1,
                                            previous - 1
                                        )
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    backgroundColor:
                                        page === 1
                                            ? '#E2E8F0'
                                            : '#0EA5E9',
                                }}
                            >
                                <Text
                                    style={{
                                        color:
                                            page === 1
                                                ? '#94A3B8'
                                                : '#FFFFFF',
                                        fontWeight: '900',
                                    }}
                                >
                                    Previous
                                </Text>
                            </TouchableOpacity>

                            <Text
                                style={{
                                    fontWeight: '900',
                                    color: '#0F172A',
                                }}
                            >
                                Page {page} of{' '}
                                {totalPages}
                            </Text>

                            <TouchableOpacity
                                disabled={
                                    page === totalPages
                                }
                                onPress={() =>
                                    setPage((previous) =>
                                        Math.min(
                                            totalPages,
                                            previous + 1
                                        )
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    backgroundColor:
                                        page === totalPages
                                            ? '#E2E8F0'
                                            : '#0EA5E9',
                                }}
                            >
                                <Text
                                    style={{
                                        color:
                                            page ===
                                                totalPages
                                                ? '#94A3B8'
                                                : '#FFFFFF',
                                        fontWeight: '900',
                                    }}
                                >
                                    Next
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
                renderItem={({ item }) => {
                    const currentStatus =
                        normalizeStatus(item.status);

                    const isUpdating =
                        updatingId === item.id;

                    const allowedNextStatuses =
                        ALLOWED_TRANSITIONS[
                        currentStatus
                        ];

                    return (
                        <View
                            style={{
                                backgroundColor:
                                    '#FFFFFF',
                                borderRadius: 16,
                                marginBottom: 14,
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                overflow: 'hidden',
                            }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.78}
                                onPress={() =>
                                    handleOpenDetails(item)
                                }
                                style={{
                                    padding: 16,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 10,
                                        alignItems: 'center',
                                    }}
                                >
                                <Ionicons
                                    name="business-outline"
                                    size={22}
                                    color="#411FBC"
                                />

                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 17,
                                        fontWeight: '900',
                                        color: '#0F172A',
                                    }}
                                >
                                    {item.businessName ||
                                        'Unnamed business'}
                                </Text>

                                <Text
                                    style={{
                                        color:
                                            currentStatus ===
                                                'APPROVED'
                                                ? '#15803D'
                                                : currentStatus ===
                                                    'REJECTED'
                                                    ? '#DC2626'
                                                    : '#CA8A04',
                                        fontWeight: '900',
                                    }}
                                >
                                    {
                                        STATUS_LABEL[
                                        currentStatus
                                        ]
                                    }
                                </Text>
                            </View>

                            <Text
                                style={{
                                    marginTop: 10,
                                    color: '#334155',
                                    fontWeight: '700',
                                }}
                            >
                                Owner:{' '}
                                {item.ownerName ||
                                    'Not provided'}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 4,
                                    color: '#475569',
                                }}
                            >
                                Mobile:{' '}
                                {item.mobile ||
                                    'Not provided'}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 4,
                                    color: '#475569',
                                }}
                            >
                                Email:{' '}
                                {item.email ||
                                    'Not provided'}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 10,
                                    color: '#475569',
                                }}
                            >
                                Services:{' '}
                                {item.projectTypes ||
                                    'Not provided'}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 6,
                                    color: '#475569',
                                }}
                            >
                                Budget:{' '}
                                {item.budget ||
                                    'Not provided'}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 6,
                                    color: '#475569',
                                }}
                            >
                                Timeline:{' '}
                                {item.timeline ||
                                    'Not provided'}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 10,
                                    color: '#334155',
                                    lineHeight: 20,
                                }}
                            >
                                {item.requirement ||
                                    'No requirement added'}
                            </Text>

                                <View
                                    style={{
                                        marginTop: 14,
                                        minHeight: 44,
                                        paddingHorizontal: 13,
                                        borderRadius: 12,
                                        backgroundColor:
                                            '#EFF6FF',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name="eye-outline"
                                        size={18}
                                        color="#0369A1"
                                    />

                                    <Text
                                        style={{
                                            flex: 1,
                                            marginLeft: 8,
                                            color: '#0369A1',
                                            fontSize: 13,
                                            fontWeight: '900',
                                        }}
                                    >
                                        View full onboarding details
                                    </Text>

                                    <Ionicons
                                        name="chevron-forward"
                                        size={18}
                                        color="#0369A1"
                                    />
                                </View>
                            </TouchableOpacity>

                            <View
                                style={{
                                    height: 1,
                                    backgroundColor:
                                        '#E2E8F0',
                                }}
                            />

                            <View
                                style={{
                                    padding: 16,
                                }}
                            >
                            {allowedNextStatuses.length >
                                0 ? (
                                <>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: '900',
                                            color: '#0F172A',
                                            marginBottom: 10,
                                        }}
                                    >
                                        Change Status
                                    </Text>

                                    <View
                                        style={{
                                            flexDirection:
                                                'row',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                        }}
                                    >
                                        {STATUS_OPTIONS.map(
                                            (status) => {
                                                const allowed =
                                                    allowedNextStatuses.includes(
                                                        status
                                                    );

                                                const disabled =
                                                    isUpdating ||
                                                    !allowed;

                                                return (
                                                    <TouchableOpacity
                                                        key={
                                                            status
                                                        }
                                                        activeOpacity={
                                                            0.85
                                                        }
                                                        disabled={
                                                            disabled
                                                        }
                                                        onPress={() =>
                                                            handleStatusChange(
                                                                item,
                                                                status
                                                            )
                                                        }
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 9,
                                                            borderRadius: 999,
                                                            backgroundColor:
                                                                disabled
                                                                    ? '#F1F5F9'
                                                                    : status ===
                                                                        'REJECTED'
                                                                        ? '#DC2626'
                                                                        : '#1D8F50',
                                                            borderWidth: 1,
                                                            borderColor:
                                                                disabled
                                                                    ? '#CBD5E1'
                                                                    : status ===
                                                                        'REJECTED'
                                                                        ? '#DC2626'
                                                                        : '#1D8F50',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight:
                                                                    '900',
                                                                color:
                                                                    disabled
                                                                        ? '#94A3B8'
                                                                        : '#FFFFFF',
                                                            }}
                                                        >
                                                            {
                                                                STATUS_LABEL[
                                                                status
                                                                ]
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                        )}
                                    </View>
                                </>
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: '800',
                                        color: '#64748B',
                                    }}
                                >
                                    This request has reached a
                                    final status.
                                </Text>
                            )}

                            {isUpdating && (
                                <View
                                    style={{
                                        marginTop: 12,
                                        flexDirection:
                                            'row',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <ActivityIndicator
                                        size="small"
                                        color="#0EA5E9"
                                    />

                                    <Text
                                        style={{
                                            color: '#64748B',
                                            fontSize: 12,
                                        }}
                                    >
                                        Updating status...
                                    </Text>
                                </View>
                            )}
                            </View>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
}