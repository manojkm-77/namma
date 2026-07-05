import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SearchBar } from './SearchBar';
import { searchLocations, getSavedPlaces, getRecentSearches, saveRecentSearch } from '../../services/location-service';
import type { Location, SavedPlace } from '../../types';

interface LocationSearchSheetProps {
  language: 'en' | 'kn';
  onSelectLocation: (location: Location) => void;
  onClose: () => void;
  isPickup?: boolean;
}

export function LocationSearchSheet({ language, onSelectLocation, onClose, isPickup }: LocationSearchSheetProps) {
  const { colors, borderRadius: br, spacing } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getSavedPlaces().then(setSavedPlaces);
    getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchLocations(query);
      setResults(res);
      setIsSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((location: Location) => {
    saveRecentSearch(location);
    onSelectLocation(location);
    onClose();
  }, [onSelectLocation, onClose]);

  const renderLocationItem = (item: Location, index: number) => (
    <TouchableOpacity
      key={`loc-${index}`}
      onPress={() => handleSelect(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceVariant,
      }}
    >
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
      }}>
        <Text style={{ fontSize: 16 }}>📍</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          {item.label || item.address}
        </Text>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: br.xl, borderTopRightRadius: br.xl }}>
      <View style={{ padding: spacing.lg, paddingTop: spacing.md }}>
        <SearchBar
          placeholder={isPickup
            ? (language === 'kn' ? 'ಪಿಕಪ್ ಸ್ಥಳ ಹುಡುಕಿ' : 'Search pickup location')
            : (language === 'kn' ? 'ಗಮ್ಯಸ್ಥಾನ ಹುಡುಕಿ' : 'Search destination')
          }
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          icon="🔍"
          autoFocus
        />
      </View>

      {isSearching ? (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(_, i) => `r-${i}`}
          renderItem={({ item }) => renderLocationItem(item, results.indexOf(item))}
          style={{ flex: 1 }}
        />
      ) : !query.trim() ? (
        <FlatList
          style={{ flex: 1 }}
          ListHeaderComponent={
            <>
              {savedPlaces.length > 0 && (
                <View>
                  <Text style={{
                    color: colors.onSurfaceVariant,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.md,
                    paddingBottom: spacing.sm,
                  }}>
                    {language === 'kn' ? 'ಉಳಿಸಿದ ಸ್ಥಳಗಳು' : 'SAVED PLACES'}
                  </Text>
                  {savedPlaces.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      onPress={() => handleSelect({
                        latitude: place.latitude,
                        longitude: place.longitude,
                        address: place.address,
                        label: place.label,
                      })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                      }}
                    >
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: place.type === 'home' ? colors.primary + '20' : colors.success + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: spacing.md,
                      }}>
                        <Text style={{ fontSize: 16 }}>{place.type === 'home' ? '🏠' : place.type === 'work' ? '💼' : '📍'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: '600' }}>{place.label}</Text>
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }} numberOfLines={1}>{place.address}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
          data={recentSearches}
          keyExtractor={(_, i) => `rs-${i}`}
          renderItem={({ item }) => renderLocationItem(item, recentSearches.indexOf(item))}
          ListEmptyComponent={
            <Text style={{
              color: colors.onSurfaceVariant,
              fontSize: 14,
              textAlign: 'center',
              paddingVertical: spacing.huge,
            }}>
              {language === 'kn' ? 'ಸ್ಥಳವನ್ನು ಹುಡುಕಿ' : 'Search for a location'}
            </Text>
          }
        />
      ) : (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
            {language === 'kn' ? 'ಯಾವುದೇ ಫಲಿತಾಂಶಗಳಿಲ್ಲ' : 'No results found'}
          </Text>
        </View>
      )}
    </View>
  );
}
