export interface VendorProfile {
  id: string;
  name: string;
  email: string;
  companyName: string;
  gstNumber?: string;
  address?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}