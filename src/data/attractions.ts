export interface Attraction {
  id: string;
  nameKo: string;
  nameEn: string;
  emoji: string;
  lat: number;
  lng: number;
}

/** Major Busan tourist spots — 1st-launch curation for the nearby-restaurant search */
export const ATTRACTIONS: Attraction[] = [
  { id: "haeundae", nameKo: "해운대해수욕장", nameEn: "Haeundae Beach", emoji: "🏖️", lat: 35.1587, lng: 129.1604 },
  { id: "gwangalli", nameKo: "광안리해수욕장", nameEn: "Gwangalli Beach", emoji: "🌉", lat: 35.1532, lng: 129.1189 },
  { id: "gamcheon", nameKo: "감천문화마을", nameEn: "Gamcheon Culture Village", emoji: "🎨", lat: 35.0975, lng: 129.0106 },
  { id: "jagalchi", nameKo: "자갈치시장", nameEn: "Jagalchi Fish Market", emoji: "🐟", lat: 35.0967, lng: 129.0306 },
  { id: "biff", nameKo: "BIFF광장·남포동", nameEn: "BIFF Square / Nampo-dong", emoji: "🎬", lat: 35.0988, lng: 129.0287 },
  { id: "taejongdae", nameKo: "태종대", nameEn: "Taejongdae Park", emoji: "⛰️", lat: 35.053, lng: 129.087 },
  { id: "yonggungsa", nameKo: "해동용궁사", nameEn: "Haedong Yonggungsa Temple", emoji: "🛕", lat: 35.1884, lng: 129.2233 },
  { id: "songdo", nameKo: "송도해수욕장", nameEn: "Songdo Beach & Cable Car", emoji: "🚠", lat: 35.0764, lng: 129.0173 },
  { id: "huinnyeoul", nameKo: "흰여울문화마을", nameEn: "Huinnyeoul Culture Village", emoji: "🏘️", lat: 35.0785, lng: 129.0448 },
  { id: "seomyeon", nameKo: "서면", nameEn: "Seomyeon (downtown)", emoji: "🌆", lat: 35.1578, lng: 129.0604 },
  { id: "centum", nameKo: "센텀시티·벡스코", nameEn: "Centum City / BEXCO", emoji: "🛍️", lat: 35.169, lng: 129.136 },
  { id: "busan-station", nameKo: "부산역", nameEn: "Busan Station", emoji: "🚄", lat: 35.1151, lng: 129.0403 },
];
