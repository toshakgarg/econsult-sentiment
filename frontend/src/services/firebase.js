import { initializeApp } from '@firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let auth

const missingConfiguration = () =>
  [
    ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

const ensureConfigured = () => {
  const missing = missingConfiguration()

  if (missing.length) {
    throw new Error(
      `Missing Firebase configuration. Set ${missing.join(', ')} in frontend/.env.`,
    )
  }
}

const getFirebaseAuth = () => {
  ensureConfigured()
  if (!auth) {
    const app = initializeApp(firebaseConfig)
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  }
  return auth
}

const toUserProfile = (user) =>
  user
    ? {
        id: user.uid,
        name: user.displayName || user.email || 'Authenticated User',
        email: user.email,
      }
    : null

export const subscribeToAuthChanges = (onUser, onError) => {
  if (missingConfiguration().length) {
    onUser(null)
    return () => {}
  }

  try {
    return onAuthStateChanged(
      getFirebaseAuth(),
      (user) => onUser(toUserProfile(user)),
      onError,
    )
  } catch (error) {
    if (!onError) throw error
    onError(error)
    return () => {}
  }
}

export const registerUser = async (email, password) => {
  const firebaseAuth = getFirebaseAuth()
  await setPersistence(firebaseAuth, browserLocalPersistence)
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password)
  return toUserProfile(result.user)
}

export const loginWithEmail = async (email, password) => {
  const firebaseAuth = getFirebaseAuth()
  await setPersistence(firebaseAuth, browserLocalPersistence)
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
  return toUserProfile(result.user)
}

export const loginWithGoogle = async () => {
  const firebaseAuth = getFirebaseAuth()
  await setPersistence(firebaseAuth, browserLocalPersistence)
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(firebaseAuth, provider)
  return toUserProfile(result.user)
}

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(getFirebaseAuth(), email)
}

export const getAuthToken = async () => {
  const user = getFirebaseAuth().currentUser
  if (!user) {
    throw new Error('Authentication is required.')
  }
  return user.getIdToken()
}

export const logoutUser = async () => {
  await signOut(getFirebaseAuth())
}

export const getAuthErrorMessage = (error) => {
  const messages = {
    'auth/account-exists-with-different-credential':
      'This email is already registered with another sign-in method. Sign in using that method; accounts are not linked automatically.',
    'auth/credential-already-in-use':
      'This credential is already linked to another account. Accounts are not linked automatically.',
    'auth/email-already-in-use': 'An account already exists for this email. Sign in instead.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'Unable to reach Firebase. Check your internet connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Authentication.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/unauthorized-domain': 'This site is not authorized in Firebase Authentication settings.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/weak-password': 'The password does not meet the Firebase password policy.',
    'auth/wrong-password': 'The email or password is incorrect.',
  }

  return messages[error?.code] || error?.message || 'Authentication failed. Please try again.'
}
