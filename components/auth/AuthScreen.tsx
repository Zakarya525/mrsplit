import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '@/components/ui/theme';
import { Animated } from 'react-native';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Star,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startInitialAnimations();
    startSparkleAnimation();
    startPulseAnimation();
  }, []);

  useEffect(() => {
    animateFormSwitch();
  }, [isSignUp]);

  const startInitialAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startSparkleAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateFormSwitch = () => {
    Animated.sequence([
      Animated.timing(formSlideAnim, {
        toValue: isSignUp ? -20 : 20,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(switchAnim, {
      toValue: isSignUp ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        Alert.alert('Success', 'Account created successfully!');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Add your Google login implementation here
      // const { error } = await signInWithGoogle();
      // if (error) throw error;

      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert('Coming Soon', 'Google login will be available soon!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    // Clear form when switching
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#667eea']}
        style={styles.backgroundGradient}
      >
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle1,
            {
              transform: [
                {
                  translateY: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle2,
            {
              transform: [
                {
                  translateY: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle3,
            {
              transform: [
                {
                  translateY: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
            },
          ]}
        />
      </LinearGradient>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.iconCircle}
            >
              <Sparkles size={42} color="rgba(255,255,255,0.9)" />
              <Animated.View
                style={[
                  styles.sparkleAccent,
                  {
                    opacity: sparkleAnim,
                    transform: [
                      {
                        rotate: sparkleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Star size={12} color="rgba(255,255,255,0.7)" />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>MrSplit</Text>
          <Text style={styles.subtitle}>
            Split expenses with friends and family
          </Text>
          <View style={styles.titleAccent} />
        </Animated.View>

        {/* Form Container */}
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { translateX: formSlideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <BlurView intensity={20} style={styles.cardBlur}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                style={styles.formCard}
              >
                {/* Form Toggle Header */}
                <View style={styles.formToggleContainer}>
                  <Animated.View
                    style={[
                      styles.toggleIndicator,
                      {
                        left: switchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['2%', '52%'],
                        }),
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      !isSignUp && styles.activeToggle,
                    ]}
                    onPress={() => !loading && setIsSignUp(false)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        !isSignUp && styles.activeToggleText,
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isSignUp && styles.activeToggle,
                    ]}
                    onPress={() => !loading && setIsSignUp(true)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        isSignUp && styles.activeToggleText,
                      ]}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <Animated.View
                  style={[
                    styles.formFields,
                    {
                      transform: [{ translateX: formSlideAnim }],
                    },
                  ]}
                >
                  {isSignUp && (
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIconContainer}>
                        <User size={20} color="#667eea" />
                      </View>
                      <Input
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        autoCapitalize="words"
                        style={styles.input}
                      />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Mail size={20} color="#667eea" />
                    </View>
                    <Input
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#667eea" />
                    </View>
                    <Input
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#8E8E93" />
                      ) : (
                        <Eye size={20} color="#8E8E93" />
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Auth Button */}
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.authButtonGradient}
                  >
                    {loading ? (
                      <Text style={styles.authButtonText}>
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.authButtonText}>
                          {isSignUp ? 'Create Account' : 'Sign In'}
                        </Text>
                        <ArrowRight size={20} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Login */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  disabled={googleLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    style={styles.googleButtonGradient}
                  >
                    <View style={styles.googleIcon}>
                      <Text style={styles.googleIconText}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>
                      {googleLoading ? 'Connecting...' : 'Continue with Google'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch Auth Mode */}
                <Animated.View
                  style={[
                    styles.switchContainer,
                    {
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={toggleAuthMode}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Animated.Text
                      style={[
                        styles.switchText,
                        {
                          transform: [
                            {
                              scale: switchAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [1, 0.95, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {isSignUp
                        ? '✨ Already have an account? Sign In'
                        : '🚀 New user? Create Account'}
                    </Animated.Text>
                    <Animated.View
                      style={[
                        styles.switchArrow,
                        {
                          transform: [
                            {
                              rotate: switchAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '180deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <ArrowRight size={16} color="#667eea" />
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: '20%',
    left: '10%',
  },
  circle2: {
    width: 60,
    height: 60,
    top: '70%',
    right: '15%',
  },
  circle3: {
    width: 40,
    height: 40,
    top: '50%',
    right: '10%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  sparkleAccent: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
  titleAccent: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginTop: 16,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
  },
  formCard: {
    padding: 28,
    borderRadius: 24,
  },
  formToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    width: '46%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  activeToggle: {
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeToggleText: {
    color: '#667eea',
  },
  formFields: {
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    top: 32,
    zIndex: 1,
  },
  input: {
    paddingLeft: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 32,
    padding: 8,
  },
  authButton: {
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  authButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  googleButton: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  googleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    gap: 8,
  },
  switchText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
  },
  switchArrow: {
    marginLeft: 4,
  },
});
