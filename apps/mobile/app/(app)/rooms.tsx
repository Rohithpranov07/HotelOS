import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts, LuxeRadii } from '../../src/theme/luxe';
import { useContentStore, type RoomCatalogItem } from '../../src/stores/content.store';

const { width: SW } = Dimensions.get('window');

type IconName = keyof typeof Ionicons.glyphMap;

// ─── ROOM DATA ────────────────────────────────────────────────────────────────
// To add photos: place images in assets/rooms/ and fill the `images` arrays
// with require() calls, e.g. require('../../assets/rooms/suite-1.jpg')

interface Facility { icon: IconName; label: string }

interface Room {
  id: string;
  name: string;
  category: string;
  description: string;
  sizeSqFt: number;
  bedType: string;
  maxGuests: number;
  view: string;
  priceFrom: number;
  gradA: string;
  gradB: string;
  gradC: string;
  icon: IconName;
  highlights: string[];
  facilities: Facility[];
  images: number[];
  imageCount: number;
}

const FALLBACK_ROOMS: Room[] = [
  {
    id: 'executive',
    name: 'Executive Room',
    category: 'Comfort & Style',
    description:
      'Our well-appointed Executive Rooms offer a harmonious blend of modern comfort and classic Kodaikanal warmth. Overlooking the hotel gardens, each room features warm teak wood accents, plush bedding, and a private seating corner — the perfect retreat after a day on the hills.',
    sizeSqFt: 280,
    bedType: 'King Bed',
    maxGuests: 2,
    view: 'Garden View',
    priceFrom: 5000,
    gradA: '#091A10',
    gradB: '#142A1A',
    gradC: 'rgba(55,135,75,0.52)',
    icon: 'bed-outline',
    highlights: ['Garden-facing outlook', 'Blackout curtains', 'Heater · 21°C default'],
    facilities: [
      { icon: 'wifi-outline', label: 'High-Speed WiFi' },
      { icon: 'tv-outline', label: 'LED Cable TV' },
      { icon: 'thermometer-outline', label: 'Air Conditioning & Heater' },
      { icon: 'water-outline', label: '24-hr Hot Water' },
      { icon: 'cafe-outline', label: 'Tea / Coffee Maker' },
      { icon: 'briefcase-outline', label: 'Work Desk' },
      { icon: 'restaurant-outline', label: 'Room Service' },
      { icon: 'shield-checkmark-outline', label: 'In-Room Safe' },
    ],
    images: [
      require('../../assets/rooms/ExecutiveRoom1.jpg'),
      require('../../assets/rooms/ExecutiveRoom2.jpg'),
      require('../../assets/rooms/ExecutiveRoom3.jpg'),
      require('../../assets/rooms/ExecutiveRoom4.jpg'),
    ],
    imageCount: 4,
  },
  {
    id: 'deluxe',
    name: 'Deluxe Double',
    category: 'Valley Views & Space',
    description:
      'Spacious and elegantly furnished, our Deluxe Double rooms step out to a private balcony with sweeping valley panoramas. The warm wood interiors, premium bath amenities, and a dedicated reading corner make this the most popular choice among returning guests.',
    sizeSqFt: 320,
    bedType: 'King Bed',
    maxGuests: 2,
    view: 'Valley View',
    priceFrom: 6250,
    gradA: '#091520',
    gradB: '#142030',
    gradC: 'rgba(55,110,175,0.52)',
    icon: 'business-outline',
    highlights: ['Private balcony', 'Valley panorama', 'Premium bath amenities'],
    facilities: [
      { icon: 'wifi-outline', label: 'High-Speed WiFi' },
      { icon: 'tv-outline', label: 'LED Cable TV' },
      { icon: 'thermometer-outline', label: 'Air Conditioning & Heater' },
      { icon: 'water-outline', label: '24-hr Hot Water' },
      { icon: 'cafe-outline', label: 'Tea / Coffee Maker' },
      { icon: 'leaf-outline', label: 'Private Balcony' },
      { icon: 'wine-outline', label: 'Mini Bar' },
      { icon: 'restaurant-outline', label: 'Room Service' },
      { icon: 'shield-checkmark-outline', label: 'In-Room Safe' },
    ],
    images: [
      require('../../assets/rooms/Deluxdouble1.jpg'),
      require('../../assets/rooms/Deluxdouble2.jpg'),
      require('../../assets/rooms/Deluxdouble3.jpg'),
      require('../../assets/rooms/Deluxdouble4.jpg'),
      require('../../assets/rooms/Deluxdouble5.jpg'),
    ],
    imageCount: 5,
  },
  {
    id: 'family',
    name: 'Family Room',
    category: 'Space for Everyone',
    description:
      'Generously proportioned and thoughtfully arranged for families, these rooms accommodate up to four guests with ease. A king bed and two comfortable singles share a warm, open-plan space — with ample room for luggage, play and relaxed mornings together.',
    sizeSqFt: 420,
    bedType: 'King + 2 Singles',
    maxGuests: 4,
    view: 'Garden / Lawn View',
    priceFrom: 7150,
    gradA: '#1A100A',
    gradB: '#2C1A10',
    gradC: 'rgba(165,100,50,0.52)',
    icon: 'people-outline',
    highlights: ['Sleeps up to 4', 'Extra luggage alcove', 'Child-friendly setup'],
    facilities: [
      { icon: 'wifi-outline', label: 'High-Speed WiFi' },
      { icon: 'tv-outline', label: 'LED Cable TV' },
      { icon: 'thermometer-outline', label: 'Air Conditioning & Heater' },
      { icon: 'water-outline', label: '24-hr Hot Water' },
      { icon: 'cafe-outline', label: 'Tea / Coffee Maker' },
      { icon: 'restaurant-outline', label: 'Room Service' },
      { icon: 'shirt-outline', label: 'Full Wardrobe' },
      { icon: 'bed-outline', label: 'Extra Beds on Request' },
    ],
    images: [
      require('../../assets/rooms/FamilyRoom1.jpg'),
      require('../../assets/rooms/FamilyRoom2.jpg'),
      require('../../assets/rooms/FamilyRoom3.jpg'),
      require('../../assets/rooms/FamilyRoom4.jpg'),
      require('../../assets/rooms/FamilyRoom5.jpg'),
    ],
    imageCount: 5,
  },
  {
    id: 'jr-suite',
    name: 'Jr. Suite',
    category: 'A Suite Escape',
    description:
      'A step above in every sense — our Junior Suites offer a dedicated sitting lounge, a soaking bathtub, and premium in-room amenities set against crisp hill views. An ideal choice for a romantic or celebratory stay in the hills.',
    sizeSqFt: 480,
    bedType: 'King Bed',
    maxGuests: 2,
    view: 'Hill View',
    priceFrom: 8300,
    gradA: '#10091A',
    gradB: '#1C1228',
    gradC: 'rgba(120,75,185,0.52)',
    icon: 'star-outline',
    highlights: ['Sitting lounge', 'Soaking bathtub', 'Bathrobes & slippers'],
    facilities: [
      { icon: 'wifi-outline', label: 'High-Speed WiFi' },
      { icon: 'tv-outline', label: 'LED Cable TV' },
      { icon: 'thermometer-outline', label: 'Air Conditioning & Heater' },
      { icon: 'water-outline', label: '24-hr Hot Water' },
      { icon: 'cafe-outline', label: 'Tea / Coffee Maker' },
      { icon: 'leaf-outline', label: 'Private Balcony' },
      { icon: 'wine-outline', label: 'Mini Bar' },
      { icon: 'water-outline', label: 'Soaking Bathtub' },
      { icon: 'restaurant-outline', label: 'Room Service' },
      { icon: 'shield-checkmark-outline', label: 'In-Room Safe' },
      { icon: 'ribbon-outline', label: 'Bathrobes & Slippers' },
    ],
    images: [
      require('../../assets/rooms/JRSuiteRoom1.jpg'),
      require('../../assets/rooms/JRSuiteRoom2.jpg'),
      require('../../assets/rooms/JRSuiteRoom3.jpg'),
      require('../../assets/rooms/JRSuiteRoom4.jpg'),
      require('../../assets/rooms/JRSuiteRoom5.jpg'),
    ],
    imageCount: 5,
  },
  {
    id: 'suite',
    name: 'Suite',
    category: 'The Pinnacle',
    description:
      'The definitive Hotel Kodai International experience. Our Suites command panoramic views of the Palani Hills from a full living and dining area, with butler service available on request. Handpicked furnishings, a private jacuzzi, and bespoke amenities make this the ultimate retreat in Kodaikanal.',
    sizeSqFt: 640,
    bedType: 'King Bed',
    maxGuests: 2,
    view: 'Panoramic Hill View',
    priceFrom: 10000,
    gradA: '#1A1206',
    gradB: '#2C1E08',
    gradC: 'rgba(210,155,45,0.58)',
    icon: 'trophy-outline',
    highlights: ['Panoramic hill views', 'Jacuzzi', 'Living & dining area', 'Butler on request'],
    facilities: [
      { icon: 'wifi-outline', label: 'High-Speed WiFi' },
      { icon: 'tv-outline', label: 'LED Cable TV' },
      { icon: 'thermometer-outline', label: 'Air Conditioning & Heater' },
      { icon: 'water-outline', label: '24-hr Hot Water' },
      { icon: 'cafe-outline', label: 'Tea / Coffee Maker' },
      { icon: 'leaf-outline', label: 'Private Balcony' },
      { icon: 'wine-outline', label: 'Premium Mini Bar' },
      { icon: 'water-outline', label: 'Jacuzzi / Soaking Bath' },
      { icon: 'restaurant-outline', label: 'Priority Room Service' },
      { icon: 'shield-checkmark-outline', label: 'In-Room Safe' },
      { icon: 'person-outline', label: 'Butler Service' },
      { icon: 'ribbon-outline', label: 'Premium Amenity Kit' },
    ],
    images: [
      require('../../assets/rooms/SuiteRoom1.jpg'),
      require('../../assets/rooms/SuiteRoom2.jpg'),
      require('../../assets/rooms/SuiteRoom3.jpg'),
      require('../../assets/rooms/SuiteRoom4.jpg'),
      require('../../assets/rooms/SuiteRoom5.jpg'),
    ],
    imageCount: 5,
  },
];

