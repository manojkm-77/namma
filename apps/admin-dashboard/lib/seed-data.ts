export interface SeedDriver {
  id: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: string;
  licensePlate: string;
  modelName: string;
  city: string;
  isActive: boolean;
  dutyStatus: 'online' | 'offline' | 'busy';
  rating: number;
  isKycVerified: boolean;
  currentLat: number;
  currentLng: number;
  totalRides: number;
  walletBalance: number;
}

export interface SeedRide {
  id: string;
  riderName: string;
  driverName: string | null;
  driverId: string | null;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  fareAmount: number;
  distanceKm: number;
  estimatedDurationMins: number;
  paymentMethod: string;
  paymentStatus: string;
  city: string;
  createdAt: string;
  vehicleType: string;
}

export interface SeedKycApplication {
  id: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: string;
  licensePlate: string;
  modelName: string;
  city: string;
  aadharNumber: string;
  licenseNumber: string;
  submittedAt: string;
}

export interface SeedSupportTicket {
  id: string;
  userName: string;
  userPhone: string;
  category: string;
  issueDescription: string;
  urgency: 'normal' | 'high' | 'sos';
  status: 'open' | 'in_progress' | 'resolved';
  rideId: string | null;
  createdAt: string;
  city: string;
}

export interface SeedPricingConfig {
  city: string;
  auto: { baseFare: number; baseKm: number; perKm: number; nightMult: number };
  mini: { baseFare: number; baseKm: number; perKm: number; nightMult: number };
  sedan: { baseFare: number; baseKm: number; perKm: number; nightMult: number };
  suv: { baseFare: number; baseKm: number; perKm: number; nightMult: number };
}

export const SEED_DRIVERS: SeedDriver[] = [
  { id: 'drv-001', fullName: 'Anil Kumar Gowda', phoneNumber: '+918027451234', vehicleType: 'auto', licensePlate: 'KA-09-A-4432', modelName: 'Bajaj RE Compact', city: 'Mysuru', isActive: true, dutyStatus: 'online', rating: 4.7, isKycVerified: true, currentLat: 12.3051, currentLng: 76.6552, totalRides: 1842, walletBalance: 3450 },
  { id: 'drv-002', fullName: 'Manjunatha S', phoneNumber: '+918027456789', vehicleType: 'sedan', licensePlate: 'KA-03-MB-9081', modelName: 'Maruti Dzire', city: 'Mysuru', isActive: true, dutyStatus: 'online', rating: 4.5, isKycVerified: true, currentLat: 12.3162, currentLng: 76.6436, totalRides: 967, walletBalance: 2100 },
  { id: 'drv-003', fullName: 'Lokesh K', phoneNumber: '+918027453456', vehicleType: 'auto', licensePlate: 'KA-09-A-7891', modelName: 'Bajaj RE Compact', city: 'Mysuru', isActive: true, dutyStatus: 'busy', rating: 4.2, isKycVerified: true, currentLat: 12.3103, currentLng: 76.6601, totalRides: 623, walletBalance: 1820 },
  { id: 'drv-004', fullName: 'Ravi Shankar', phoneNumber: '+918027450987', vehicleType: 'mini', licensePlate: 'KA-09-MX-1234', modelName: 'Tata Tiago', city: 'Mysuru', isActive: false, dutyStatus: 'offline', rating: 4.8, isKycVerified: true, currentLat: 12.2958, currentLng: 76.6394, totalRides: 2104, walletBalance: 5200 },
  { id: 'drv-005', fullName: 'Suresh Hegde', phoneNumber: '+918362347890', vehicleType: 'auto', licensePlate: 'KA-25-A-1122', modelName: 'Bajaj RE Compact', city: 'Mangaluru', isActive: true, dutyStatus: 'online', rating: 4.6, isKycVerified: true, currentLat: 12.8682, currentLng: 74.8437, totalRides: 1523, walletBalance: 2980 },
  { id: 'drv-006', fullName: 'Prakash Shetty', phoneNumber: '+918362341234', vehicleType: 'sedan', licensePlate: 'KA-19-MC-5678', modelName: 'Hyundai Xcent', city: 'Mangaluru', isActive: true, dutyStatus: 'online', rating: 4.4, isKycVerified: false, currentLat: 12.8906, currentLng: 74.8400, totalRides: 445, walletBalance: 890 },
  { id: 'drv-007', fullName: 'Vinayak Bhat', phoneNumber: '+918362345678', vehicleType: 'suv', licensePlate: 'KA-19-MD-9101', modelName: 'Toyota Innova', city: 'Mangaluru', isActive: true, dutyStatus: 'online', rating: 4.9, isKycVerified: true, currentLat: 12.9482, currentLng: 74.8211, totalRides: 3127, walletBalance: 8750 },
  { id: 'drv-008', fullName: 'Basavaraj Patil', phoneNumber: '+918361256789', vehicleType: 'auto', licensePlate: 'KA-25-A-3344', modelName: 'Bajaj RE Compact', city: 'Hubli-Dharwad', isActive: true, dutyStatus: 'busy', rating: 4.1, isKycVerified: true, currentLat: 15.3526, currentLng: 75.1485, totalRides: 789, walletBalance: 1560 },
  { id: 'drv-009', fullName: 'Sharanappa K', phoneNumber: '+918361252345', vehicleType: 'mini', licensePlate: 'KA-10-MX-5566', modelName: 'Renault Kwid', city: 'Hubli-Dharwad', isActive: false, dutyStatus: 'offline', rating: 4.3, isKycVerified: false, currentLat: 15.4589, currentLng: 75.0078, totalRides: 234, walletBalance: 450 },
  { id: 'drv-010', fullName: 'Gururaj Deshpande', phoneNumber: '+918361258901', vehicleType: 'sedan', licensePlate: 'KA-10-MB-7788', modelName: 'Honda Amaze', city: 'Hubli-Dharwad', isActive: true, dutyStatus: 'online', rating: 4.6, isKycVerified: true, currentLat: 15.3647, currentLng: 75.1240, totalRides: 1102, walletBalance: 3200 },
  { id: 'drv-011', fullName: 'Karthik M', phoneNumber: '+918027458888', vehicleType: 'suv', licensePlate: 'KA-09-MD-9900', modelName: 'Mahindra Scorpio', city: 'Mysuru', isActive: true, dutyStatus: 'online', rating: 4.5, isKycVerified: true, currentLat: 12.3000, currentLng: 76.6500, totalRides: 876, walletBalance: 4100 },
  { id: 'drv-012', fullName: 'Santhosh Shetty', phoneNumber: '+918362349999', vehicleType: 'auto', licensePlate: 'KA-19-A-5566', modelName: 'Bajaj RE Compact', city: 'Mangaluru', isActive: false, dutyStatus: 'offline', rating: 4.0, isKycVerified: false, currentLat: 12.8700, currentLng: 74.8500, totalRides: 156, walletBalance: 320 },
];

