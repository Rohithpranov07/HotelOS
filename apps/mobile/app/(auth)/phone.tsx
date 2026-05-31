import { Redirect } from 'expo-router';

// Legacy phone-OTP entry. Premium login lives at /(auth)/login.
// Kept as a redirect so any deep link or stale route still lands correctly.
export default function PhoneEntryRedirect() {
  return <Redirect href="/(auth)/login" />;
}
