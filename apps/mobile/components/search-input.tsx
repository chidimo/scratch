import React, { useEffect, useState } from 'react';
import { CustomInput } from './form-elements/custom-input';

interface Props {
  placeholder?: string;
  defaultValue?: string;
  debounceMs?: number;
  onSearch: (searchTerm: string) => void;
}

export const SearchInput = ({
  onSearch,
  placeholder = 'Search notes...',
  defaultValue = '',
  debounceMs = 300,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue);

  // Debounce search to avoid too frequent calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  return (
    <CustomInput
      placeholder={placeholder}
      value={searchQuery}
      onChangeText={setSearchQuery}
      returnKeyType="search"
      autoCapitalize="none"
      autoCorrect={false}
      containerStyle={{marginBottom: 0}}
    />
  );
};
