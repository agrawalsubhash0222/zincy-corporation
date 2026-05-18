import React from 'react';
import { Dimensions, View } from 'react-native';

import {
    BarChart3,
    BriefcaseBusiness,
    Globe,
    Megaphone,
    MonitorSmartphone,
    ReceiptIndianRupee,
    Search,
    Settings2,
    Smartphone,
    Users,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;

const size = isMobile ? 34 : 42;

const iconColor = '#1B6BFF';

const boxStyle = {
    width: isMobile ? 82 : 96,
    height: isMobile ? 82 : 96,

    borderRadius: 24,

    backgroundColor: '#EEF6FF',

    alignItems: 'center' as const,
    justifyContent: 'center' as const,

    position: 'relative' as const,
};

const dotStyle = {
    position: 'absolute' as const,

    width: 12,
    height: 12,

    borderRadius: 6,

    backgroundColor: '#FFD33D',
};

export const SolutionImages = {
    mobile: (
        <View style={boxStyle}>
            <Smartphone size={size} color={iconColor} strokeWidth={2.5} />

            <View
                style={[
                    dotStyle,
                    {
                        top: 10,
                        right: 10,
                    },
                ]}
            />
        </View>
    ),

    web: (
        <View style={boxStyle}>
            <Globe size={size} color={iconColor} strokeWidth={2.5} />

            <View
                style={[
                    dotStyle,
                    {
                        bottom: 12,
                        left: 12,
                    },
                ]}
            />
        </View>
    ),

    billing: (
        <View style={boxStyle}>
            <ReceiptIndianRupee
                size={size}
                color={iconColor}
                strokeWidth={2.5}
            />

            <View
                style={[
                    dotStyle,
                    {
                        top: 12,
                        right: 12,
                    },
                ]}
            />
        </View>
    ),

    crm: (
        <View style={boxStyle}>
            <Users size={size} color={iconColor} strokeWidth={2.5} />
        </View>
    ),

    erp: (
        <View style={boxStyle}>
            <BriefcaseBusiness
                size={size}
                color={iconColor}
                strokeWidth={2.5}
            />
        </View>
    ),

    software: (
        <View style={boxStyle}>
            <MonitorSmartphone
                size={size}
                color={iconColor}
                strokeWidth={2.5}
            />
        </View>
    ),

    seo: (
        <View style={boxStyle}>
            <Search size={size} color={iconColor} strokeWidth={2.5} />
        </View>
    ),

    ads: (
        <View style={boxStyle}>
            <Megaphone size={size} color={iconColor} strokeWidth={2.5} />
        </View>
    ),

    marketing: (
        <View style={boxStyle}>
            <BarChart3 size={size} color={iconColor} strokeWidth={2.5} />
        </View>
    ),

    custom: (
        <View style={boxStyle}>
            <Settings2 size={size} color={iconColor} strokeWidth={2.5} />
        </View>
    ),
};