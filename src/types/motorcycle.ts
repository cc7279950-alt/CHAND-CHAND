export type BikeCategory =
  | 'Sports Bikes'
  | 'Racing Bikes'
  | 'Naked Bikes'
  | 'Cruiser Bikes'
  | 'Touring Bikes'
  | 'Commuter Bikes'
  | 'Electric Bikes'
  | 'Premium Bikes';

export type AvailabilityStatus = 'In Stock' | 'On Booking' | 'Limited Import' | 'Availability Unconfirmed';

export interface Motorcycle {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: BikeCategory;
  cc: number;
  engineCapacityLabel: string;
  engineType: string;
  horsepower: string;
  torque: string;
  transmission: string;
  fuelTankCapacity: string;
  mileage: string;
  topSpeed: string;
  brakingSystem: string;
  frontSuspension: string;
  rearSuspension: string;
  dimensions: string;
  weight: string;
  colors: string[];
  estimatedPricePkr: number;
  priceLabel: string;
  priceUpdatedAt: string;
  sourceUrls?: string[];
  sourceCheckedAt?: string;
  verifiedFields?: string[];
  keyFeatures: string[];
  description: string;
  imageUrl: string;
  galleryUrls: string[];
  isFeatured: boolean;
  isLatestArrival: boolean;
  popularityScore: number;
  availability: AvailabilityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BrandItem {
  id: number;
  name: string;
  slug: string;
  country: string;
  summary: string;
  isFeatured: boolean;
}

export interface CategoryItem {
  id: number;
  name: BikeCategory;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string[];
  readTime: string;
  publishedAt: string;
  imageUrl: string;
  faqs: GuideFaq[];
}

export interface CustomerReview {
  id: number;
  customerName: string;
  city: string;
  bikePurchased: string;
  rating: number;
  quote: string;
  verifiedAt: string;
}

export interface Inquiry {
  id: number;
  userId?: number | null;
  customerName: string;
  phone: string;
  email: string;
  motorcycleId?: number | null;
  motorcycleName: string;
  city: string;
  message: string;
  status: 'New' | 'Contacted' | 'Closed';
  createdAt: string;
}

export interface SiteContent {
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaLabel: string;
  showroomAddress: string;
  showroomCity: string;
  showroomHours: string;
  whatsappNumber: string;
  announcementText: string;
  priceDisclaimer: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: 'customer' | 'admin';
  savedBikeIds: number[];
  createdAt: string;
}

export interface SignInNotification {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userCity: string;
  eventType: 'login' | 'register';
  ipAddress: string;
  userAgent: string;
  recipientEmail: string;
  emailStatus: 'pending' | 'sent' | 'not_configured' | 'failed';
  statusDetail: string;
  createdAt: string;
}