// ─── SCREEN ──────────────────────────────────────────────────────────────────

function catalogToRooms(items: RoomCatalogItem[]): Room[] {
  return items.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    sizeSqFt: r.sizeSqFt,
    bedType: r.bedType,
    maxGuests: r.maxGuests,
    view: r.view,
    priceFrom: r.priceFrom,
    gradA: r.gradA,
    gradB: r.gradB,
    gradC: r.gradC,
    icon: r.icon as IconName,
    highlights: r.highlights,
    facilities: r.facilities.map((f) => ({ icon: f.icon as IconName, label: f.label })),
    images: r.images,
    imageCount: r.images.length,
  }));
}

export default function RoomsScreen() {
  void useLuxeFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const apiRooms = useContentStore((s) => s.rooms);
  const fetchRooms = useContentStore((s) => s.fetchRooms);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const ROOMS: Room[] =
    apiRooms && apiRooms.length > 0 ? catalogToRooms(apiRooms) : FALLBACK_ROOMS;
  // Stable list of every image source used for preloading
  const ALL_ROOM_IMAGES = ROOMS.flatMap((r) => r.images);


  const openRoom = (room: Room) => {
    void Haptics.selectionAsync();
    setSelectedRoom(room);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ── HEADER ── */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={Luxe.ivory} />
          </Pressable>
          <View style={styles.locationChip}>
            <Ionicons name="location" size={10} color={Luxe.goldBright} />
            <Text style={styles.locationText}>Kodaikanal · Lawsghat Road</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerKicker}>Hotel Kodai International · Rooms</Text>
          <Text style={styles.headerTitle}>
            Choose your{'\n'}
            <Text style={styles.headerItalic}>retreat.</Text>
          </Text>
          <Text style={styles.headerSub}>
            Five room categories — from garden-view comfort to panoramic suites. All with warm teak interiors and the quiet of the Palani Hills.
          </Text>

          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatVal}>5</Text>
              <Text style={styles.headerStatLabel}>Room types</Text>
            </View>
            <View style={styles.headerStatDiv} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatVal}>₹5k</Text>
              <Text style={styles.headerStatLabel}>Starts from</Text>
            </View>
            <View style={styles.headerStatDiv} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatVal}>HKI</Text>
              <Text style={styles.headerStatLabel}>Kodaikanal</Text>
            </View>
          </View>
        </View>

        {/* ── ROOM CARDS ── */}
        <View style={styles.cards}>
          {ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} onPress={() => openRoom(room)} />
          ))}
        </View>

        <View style={styles.footnote}>
          <Text style={styles.footText}>Rates from ₹5,000 / night · Taxes extra</Text>
          <Text style={styles.footText}>+91 9944945190</Text>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />

      {selectedRoom && (
        <RoomDetailModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}
    </View>
  );
}

