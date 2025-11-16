import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface LabelAutocompleteProps {
    selectedLabels: string[];
    availableLabels: string[];
    onLabelsChange: (labels: string[]) => void;
    placeholder?: string;
    className?: string;
}

const LabelAutocomplete: React.FC<LabelAutocompleteProps> = ({
    selectedLabels,
    availableLabels,
    onLabelsChange,
    placeholder = "Add a label and press Enter...",
    className = ""
}) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Generate suggestions based on input and available labels
    useEffect(() => {
        if (input.trim()) {
            const filteredSuggestions = availableLabels.filter(label =>
                label.toLowerCase().includes(input.toLowerCase()) &&
                !selectedLabels.includes(label.toLowerCase())
            ).slice(0, 5); // Limit to 5 suggestions

            setSuggestions(filteredSuggestions);
            setShowSuggestions(filteredSuggestions.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        setActiveSuggestionIndex(-1);
    }, [input, availableLabels, selectedLabels]);

    // Handle clicking outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const addLabel = (label: string) => {
        const trimmedLabel = label.trim().toLowerCase();
        if (trimmedLabel && !selectedLabels.includes(trimmedLabel)) {
            onLabelsChange([...selectedLabels, trimmedLabel]);
        }
        setInput('');
        setShowSuggestions(false);
    };

    const removeLabel = (labelToRemove: string) => {
        onLabelsChange(selectedLabels.filter(label => label !== labelToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
                addLabel(suggestions[activeSuggestionIndex]);
            } else {
                addLabel(input);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (showSuggestions && suggestions.length > 0) {
                setActiveSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (showSuggestions && suggestions.length > 0) {
                setActiveSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setActiveSuggestionIndex(-1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSuggestionClick = (suggestion: string) => {
        addLabel(suggestion);
    };

    return (
        <div className="relative">
            <div className={`flex flex-wrap items-center gap-2 p-2 bg-input-bg border border-input-border shadow-inner rounded-md ${className}`}>
                {selectedLabels.map(label => (
                    <span key={label} className="label-chip">
                        {label}
                        <button
                            type="button"
                            onClick={() => removeLabel(label)}
                            className="label-chip__remove"
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    className="bg-transparent flex-grow p-1 focus:outline-none text-text-primary placeholder-text-muted min-w-[160px]"
                    placeholder={placeholder}
                />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-surface border border-border-shadow shadow-lg rounded-md max-h-40 overflow-y-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            type="button"
                            className={`w-full text-left px-3 py-2 hover:bg-surface/80 transition-colors ${
                                index === activeSuggestionIndex 
                                    ? 'bg-accent/20 text-accent' 
                                    : 'text-text-primary'
                            }`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LabelAutocomplete;
