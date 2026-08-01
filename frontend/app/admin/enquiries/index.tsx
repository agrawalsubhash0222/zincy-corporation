import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    getAdminEnquiries,
    updateEnquiryStatus,
} from '@/services/enquiryService';

type Enquiry = {
    id: number;
    fullName: string;
    mobileNumber: string;
    email?: string;
    lookingFor: string;
    message?: string;
    status: 'NEW' | 'CONTACTED' | 'CLOSED';
    createdAt: string;
};

const FILTERS = ['ALL', 'NEW', 'CONTACTED', 'CLOSED'] as const;

export default function AdminEnquiriesScreen() {
    const [items, setItems] = useState<Enquiry[]>([]);
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const data = await getAdminEnquiries();
            setItems(data || []);
        } catch (error) {
            console.log('Load enquiries error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredItems = useMemo(() => {
        if (filter === 'ALL') return items;
        return items.filter(item => item.status === filter);
    }, [items, filter]);

    const count = (status: string) =>
        status === 'ALL'
            ? items.length
            : items.filter(i => i.status === status).length;

    const openDialer = (mobile: string) => {
        if (!mobile) return;
        Linking.openURL(`tel:${mobile}`);
    };

    const changeStatus = async (id: number, status: Enquiry['status']) => {
        try {
            await updateEnquiryStatus(id, status);
            setItems(prev =>
                prev.map(item => (item.id === id ? { ...item, status } : item))
            );
        } catch (error) {
            console.log('Update enquiry status error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading enquiries...</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#071B34" />
                </TouchableOpacity>

                <View>
                    <Text style={styles.title}>Enquiries</Text>
                    <Text style={styles.subtitle}>Website enquiry submissions</Text>
                </View>
            </View>

            <View style={styles.filters}>
                {FILTERS.map(item => (
                    <Pressable
                        key={item}
                        style={[styles.chip, filter === item && styles.chipActive]}
                        onPress={() => setFilter(item)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                filter === item && styles.chipTextActive,
                            ]}
                        >
                            {item} ({count(item)})
                        </Text>
                    </Pressable>
                ))}
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadData();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="mail-open-outline" size={44} color="#94A3B8" />
                        <Text style={styles.emptyText}>No enquiries found</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const isClosed = item.status === 'CLOSED';

                    return (
                        <View style={[styles.card, isClosed && styles.closedCard]}>
                            <View style={styles.cardTop}>
                                <View style={[styles.avatar, isClosed && styles.closedAvatar]}>
                                    <Text style={styles.avatarText}>
                                        {item.fullName?.charAt(0)?.toUpperCase() || 'E'}
                                    </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.name, isClosed && styles.disabledText]}>
                                        {item.fullName}
                                    </Text>

                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        disabled={isClosed}
                                        onPress={() => openDialer(item.mobileNumber)}
                                    >
                                        <Text
                                            style={[
                                                styles.mobile,
                                                !isClosed && styles.mobileLink,
                                                isClosed && styles.disabledText,
                                            ]}
                                        >
                                            {item.mobileNumber}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text
                                    style={[
                                        styles.status,
                                        item.status === 'CONTACTED' && styles.contactedStatus,
                                        item.status === 'CLOSED' && styles.closedStatus,
                                    ]}
                                >
                                    {item.status}
                                </Text>
                            </View>

                            {!!item.email && (
                                <Text style={[styles.text, isClosed && styles.disabledText]}>
                                    Email: {item.email}
                                </Text>
                            )}

                            <Text style={styles.label}>Looking For</Text>
                            <Text style={[styles.text, isClosed && styles.disabledText]}>
                                {item.lookingFor}
                            </Text>

                            {!!item.message && (
                                <>
                                    <Text style={styles.label}>Message</Text>
                                    <Text style={[styles.message, isClosed && styles.disabledText]}>
                                        {item.message}
                                    </Text>
                                </>
                            )}

                            <Text style={styles.date}>
                                Submitted: {new Date(item.createdAt).toLocaleDateString()}
                            </Text>

                            {!isClosed && (
                                <View style={styles.actions}>
                                    {item.status === 'NEW' && (
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => changeStatus(item.id, 'CONTACTED')}
                                        >
                                            <Text style={styles.actionText}>Contacted</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.closeBtn]}
                                        onPress={() => changeStatus(item.id, 'CLOSED')}
                                    >
                                        <Text style={styles.closeText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 10, color: '#64748B', fontWeight: '700' },

    header: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 24, fontWeight: '900', color: '#071B34' },
    subtitle: { color: '#64748B', fontWeight: '600' },

    filters: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 8,
        backgroundColor: '#FFFFFF',
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#F1F5F9',
    },
    chipActive: { backgroundColor: '#071B34' },
    chipText: { color: '#475569', fontWeight: '800', fontSize: 12 },
    chipTextActive: { color: '#FFFFFF' },

    list: { padding: 14, paddingBottom: 30 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    closedCard: {
        backgroundColor: '#F1F5F9',
        opacity: 0.72,
    },

    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 21,
        backgroundColor: '#0284C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    closedAvatar: {
        backgroundColor: '#94A3B8',
    },
    avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
    name: { fontSize: 16, fontWeight: '900', color: '#071B34' },

    mobile: { marginTop: 2, color: '#475569', fontWeight: '700' },
    mobileLink: {
        color: '#0284C7',
        textDecorationLine: 'underline',
    },

    status: {
        backgroundColor: '#d6ecf8',
        color: '#0284C7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: '900',
    },
    contactedStatus: {
        backgroundColor: '#E0F2FE',
        color: '#0284C7',
    },
    closedStatus: {
        backgroundColor: '#E5E7EB',
        color: '#64748B',
    },

    label: {
        marginTop: 10,
        marginBottom: 3,
        color: '#64748B',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    text: { color: '#0F172A', fontWeight: '700' },
    message: { color: '#334155', lineHeight: 21, fontWeight: '600' },
    disabledText: {
        color: '#64748B',
    },
    date: { marginTop: 12, color: '#94A3B8', fontSize: 12, fontWeight: '700' },

    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
    },
    actionText: { color: '#0284C7', fontWeight: '900' },
    closeBtn: { backgroundColor: '#FEE2E2' },
    closeText: { color: '#DC2626', fontWeight: '900' },

    empty: { alignItems: 'center', marginTop: 90 },
    emptyText: { marginTop: 10, color: '#64748B', fontWeight: '800' },
});