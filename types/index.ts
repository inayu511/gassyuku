export interface FacilityInfo {
  gym?: string;
  compa?: string;
  bbq?: string;
  bath?: string;
  bus?: string;
  equipment?: string;
  [key: string]: string | undefined;
}

export interface Hotel {
  id: string;
  name: string;
  area: string;
  main_image_url: string;
  images: string[];
  tags: string[];
  capacity: number;
  description: string;
  facility_info: FacilityInfo;
}

export interface RequestInput {
  id?: string;
  created_at?: string;
  user_line_id: string;
  hotel_id: string;
  circle_name: string;
  leader_name: string;
  phone: string;
  date: string;
  people_count: number;
  budget: string;
  status?: string;
}

export interface FilterState {
  area: string;
  selectedTags: string[];
  minCapacity: number;
  searchQuery: string;
}

export interface LiffUserProfile {
  displayName: string;
  pictureUrl?: string;
}