export const SEED_RIDES: SeedRide[] = [
  { id: 'ride-001', riderName: 'Savitha R', driverName: 'Anil Kumar Gowda', driverId: 'drv-001', status: 'picked_up', pickupAddress: 'KSRTC Suburb Bus Stand, Mysuru', dropAddress: 'Mysore Palace, Mysuru', fareAmount: 75, distanceKm: 3.2, estimatedDurationMins: 12, paymentMethod: 'cash', paymentStatus: 'pending', city: 'Mysuru', createdAt: '2026-07-03T18:15:00Z', vehicleType: 'auto' },
  { id: 'ride-002', riderName: 'Darshan K', driverName: 'Lokesh K', driverId: 'drv-003', status: 'accepted', pickupAddress: 'Mysuru Junction Railway Station', dropAddress: 'Chamundi Hill Temple', fareAmount: 210, distanceKm: 8.5, estimatedDurationMins: 25, paymentMethod: 'upi_direct', paymentStatus: 'pending', city: 'Mysuru', createdAt: '2026-07-03T18:30:00Z', vehicleType: 'auto' },
  { id: 'ride-003', riderName: 'Meghana P', driverName: 'Manjunatha S', driverId: 'drv-002', status: 'completed', pickupAddress: 'Jayalakshmipuram, Mysuru', dropAddress: 'Infosys Campus, Mysuru', fareAmount: 185, distanceKm: 7.8, estimatedDurationMins: 20, paymentMethod: 'wallet', paymentStatus: 'completed', city: 'Mysuru', createdAt: '2026-07-03T17:00:00Z', vehicleType: 'sedan' },
  { id: 'ride-004', riderName: 'Arun Nair', driverName: null, driverId: null, status: 'requested', pickupAddress: 'Mangaluru Central Railway Station', dropAddress: 'Panambur Beach', fareAmount: 160, distanceKm: 6.5, estimatedDurationMins: 18, paymentMethod: 'cash', paymentStatus: 'pending', city: 'Mangaluru', createdAt: '2026-07-03T19:00:00Z', vehicleType: 'auto' },
  { id: 'ride-005', riderName: 'Kavita Shetty', driverName: 'Suresh Hegde', driverId: 'drv-005', status: 'arrived', pickupAddress: 'KSRTC Bus Stand Bejai, Mangaluru', dropAddress: 'City Center Mall, Mangaluru', fareAmount: 95, distanceKm: 3.8, estimatedDurationMins: 10, paymentMethod: 'upi_direct', paymentStatus: 'pending', city: 'Mangaluru', createdAt: '2026-07-03T18:45:00Z', vehicleType: 'auto' },
  { id: 'ride-006', riderName: 'Rohan Desai', driverName: 'Vinayak Bhat', driverId: 'drv-007', status: 'completed', pickupAddress: 'Hubli Railway Station', dropAddress: 'Dharwad New Bus Stand', fareAmount: 280, distanceKm: 12.0, estimatedDurationMins: 30, paymentMethod: 'wallet', paymentStatus: 'completed', city: 'Hubli-Dharwad', createdAt: '2026-07-03T16:30:00Z', vehicleType: 'suv' },
  { id: 'ride-007', riderName: 'Priya Kulkarni', driverName: 'Basavaraj Patil', driverId: 'drv-008', status: 'picked_up', pickupAddress: 'Hubli Railway Station', dropAddress: 'Vidyanagar, Hubli', fareAmount: 65, distanceKm: 2.5, estimatedDurationMins: 8, paymentMethod: 'cash', paymentStatus: 'pending', city: 'Hubli-Dharwad', createdAt: '2026-07-03T18:20:00Z', vehicleType: 'auto' },
  { id: 'ride-008', riderName: 'Naveen G', driverName: 'Gururaj Deshpande', driverId: 'drv-010', status: 'completed', pickupAddress: 'KMF Circle, Hubli', dropAddress: 'Unkal Lake, Hubli', fareAmount: 120, distanceKm: 4.5, estimatedDurationMins: 14, paymentMethod: 'upi_direct', paymentStatus: 'completed', city: 'Hubli-Dharwad', createdAt: '2026-07-03T15:00:00Z', vehicleType: 'sedan' },
  { id: 'ride-009', riderName: 'Aditya Shah', driverName: null, driverId: null, status: 'cancelled', pickupAddress: 'Mysore Palace, Mysuru', dropAddress: 'Mysuru Junction Railway', fareAmount: 55, distanceKm: 1.8, estimatedDurationMins: 6, paymentMethod: 'cash', paymentStatus: 'completed', city: 'Mysuru', createdAt: '2026-07-03T14:00:00Z', vehicleType: 'auto' },
  { id: 'ride-010', riderName: 'Sneha Rao', driverName: 'Karthik M', driverId: 'drv-011', status: 'accepted', pickupAddress: 'Mysuru University Campus', dropAddress: 'Gokulam, Mysuru', fareAmount: 150, distanceKm: 5.8, estimatedDurationMins: 16, paymentMethod: 'wallet', paymentStatus: 'pending', city: 'Mysuru', createdAt: '2026-07-03T19:10:00Z', vehicleType: 'suv' },
];

