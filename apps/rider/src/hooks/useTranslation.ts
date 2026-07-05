import { useAppStore } from '../stores/app-store';

const translations: Record<string, { en: string; kn: string }> = {
  'home.title': { en: 'Namma Ride', kn: 'ನಮ್ಮ ರೈಡ್' },
  'home.whereTo': { en: 'Where to?', kn: 'ಎಲ್ಲಿಗೆ?' },
  'home.pickup': { en: 'Current location', kn: 'ಪ್ರಸ್ತುತ ಸ್ಥಳ' },
  'home.drop': { en: 'Where are you going?', kn: 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?' },
  'home.searching': { en: 'Finding nearby drivers...', kn: 'ಹತ್ತಿರದ ಚಾಲಕರನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...' },
  'home.cancel': { en: 'Cancel', kn: 'ರದ್ದುಮಾಡಿ' },
  'home.savedPlaces': { en: 'Saved Places', kn: 'ಉಳಿಸಿದ ಸ್ಥಳಗಳು' },
  'home.recentSearches': { en: 'Recent Searches', kn: 'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು' },
  'home.promotions': { en: 'Promotions', kn: 'ಪ್ರಚಾರಗಳು' },
  'home.wallet': { en: 'Wallet', kn: 'ವಾಲೆಟ್' },
  'home.notifications': { en: 'Notifications', kn: 'ಅಧಿಸೂಚನೆಗಳು' },
  'home.emergency': { en: 'SOS', kn: 'ಎಸ್ಒಎಸ್' },
  'home.profile': { en: 'Profile', kn: 'ಪ್ರೊಫೈಲ್' },

  'booking.selectVehicle': { en: 'Select Vehicle', kn: 'ವಾಹನ ಆಯ್ಕೆಮಾಡಿ' },
  'booking.confirm': { en: 'Confirm Booking', kn: 'ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಿ' },
  'booking.fare': { en: 'Fare Estimate', kn: 'ದರ ಅಂದಾಜು' },
  'booking.schedule': { en: 'Schedule for later', kn: 'ನಂತರಕ್ಕೆ ನಿಗದಿಪಡಿಸಿ' },
  'booking.coupon': { en: 'Apply Coupon', kn: 'ಕೂಪನ್ ಅನ್ವಯಿಸಿ' },
  'booking.eta': { en: 'ETA', kn: 'ಅಂದಾಜು ಸಮಯ' },
  'booking.distance': { en: 'Distance', kn: 'ದೂರ' },
  'booking.capacity': { en: 'Capacity', kn: 'ಸಾಮರ್ಥ್ಯ' },
  'booking.surge': { en: 'Higher demand', kn: 'ಹೆಚ್ಚಿನ ಬೇಡಿಕೆ' },

  'matching.title': { en: 'Finding your ride', kn: 'ನಿಮ್ಮ ರೈಡ್ ಹುಡುಕಲಾಗುತ್ತಿದೆ' },
  'matching.wait': { en: 'Estimated wait', kn: 'ಅಂದಾಜು ಕಾಯುವಿಕೆ' },
  'matching.cancel': { en: 'Cancel booking', kn: 'ಬುಕಿಂಗ್ ರದ್ದುಮಾಡಿ' },
  'matching.retry': { en: 'Retry', kn: 'ಮರುಪ್ರಯತ್ನಿಸಿ' },
  'matching.nearby': { en: 'drivers nearby', kn: 'ಹತ್ತಿರದ ಚಾಲಕರು' },

  'active.call': { en: 'Call', kn: 'ಕರೆ ಮಾಡಿ' },
  'active.chat': { en: 'Chat', kn: 'ಚಾಟ್' },
  'active.share': { en: 'Share Trip', kn: 'ಟ್ರಿಪ್ ಹಂಚಿಕೊಳ್ಳಿ' },
  'active.sos': { en: 'SOS', kn: 'ಎಸ್ಒಎಸ್' },
  'active.otp': { en: 'SHARE OTP WITH DRIVER', kn: 'ಚಾಲಕರೊಂದಿಗೆ OTP ಹಂಚಿಕೊಳ್ಳಿ' },
  'active.payment': { en: 'Proceed to Payment', kn: 'ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ' },

  'history.title': { en: 'Ride History', kn: 'ಸವಾರಿ ಇತಿಹಾಸ' },
  'history.empty': { en: 'No trips yet', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಪ್ರವಾಸಗಳಿಲ್ಲ' },
  'history.filter': { en: 'Filter', kn: 'ಫಿಲ್ಟರ್' },
  'history.repeat': { en: 'Ride Again', kn: 'ಮತ್ತೆ ಸವಾರಿ ಮಾಡಿ' },
  'history.rate': { en: 'Rate Driver', kn: 'ಚಾಲಕರಿಗೆ ರೇಟಿಂಗ್ ನೀಡಿ' },
  'history.tip': { en: 'Tip Driver', kn: 'ಚಾಲಕರಿಗೆ ಟಿಪ್ ನೀಡಿ' },

  'payment.title': { en: 'Payment', kn: 'ಪಾವತಿ' },
  'payment.cash': { en: 'Cash', kn: 'ನಗದು' },
  'payment.upi': { en: 'UPI', kn: 'ಯುಪಿಐ' },
  'payment.wallet': { en: 'Wallet', kn: 'ವಾಲೆಟ್' },
  'payment.applyCoupon': { en: 'Apply Coupon', kn: 'ಕೂಪನ್ ಅನ್ವಯಿಸಿ' },
  'payment.pay': { en: 'Pay', kn: 'ಪಾವತಿಸಿ' },
  'payment.payNow': { en: 'Pay Now', kn: 'ಈಗ ಪಾವತಿಸಿ' },
  'payment.success': { en: 'Payment Successful', kn: 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ' },
  'payment.successMessage': { en: 'Your ride has been paid. Thank you for riding with Namma Ride!', kn: 'ನಿಮ್ಮ ಸವಾರಿಗೆ ಪಾವತಿಸಲಾಗಿದೆ. ನಮ್ಮ ರೈಡ್ ನೊಂದಿಗೆ ಸವಾರಿ ಮಾಡಿದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!' },
  'payment.invoice': { en: 'Download Invoice', kn: 'ಇನ್‌ವಾಯ್ಸ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' },

  'profile.title': { en: 'Profile', kn: 'ಪ್ರೊಫೈಲ್' },
  'profile.rides': { en: 'Rides', kn: 'ಸವಾರಿಗಳು' },
  'profile.distance': { en: 'Distance', kn: 'ದೂರ' },
  'profile.spent': { en: 'Spent', kn: 'ಖರ್ಚು' },
  'profile.settings': { en: 'Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
  'profile.savedPlaces': { en: 'Saved Places', kn: 'ಉಳಿಸಿದ ಸ್ಥಳಗಳು' },
  'profile.payments': { en: 'Payment Methods', kn: 'ಪಾವತಿ ವಿಧಾನಗಳು' },
  'profile.emergency': { en: 'Emergency Contacts', kn: 'ತುರ್ತು ಸಂಪರ್ಕಗಳು' },
  'profile.theme': { en: 'Dark Mode', kn: 'ಡಾರ್ಕ್ ಮೋಡ್' },
  'profile.language': { en: 'Language', kn: 'ಭಾಷೆ' },
  'profile.support': { en: 'Support', kn: 'ಸಹಾಯ' },
  'profile.privacy': { en: 'Privacy Policy', kn: 'ಗೌಪ್ಯತೆ ನೀತಿ' },
  'profile.terms': { en: 'Terms of Service', kn: 'ಸೇವಾ ನಿಯಮಗಳು' },
  'profile.delete': { en: 'Delete Account', kn: 'ಖಾತೆ ಅಳಿಸಿ' },
  'profile.logout': { en: 'Sign Out', kn: 'ನಿರ್ಗಮಿಸಿ' },
  'profile.referral': { en: 'Refer & Earn', kn: 'ಆಮಂತ್ರಿಸಿ ಮತ್ತು ಗಳಿಸಿ' },
  'profile.tier': { en: 'Loyalty Tier', kn: 'ನಿಷ್ಠೆ ಶ್ರೇಣಿ' },
  'profile.wallet': { en: 'Wallet Balance', kn: 'ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್' },

  'sos.title': { en: 'Emergency', kn: 'ತುರ್ತು' },
  'sos.hold': { en: 'Hold 3s to trigger', kn: 'ಪ್ರಚೋದಿಸಲು 3 ಸೆ ಒತ್ತಿ ಹಿಡಿಯಿರಿ' },
  'sos.release': { en: 'Release to cancel', kn: 'ರದ್ದುಮಾಡಲು ಬಿಡುಗಡೆ ಮಾಡಿ' },
  'sos.sent': { en: 'Alert Sent', kn: 'ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ' },
  'sos.police': { en: 'Police', kn: 'ಪೊಲೀಸ್' },
  'sos.ambulance': { en: 'Ambulance', kn: 'ಆಂಬ್ಯುಲೆನ್ಸ್' },
  'sos.contacts': { en: 'Emergency Contacts', kn: 'ತುರ್ತು ಸಂಪರ್ಕಗಳು' },
  'sos.share': { en: 'Share Live Location', kn: 'ಲೈವ್ ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ' },

  'common.loading': { en: 'Loading...', kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' },
  'common.error': { en: 'Something went wrong', kn: 'ಏನೋ ತಪ್ಪಾಗಿದೆ' },
  'common.retry': { en: 'Retry', kn: 'ಮರುಪ್ರಯತ್ನಿಸಿ' },
  'common.empty': { en: 'No data', kn: 'ಮಾಹಿತಿ ಇಲ್ಲ' },
  'common.save': { en: 'Save', kn: 'ಉಳಿಸಿ' },
  'common.cancel': { en: 'Cancel', kn: 'ರದ್ದುಮಾಡಿ' },
  'common.ok': { en: 'OK', kn: 'ಸರಿ' },
  'common.via': { en: 'via', kn: 'ಮೂಲಕ' },
};

export function useTranslation() {
  const language = useAppStore((s) => s.language);

  return {
    t: (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[language];
    },
    language,
    isKannada: language === 'kn',
  };
}