// ─── ROOM CARD ────────────────────────────────────────────────────────────────

function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} unstable_pressDelay={130} style={styles.card}>
      {/* Off-screen preloaders at actual carousel size — forces the native
          decoder to fully process each bitmap before the modal opens */}
      <View style={styles.preloadContainer} pointerEvents="none">
        {room.images.map((src, i) => (
          <Image
            key={i}
            source={src}
            style={styles.preloadImg}
            transition={0}
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={`${room.id}-preload-${i}`}
          />
        ))}
      </View>
      {/* Photo area */}
      <View style={styles.cardPhoto}>
        <Image
          source={room.images[0]}
          style={[StyleSheet.absoluteFill, styles.cardPhotoBg]}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={`${room.id}-card`}
        />
        <LinearGradient
          colors={['rgba(6,5,3,0.08)', 'rgba(6,5,3,0.62)', 'rgba(4,3,1,0.90)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Image count badge */}
        <View style={styles.photoBadge}>
          <Ionicons name="images-outline" size={10} color={Luxe.ivoryDim} />
          <Text style={styles.photoBadgeText}>{room.imageCount} photos</Text>
        </View>

        {/* Room name overlay */}
        <View style={styles.cardPhotoBottom}>
          <Text style={styles.cardPhotoCategory}>{room.category}</Text>
          <Text style={styles.cardPhotoName}>{room.name}</Text>
        </View>
      </View>

      {/* Info strip */}
      <LinearGradient
        colors={['rgba(244,201,126,0.07)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
        pointerEvents="none"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: LuxeRadii.xl, borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.18)' },
        ]}
        pointerEvents="none"
      />

      <View style={styles.cardBody}>
        <View style={styles.cardSpecRow}>
          <Spec icon="resize-outline" label={`${room.sizeSqFt} sq ft`} />
          <Spec icon="bed-outline" label={room.bedType} />
          <Spec icon="people-outline" label={`Up to ${room.maxGuests}`} />
          <Spec icon="eye-outline" label={room.view} />
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceFrom}>from</Text>
            <Text style={styles.price}>₹{room.priceFrom.toLocaleString('en-IN')}
              <Text style={styles.priceNight}> / night</Text>
            </Text>
          </View>
          <View style={styles.viewBtn}>
            <LinearGradient
              colors={['#F4C97E', '#D4A857', '#9A7A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.viewBtnLabel}>View Details</Text>
            <Ionicons name="arrow-forward" size={13} color="#1A1206" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Spec({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={11} color={Luxe.gold} />
      <Text style={styles.specLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ─── ROOM DETAIL MODAL ───────────────────────────────────────────────────────

function RoomDetailModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [imageIndex, setImageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setImageIndex(idx);
  };

  return (
    <Modal visible animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: Luxe.obsidian }]}>
        {/* ── IMAGE CAROUSEL ── */}
        <View style={styles.modalImageArea}>
          {/* Horizontal ScrollView renders ALL images immediately — no lazy decode */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            style={styles.modalCarouselScroll}
          >
            {room.images.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={styles.modalCarouselImg}
                contentFit="cover"
                transition={0}
                cachePolicy="memory-disk"
                priority="high"
                recyclingKey={`${room.id}-modal-${i}`}
              />
            ))}
          </ScrollView>

          {/* Gradient scrim */}
          <LinearGradient
            colors={['rgba(8,7,10,0.30)', 'transparent', 'rgba(8,7,10,0.72)']}
            locations={[0, 0.4, 1]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />

          {/* Close btn */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[styles.modalCloseBtn, { top: insets.top + 16 }]}
          >
            <Ionicons name="close" size={20} color={Luxe.ivory} />
          </Pressable>

          {/* Counter pill */}
          <View style={[styles.modalPhotoCounter, { top: insets.top + 16 }]}>
            <Text style={styles.modalPhotoCounterText}>{imageIndex + 1} / {room.imageCount}</Text>
          </View>

          {/* Vertical dot strip */}
          <View style={styles.modalImgDots}>
            {room.images.map((_, i) => (
              <Pressable
                key={i}
                hitSlop={6}
                onPress={() => {
                  scrollRef.current?.scrollTo({ x: i * SW, animated: true });
                  setImageIndex(i);
                }}
              >
                <View style={[styles.modalImgDot, i === imageIndex && styles.modalImgDotActive]} />
              </Pressable>
            ))}
          </View>

          {/* Category chip */}
          <View style={styles.modalCategoryChip}>
            <Ionicons name="ribbon-outline" size={10} color={Luxe.goldBright} />
            <Text style={styles.modalCategoryText}>{room.category}</Text>
          </View>
        </View>

        {/* ── DETAIL CONTENT ── */}
        <ScrollView
          contentContainerStyle={[styles.modalScroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Name + price */}
          <View style={styles.modalNameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalRoomName}>{room.name}</Text>
              <View style={styles.modalSpecStrip}>
                <Text style={styles.modalSpecItem}>{room.sizeSqFt} sq ft</Text>
                <Text style={styles.modalSpecDot}>·</Text>
                <Text style={styles.modalSpecItem}>{room.bedType}</Text>
                <Text style={styles.modalSpecDot}>·</Text>
                <Text style={styles.modalSpecItem}>Up to {room.maxGuests} guests</Text>
              </View>
            </View>
            <View style={styles.modalPriceBox}>
              <Text style={styles.modalPriceFrom}>from</Text>
              <Text style={styles.modalPrice}>₹{room.priceFrom.toLocaleString('en-IN')}</Text>
              <Text style={styles.modalPriceNight}>/ night</Text>
            </View>
          </View>

          {/* View badge */}
          <View style={styles.modalViewBadge}>
            <Ionicons name="eye-outline" size={11} color={Luxe.goldBright} />
            <Text style={styles.modalViewText}>{room.view}</Text>
          </View>

          {/* Description */}
          <Text style={styles.modalDesc}>{room.description}</Text>

          {/* Highlights */}
          <View style={styles.highlightsRow}>
            {room.highlights.map((h) => (
              <View key={h} style={styles.highlightPill}>
                <Ionicons name="checkmark-circle" size={11} color={Luxe.goldBright} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Facilities */}
          <View style={styles.facilitiesSection}>
            <Text style={styles.facilitiesLabel}>Facilities & Amenities</Text>
            <View style={styles.facilitiesGrid}>
              {room.facilities.map((f) => (
                <View key={f.label} style={styles.facilityItem}>
                  <View style={styles.facilityIconBox}>
                    <Ionicons name={f.icon} size={17} color={Luxe.goldBright} />
                  </View>
                  <Text style={styles.facilityLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.modalDivider} />

          {/* Policies */}
          <View style={styles.policiesSection}>
            <Text style={styles.policiesLabel}>Policies</Text>
            <PolicyRow icon="time-outline" label="Check-in" value="2:00 PM" />
            <PolicyRow icon="exit-outline" label="Check-out" value="11:00 AM" />
            <PolicyRow icon="ban-outline" label="Smoking" value="Non-smoking" />
            <PolicyRow icon="paw-outline" label="Pets" value="Not permitted" />
            <PolicyRow icon="card-outline" label="Payment" value="All major cards · UPI" />
          </View>
        </ScrollView>

        {/* ── BOOK CTA ── */}
        <LinearGradient
          colors={['transparent', 'rgba(8,7,10,0.95)', Luxe.obsidian]}
          locations={[0, 0.4, 0.8]}
          pointerEvents="none"
          style={styles.modalFootFade}
        />
        <View style={[styles.modalBookBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.modalBookPrice}>
            <Text style={styles.modalBookFrom}>from</Text>
            <Text style={styles.modalBookAmount}>₹{room.priceFrom.toLocaleString('en-IN')}</Text>
            <Text style={styles.modalBookNight}>/ night</Text>
          </View>
          <Pressable style={styles.modalBookBtn}>
            <LinearGradient
              colors={['#F4C97E', '#D4A857', '#9A7A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.modalBookBtnLabel}>Enquire / Book</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PolicyRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.policyRow}>
      <Ionicons name={icon} size={14} color={Luxe.gold} />
      <Text style={styles.policyLabel}>{label}</Text>
      <Text style={styles.policyValue}>{value}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  scroll: { paddingHorizontal: 20 },
  dockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180, pointerEvents: 'none' },

  // ── TOP BAR
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.12)',
  },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
  },
  locationText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 10,
    color: Luxe.ivoryDim, letterSpacing: 1, textTransform: 'uppercase',
  },

  // ── HEADER
  header: { marginBottom: 32 },
  headerKicker: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 14,
  },
  headerTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 44, lineHeight: 46,
    color: Luxe.ivory, letterSpacing: -1.2, marginBottom: 14,
  },
  headerItalic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  headerSub: {
    fontFamily: LuxeFonts.sansLight, fontSize: 13.5, lineHeight: 20,
    color: Luxe.ivoryDim, maxWidth: 340, marginBottom: 24,
  },
  headerStats: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 18,
    backgroundColor: 'rgba(21,19,15,0.60)',
    borderWidth: 0.5, borderColor: Luxe.hairlineStrong,
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatVal: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory, letterSpacing: -0.5 },
  headerStatLabel: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8.5,
    color: Luxe.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 5,
  },
  headerStatDiv: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: Luxe.hairlineStrong },

  // ── ROOM CARDS
  cards: { gap: 18 },
  card: {
    borderRadius: LuxeRadii.xl, overflow: 'hidden',
    backgroundColor: Luxe.softBlack,
  },
  cardPhoto: {
    height: 220, overflow: 'hidden',
    borderTopLeftRadius: LuxeRadii.xl, borderTopRightRadius: LuxeRadii.xl,
  },
  cardPhotoBg: {
    borderTopLeftRadius: LuxeRadii.xl, borderTopRightRadius: LuxeRadii.xl,
  },
  photoBadge: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999,
    backgroundColor: 'rgba(8,7,10,0.58)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.14)',
  },
  photoBadgeText: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.ivoryDim, letterSpacing: 0.5 },
  cardPhotoBottom: {
    position: 'absolute', bottom: 16, left: 18,
  },
  cardPhotoCategory: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4,
  },
  cardPhotoName: { fontFamily: LuxeFonts.serif, fontSize: 28, color: Luxe.ivory, letterSpacing: -0.6 },

  cardBody: { padding: 18 },
  cardSpecRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  spec: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.18)',
  },
  specLabel: { fontFamily: LuxeFonts.monoMedium, fontSize: 9.5, color: Luxe.ivoryDim, letterSpacing: 0.3 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceFrom: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.muted, letterSpacing: 0.8 },
  price: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory, letterSpacing: -0.4 },
  priceNight: { fontFamily: LuxeFonts.monoMedium, fontSize: 11, color: Luxe.titanium },

  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, overflow: 'hidden',
  },
  viewBtnLabel: { fontFamily: LuxeFonts.sansSemibold, fontSize: 13, color: '#1A1206', letterSpacing: 0.2 },

  footnote: { marginTop: 36, flexDirection: 'row', justifyContent: 'space-between' },
  footText: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.muted, letterSpacing: 1.6, textTransform: 'uppercase' },

  // ── MODAL
  modalRoot: { flex: 1 },

  modalImageArea: {
    width: SW, height: 300, overflow: 'hidden',
  },
  modalCarouselScroll: {
    width: SW, height: 300,
  },
  modalCarouselImg: {
    width: SW, height: 300,
  },
  modalImgDots: {
    position: 'absolute', right: 16, top: '50%',
    flexDirection: 'column', gap: 6,
    transform: [{ translateY: -20 }],
  },
  modalImgDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(255,240,210,0.35)',
  },
  modalImgDotActive: { backgroundColor: Luxe.goldBright, height: 16, borderRadius: 3 },
  modalPhotoCounter: {
    position: 'absolute', right: 16,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999,
    backgroundColor: 'rgba(8,7,10,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.14)',
  },
  modalPhotoCounterText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.ivoryDim, letterSpacing: 0.8,
  },
  modalCloseBtn: {
    position: 'absolute', left: 16,
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(8,7,10,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.14)',
  },
  modalCategoryChip: {
    position: 'absolute', left: 18, bottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9999,
    backgroundColor: 'rgba(8,7,10,0.60)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.30)',
  },
  modalCategoryText: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.gold, letterSpacing: 1, textTransform: 'uppercase' },

  modalScroll: { paddingHorizontal: 22, paddingTop: 22 },

  modalNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
  modalRoomName: { fontFamily: LuxeFonts.serif, fontSize: 34, color: Luxe.ivory, letterSpacing: -0.8 },
  modalSpecStrip: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, flexWrap: 'wrap' },
  modalSpecItem: { fontFamily: LuxeFonts.monoMedium, fontSize: 10, color: Luxe.titanium, letterSpacing: 0.5 },
  modalSpecDot: { fontFamily: LuxeFonts.mono, fontSize: 10, color: Luxe.muted },

  modalPriceBox: { alignItems: 'flex-end', paddingTop: 4 },
  modalPriceFrom: { fontFamily: LuxeFonts.monoMedium, fontSize: 8.5, color: Luxe.muted, letterSpacing: 0.8 },
  modalPrice: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.goldBright, letterSpacing: -0.4 },
  modalPriceNight: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.muted },

  modalViewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
    marginBottom: 18,
  },
  modalViewText: { fontFamily: LuxeFonts.monoMedium, fontSize: 9.5, color: Luxe.gold, letterSpacing: 0.8 },

  modalDesc: {
    fontFamily: LuxeFonts.sansLight, fontSize: 14, lineHeight: 22,
    color: Luxe.ivoryDim, marginBottom: 20,
  },

  highlightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  highlightPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.26)',
  },
  highlightText: { fontFamily: LuxeFonts.sansMedium, fontSize: 11.5, color: Luxe.ivory },

  facilitiesSection: { marginBottom: 28 },
  facilitiesLabel: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16,
  },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  facilityItem: {
    width: (SW - 44 - 36) / 3,
    alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 6, borderRadius: 14,
    backgroundColor: 'rgba(21,19,15,0.70)',
    borderWidth: 0.5, borderColor: Luxe.hairlineStrong,
  },
  facilityIconBox: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.20)',
  },
  facilityLabel: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9,
    color: Luxe.ivoryDim, letterSpacing: 0.4, textAlign: 'center',
  },

  modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Luxe.hairlineStrong, marginBottom: 24 },

  policiesSection: { marginBottom: 16 },
  policiesLabel: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14,
  },
  policyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11,
    borderTopWidth: 0.5, borderTopColor: Luxe.hairline,
  },
  policyLabel: { fontFamily: LuxeFonts.mono, fontSize: 11.5, color: Luxe.titanium, flex: 1, letterSpacing: 0.4 },
  policyValue: { fontFamily: LuxeFonts.sansMedium, fontSize: 12.5, color: Luxe.ivory },

  // ── PRELOADER (full carousel size, opacity 0 — native decoder processes real bitmaps)
  preloadContainer: {
    position: 'absolute', width: SW, height: 300,
    opacity: 0, overflow: 'hidden', top: 0, left: 0,
  },
  preloadImg: { width: SW, height: 300, position: 'absolute', top: 0, left: 0 },

  // ── BOOK BAR
  modalFootFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130, pointerEvents: 'none' },
  modalBookBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 16, gap: 14,
    backgroundColor: Luxe.obsidian,
    borderTopWidth: 0.5, borderTopColor: 'rgba(244,201,126,0.14)',
  },
  modalBookPrice: { flex: 1 },
  modalBookFrom: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.muted, letterSpacing: 0.8 },
  modalBookAmount: { fontFamily: LuxeFonts.serif, fontSize: 24, color: Luxe.ivory, letterSpacing: -0.5 },
  modalBookNight: { fontFamily: LuxeFonts.monoMedium, fontSize: 9.5, color: Luxe.titanium },
  modalBookBtn: {
    flex: 1.4, height: 50, borderRadius: 16, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBookBtnLabel: { fontFamily: LuxeFonts.sansSemibold, fontSize: 14, color: '#1A1206', letterSpacing: 0.3 },
});
