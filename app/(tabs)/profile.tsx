import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  User,
  Settings,
  Bell,
  CircleHelp as HelpCircle,
  LogOut,
  Moon,
  Globe,
  Shield,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radii, font } from '@/components/ui/theme';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/'); // Redirect to login (AuthScreen)
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: <Settings size={20} color={colors.primary} />,
      title: 'Account Settings',
      subtitle: 'Update your profile and preferences',
      onPress: () => Alert.alert('Settings', 'Settings feature coming soon!'),
    },
    {
      icon: <Bell size={20} color={colors.secondary} />,
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () =>
        Alert.alert('Notifications', 'Notification settings coming soon!'),
    },
    {
      icon: <Moon size={20} color={colors.accent} />,
      title: 'Dark Mode',
      subtitle: 'Toggle between light and dark themes',
      onPress: () => Alert.alert('Dark Mode', 'Theme switching coming soon!'),
    },
    {
      icon: <Globe size={20} color={colors.warning} />,
      title: 'Language',
      subtitle: 'Choose your preferred language',
      onPress: () => Alert.alert('Language', 'Language selection coming soon!'),
    },
    {
      icon: <Shield size={20} color={colors.secondary} />,
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
    },
    {
      icon: <HelpCircle size={20} color={colors.primary} />,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help', 'Help center coming soon!'),
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary as [string, string]}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={colors.gradientPrimary as [string, string]}
                style={styles.avatarGradient}
              >
                <User size={32} color={colors.white} />
              </LinearGradient>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.user_metadata?.name || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card>
        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              style={styles.menuItem}
            >
              <Card style={styles.menuCard}>
                <View style={styles.menuContent}>
                  <View style={styles.menuIcon}>{item.icon}</View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            style={styles.signOutButton}
          />
        </View>
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MrSplit v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: '800',
    color: colors.white,
  },
  userCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: font.size.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: font.size.md,
    color: colors.textSecondary,
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    marginBottom: spacing.sm,
  },
  menuCard: {
    marginBottom: 0,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: font.size.md,
    fontWeight: '700',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: font.size.sm,
    color: colors.textSecondary,
  },
  signOutContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  signOutButton: {
    borderRadius: radii.lg,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  versionText: {
    color: colors.textTertiary,
    fontSize: font.size.sm,
    fontWeight: '500',
  },
});