export const SEED_KYC_APPLICATIONS: SeedKycApplication[] = [
  { id: 'kyc-001', fullName: 'Siddarth Gowda', phoneNumber: '+918027467777', vehicleType: 'auto', licensePlate: 'KA-09-A-5567', modelName: 'Bajaj RE Compact', city: 'Mysuru', aadharNumber: 'XXXX-XXXX-1234', licenseNumber: 'DL-KA0920260014', submittedAt: '2026-07-02T10:30:00Z' },
  { id: 'kyc-002', fullName: 'Mahesh Karkera', phoneNumber: '+918362347777', vehicleType: 'sedan', licensePlate: 'KA-19-MB-3344', modelName: 'Maruti Swift Dzire', city: 'Mangaluru', aadharNumber: 'XXXX-XXXX-5678', licenseNumber: 'DL-KA1920250087', submittedAt: '2026-07-02T14:15:00Z' },
  { id: 'kyc-003', fullName: 'Vijay Patil', phoneNumber: '+918361256666', vehicleType: 'mini', licensePlate: 'KA-10-MX-2233', modelName: 'Tata Tiago', city: 'Hubli-Dharwad', aadharNumber: 'XXXX-XXXX-9012', licenseNumber: 'DL-KA1020260032', submittedAt: '2026-07-03T09:00:00Z' },
  { id: 'kyc-004', fullName: 'Raghuram Bhat', phoneNumber: '+918027455555', vehicleType: 'suv', licensePlate: 'KA-09-MD-4455', modelName: 'Mahindra XUV700', city: 'Mysuru', aadharNumber: 'XXXX-XXXX-3456', licenseNumber: 'DL-KA0920260021', submittedAt: '2026-07-03T11:45:00Z' },
  { id: 'kyc-005', fullName: 'Dinesh Poojary', phoneNumber: '+918362355555', vehicleType: 'auto', licensePlate: 'KA-19-A-7788', modelName: 'Bajaj RE Compact', city: 'Mangaluru', aadharNumber: 'XXXX-XXXX-7890', licenseNumber: 'DL-KA1920250102', submittedAt: '2026-07-03T16:30:00Z' },
];

