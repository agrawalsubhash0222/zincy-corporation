import { Dimensions, StyleSheet } from 'react-native';

import { buttonStyles } from './button.styles';
import { heroStyles } from './hero.styles';
import { mobileMenuStyles } from './mobileMenu.styles';
import { navbarStyles } from './navbar.styles';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        marginTop: 0,
    },

    backgroundImage: {
        flex: 1,
        width: '100%',
        minHeight: height,
    },

    overlay: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
    },

    ...navbarStyles,
    ...mobileMenuStyles,
    ...heroStyles,
    ...buttonStyles,
});