export const SEED_SUPPORT_TICKETS: SeedSupportTicket[] = [
  { id: 'tkt-001', userName: 'Lakshmi Devi', userPhone: '+918027411111', category: 'driver_behaviour', issueDescription: 'Driver was rude and asked for extra cash beyond meter fare', urgency: 'high', status: 'open', rideId: 'ride-003', createdAt: '2026-07-03T17:30:00Z', city: 'Mysuru' },
  { id: 'tkt-002', userName: 'Rashid Khan', userPhone: '+918362422222', category: 'safety', issueDescription: 'Driver took wrong route repeatedly at night, felt unsafe — SOS triggered', urgency: 'sos', status: 'open', rideId: 'ride-004', createdAt: '2026-07-03T19:15:00Z', city: 'Mangaluru' },
  { id: 'tkt-003', userName: 'Ananya P', userPhone: '+918027433333', category: 'payment', issueDescription: 'Wallet payment deducted twice for same ride', urgency: 'high', status: 'in_progress', rideId: 'ride-001', createdAt: '2026-07-03T18:20:00Z', city: 'Mysuru' },
  { id: 'tkt-004', userName: 'Suhas Kulkarni', userPhone: '+918361244444', category: 'lost_item', issueDescription: 'Left my laptop bag (Dell, black) in the auto — KA-25-A-3344', urgency: 'normal', status: 'open', rideId: 'ride-007', createdAt: '2026-07-03T18:35:00Z', city: 'Hubli-Dharwad' },
  { id: 'tkt-005', userName: 'Deepa Shetty', userPhone: '+918362455555', category: 'fare_dispute', issueDescription: 'Charged 280 Rs but estimated fare was 210 Rs for same route', urgency: 'normal', status: 'resolved', rideId: null, createdAt: '2026-07-02T12:00:00Z', city: 'Mangaluru' },
  { id: 'tkt-006', userName: 'Mohan Raj', userPhone: '+918027466666', category: 'emergency', issueDescription: 'Accident near Ring Road — driver and rider both need assistance', urgency: 'sos', status: 'open', rideId: 'ride-010', createdAt: '2026-07-03T19:20:00Z', city: 'Mysuru' },
  { id: 'tkt-007', userName: 'Shweta Joshi', userPhone: '+918361277777', category: 'app_issue', issueDescription: 'App showing incorrect ETA for scheduled booking', urgency: 'normal', status: 'in_progress', rideId: null, createdAt: '2026-07-03T10:00:00Z', city: 'Hubli-Dharwad' },
];

export const SEED_PRICING_CONFIGS: SeedPricingConfig[] = [
  {
    city: 'Mysuru',
    auto: { baseFare: 30, baseKm: 1.8, perKm: 15, nightMult: 1.5 },
    mini: { baseFare: 60, baseKm: 2.0, perKm: 16, nightMult: 1.25 },
    sedan: { baseFare: 80, baseKm: 2.0, perKm: 18, nightMult: 1.25 },
    suv: { baseFare: 120, baseKm: 2.5, perKm: 22, nightMult: 1.3 },
  },
  {
    city: 'Mangaluru',
    auto: { baseFare: 35, baseKm: 1.5, perKm: 16, nightMult: 1.5 },
    mini: { baseFare: 65, baseKm: 2.0, perKm: 17, nightMult: 1.25 },
    sedan: { baseFare: 90, baseKm: 2.0, perKm: 20, nightMult: 1.3 },
    suv: { baseFare: 130, baseKm: 2.5, perKm: 24, nightMult: 1.35 },
  },
  {
    city: 'Hubli-Dharwad',
    auto: { baseFare: 25, baseKm: 1.5, perKm: 14, nightMult: 1.5 },
    mini: { baseFare: 55, baseKm: 2.0, perKm: 15, nightMult: 1.25 },
    sedan: { baseFare: 70, baseKm: 2.0, perKm: 17, nightMult: 1.25 },
    suv: { baseFare: 110, baseKm: 2.5, perKm: 21, nightMult: 1.3 },
  },
];

export const CITY_NAMES = ['Mysuru', 'Mangaluru', 'Hubli-Dharwad'] as const;
export const VEHICLE_TYPES = ['auto', 'mini', 'sedan', 'suv'] as const;
export const RIDE_STATUSES = ['requested', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'] as const;
