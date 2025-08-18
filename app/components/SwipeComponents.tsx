"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOpenUrl } from "@coinbase/onchainkit/minikit";
import { useAccount, useWalletClient } from 'wagmi';
import { Button } from "./DemoComponents";
import { incrementScoreOnContract } from "../../lib/contract";

interface MiniApp {
  rank: number;
  miniApp: {
    domain: string;
    name: string;
    iconUrl: string;
    homeUrl: string;
    author: {
      displayName: string;
      username: string;
      pfp: {
        url: string;
      };
    };
    imageUrl?: string;
    id:string;
    buttonTitle: string;
    splashImageUrl?: string;
    splashBackgroundColor?: string;
    subtitle?: string;
    description?: string;
    tagline?: string;
    primaryCategory?: string;
    tags?: string[];
  };
  rank72hChange: number;
}

interface SwipeCardProps {
  miniApp: MiniApp;
  isActive: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap: () => void;
}

// SwipeCard component - currently unused but kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SwipeCard: React.FC<SwipeCardProps> = ({ miniApp, isActive, onSwipe, onTap }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };
  
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const offset = clientX - startX;
    setDragOffset(offset);
  }, [isDragging, startX]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50; // Daha düşük threshold, daha kolay swipe
    if (Math.abs(dragOffset) > threshold) {
      onSwipe(dragOffset > 0 ? 'right' : 'left');
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, onSwipe]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleClick = () => {
    if (!isDragging && Math.abs(dragOffset) < 10) {
      onTap();
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, handleMove, handleEnd]);

  const transform = `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)`;
  const opacity = Math.max(0.7, 1 - Math.abs(dragOffset) / 300);

  return (
    <div
      ref={cardRef}
      className={`absolute inset-0 transition-all duration-300 ${
        isActive ? 'z-10' : 'z-0'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        transform: isActive ? transform : 'scale(0.95)',
        opacity: isActive ? opacity : 0.5,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full border border-gray-100">
        {/* Header with gradient background */}
        <div
          className="h-24 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${miniApp.miniApp.splashBackgroundColor || '#6366f1'}, ${miniApp.miniApp.splashBackgroundColor || '#8b5cf6'})`,
          }}
        >
          <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-white text-xs font-medium">#{miniApp.rank}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* App Info */}
          <div className="flex items-center space-x-3">
            <img
              src={miniApp.miniApp.iconUrl}
              alt={miniApp.miniApp.name}
              className="w-12 h-12 rounded-xl border border-gray-200"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTIiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0zIDkgOS03IDkgN3YxMWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiLz4KPC9zdmc+Cjwvc3ZnPgo=';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {miniApp.miniApp.name}
              </h3>
              <p className="text-xs text-gray-600 truncate">
                {miniApp.miniApp.author.displayName}
              </p>
            </div>
          </div>

          {/* Description */}
          {miniApp.miniApp.description && (
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
              {miniApp.miniApp.description}
            </p>
          )}

          {/* Category */}
          {miniApp.miniApp.primaryCategory && (
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md capitalize">
                {miniApp.miniApp.primaryCategory}
              </span>
              <span className={`text-xs flex items-center ${
                miniApp.rank72hChange > 0 ? 'text-green-600' :
                miniApp.rank72hChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {miniApp.rank72hChange > 0 ? '↗' : miniApp.rank72hChange < 0 ? '↘' : '→'}
                {Math.abs(miniApp.rank72hChange)}
              </span>
            </div>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
          >
            {miniApp.miniApp.buttonTitle || 'Open App'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface SwipeContainerProps {
  miniApps: MiniApp[];
  setActiveTab?: (tab: string) => void;
}

interface MiniAppCardProps {
  miniApp: MiniApp;
  onTap: () => void;
}

const MiniAppCard: React.FC<MiniAppCardProps> = ({ miniApp, onTap }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-100">
      {/* Header with gradient background */}
      {/* Content */}
      <div className="p-3 space-y-2 h-48 flex flex-col">
        {/* App Info */}
        <div className="flex items-center space-x-2">
          <img
            src={miniApp.miniApp.iconUrl}
            alt={miniApp.miniApp.name}
            className="w-10 h-10 rounded-lg border border-gray-200"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMTAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0zIDkgOS03IDkgN3YxMWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiLz4KPC9zdmc+Cjwvc3ZnPgo=';
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {miniApp.miniApp.name}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {miniApp.miniApp.author.displayName}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1">
          {miniApp.miniApp.description && (
            <p className="text-gray-700 text-xs leading-relaxed line-clamp-3">
              {miniApp.miniApp.description}
            </p>
          )}
        </div>

        {/* Category and Rank Change */}
        <div className="flex items-center justify-between">
          {miniApp.miniApp.primaryCategory && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md capitalize">
              {miniApp.miniApp.primaryCategory}
            </span>
          )}
          <span className={`text-xs flex items-center ${
            miniApp.rank72hChange > 0 ? 'text-green-600' :
            miniApp.rank72hChange < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {miniApp.rank72hChange > 0 ? '↗' : miniApp.rank72hChange < 0 ? '↘' : '→'}
            {Math.abs(miniApp.rank72hChange)}
          </span>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onTap()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5"
        >
          Open App
        </Button>
      </div>
    </div>
  );
};

export const SwipeContainer: React.FC<SwipeContainerProps> = ({ miniApps, setActiveTab }) => {
  const [availableApps, setAvailableApps] = useState<MiniApp[]>([]);
  const [currentPair, setCurrentPair] = useState<[MiniApp, MiniApp] | null>(null);
  const [selectedApps, setSelectedApps] = useState<MiniApp[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTagSelection, setShowTagSelection] = useState(true);
  const openUrl = useOpenUrl();
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();

  // Tag normalization mapping
  const normalizeTag = (tag: string): string => {
    const normalized = tag.toLowerCase().trim();

    // Gaming related tags
    if (['game', 'games', 'gaming', 'playtoearn', 'play'].includes(normalized)) {
      return 'games';
    }

    // Finance related tags
    if (['finance', 'defi', 'trading', 'crypto', 'token', 'swap'].includes(normalized)) {
      return 'finance';
    }

    // Social related tags
    if (['social', 'community', 'chat', 'messaging'].includes(normalized)) {
      return 'social';
    }

    // Utility related tags
    if (['utility', 'tools', 'productivity', 'app'].includes(normalized)) {
      return 'utility';
    }

    // Entertainment related tags
    if (['entertainment', 'fun', 'media', 'content'].includes(normalized)) {
      return 'entertainment';
    }

    // NFT/Collectibles related tags
    if (['nft', 'collectibles', 'marketplace', 'art'].includes(normalized)) {
      return 'nft';
    }

    return normalized;
  };

  // Get all unique normalized tags from mini apps
  const getAllTags = () => {
    const tagCounts = new Map<string, number>();

    miniApps.forEach(app => {
      const allTags = [
        ...(app.miniApp.tags || []),
        ...(app.miniApp.primaryCategory ? [app.miniApp.primaryCategory] : [])
      ];

      allTags.forEach(tag => {
        const normalizedTag = normalizeTag(tag);
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      });
    });

    // Only return tags with at least 10 apps
    return Array.from(tagCounts.entries())
      .filter(([, count]) => count >= 10)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  // Initialize available apps based on selected tag
  useEffect(() => {
    if (miniApps && miniApps.length > 0 && selectedTag) {
      const filteredApps = miniApps.filter(app => {
        const appTags = [
          ...(app.miniApp.tags || []),
          ...(app.miniApp.primaryCategory ? [app.miniApp.primaryCategory] : [])
        ];
        return appTags.some(tag => normalizeTag(tag) === selectedTag);
      });
      setAvailableApps([...filteredApps]);
      setShowTagSelection(false);
    }
  }, [miniApps, selectedTag]);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setSelectedApps([]);
    setCurrentPair(null);
  };

  const resetToTagSelection = () => {
    setShowTagSelection(true);
    setSelectedTag(null);
    setAvailableApps([]);
    setSelectedApps([]);
    setCurrentPair(null);
  };

  const handleChoice = useCallback((chosenApp: MiniApp) => {
    if (!currentPair) return;

    // Kaybeden app'i belirle
    const loserApp = currentPair[0].miniApp.domain === chosenApp.miniApp.domain
      ? currentPair[1]
      : currentPair[0];

    // Kazanan app'i bir sonraki tura geçir (availableApps'te kalır)
    // Kaybeden app'i elemeden çıkar
    setAvailableApps(prev =>
      prev.filter(app => app.miniApp.domain !== loserApp.miniApp.domain)
    );

    // Eğer bu son maç değilse, kazanan app'i selectedApps'e ekleme
    // Sadece turnuva sonunda final kazananını ekleyeceğiz
  }, [currentPair]);

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!currentPair) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleChoice(currentPair[0]); // Sol app'i seç
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleChoice(currentPair[1]); // Sağ app'i seç
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPair, handleChoice]);

  // Winner is now only saved to contract via incrementScoreOnContract

  // Get next pair when available apps change
  useEffect(() => {
    if (availableApps.length >= 2) {
      const shuffled = [...availableApps].sort(() => Math.random() - 0.5);
      setCurrentPair([shuffled[0], shuffled[1]]);
    } else if (availableApps.length === 1) {
      // Son kalan app turnuva kazananı
      const winner = availableApps[0];
      setSelectedApps([winner]); // Sadece kazananı göster
      setAvailableApps([]);
      setCurrentPair(null);

      // Kazananı blockchain'e kaydet
      if (selectedTag && walletClient && isConnected) {
        (async () => {
          try {
            const result = await incrementScoreOnContract(winner.miniApp.id, walletClient);
            if (result.success) {
              console.log('Score incremented on blockchain:', result.hash);
            } else {
              console.error('Failed to increment score on blockchain:', result.error);
            }
          } catch (error) {
            console.error('Error incrementing score on blockchain:', error);
          }
        })();
      } else if (selectedTag && !isConnected) {
        console.log('Wallet not connected, cannot increment score on blockchain');
      }

    } else {
      setCurrentPair(null);
    }
  }, [availableApps, selectedTag]);



  const handleTap = (miniApp: MiniApp) => {
    openUrl(miniApp.miniApp.homeUrl);
  };

  const resetTournament = () => {
    if (selectedTag) {
      const filteredApps = miniApps.filter(app => {
        const appTags = [
          ...(app.miniApp.tags || []),
          ...(app.miniApp.primaryCategory ? [app.miniApp.primaryCategory] : [])
        ];
        return appTags.some(tag => normalizeTag(tag) === selectedTag);
      });
      setAvailableApps([...filteredApps]);
    }
    setSelectedApps([]);
    setCurrentPair(null);
  };

  if (!miniApps || miniApps.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No mini apps available
      </div>
    );
  }

  // Show tag selection screen
  if (showTagSelection) {
    const availableTags = getAllTags();

    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">🏆 Choose Tournament Category</h3>
          <p className="text-gray-600 text-sm">Select a category to start the tournament</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Tournament Category
          </label>
          <select
            onChange={(e) => e.target.value && handleTagSelect(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            defaultValue=""
          >
            <option value="" disabled>
              Choose a category...
            </option>
            {availableTags.map(({ tag, count }) => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)} ({count} apps)
              </option>
            ))}
          </select>
        </div>

        {availableTags.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Not enough apps for tournaments (need at least 10 apps per category)
          </div>
        )}
      </div>
    );
  }

  // Tournament finished
  if (availableApps.length === 0 && selectedApps.length > 0) {
    const categoryName = selectedTag ? selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1) : 'Tournament';
    const winner = selectedApps[0];

    return (
      <div className="text-center space-y-6">
        {/* Winner Card */}
        <div className="max-w-xs mx-auto">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-1 rounded-xl">
            <MiniAppCard miniApp={winner} onTap={() => handleTap(winner)} />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-bold text-gray-900">{winner.miniApp.name}</h4>
          <p className="text-sm text-gray-600">by {winner.miniApp.author.displayName}</p>
          {winner.miniApp.description && (
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {winner.miniApp.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 justify-center">
          <div className="flex gap-2 justify-center">
            <Button onClick={resetToTagSelection} variant="outline">
              Choose New Category
            </Button>
            <Button onClick={resetTournament}>
              Restart {categoryName}
            </Button>
          </div>
          {setActiveTab && (
            <Button
              onClick={() => setActiveTab("scores")}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              🏆 View Top Scores
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!currentPair) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Loading next match...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {selectedTag ? selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1) : 'Tournament'}
        </h3>
        <p className="text-sm text-gray-600 mb-2">Choose your favorite</p>
      </div>

      {/* VS Display */}
      <div className="flex items-center justify-center space-x-4">
        {/* Left App */}
        <div
          className="w-40 cursor-pointer transform transition-transform hover:scale-105"
          onClick={() => handleChoice(currentPair[0])}
        >
          <MiniAppCard miniApp={currentPair[0]} onTap={() => handleTap(currentPair[0])} />
        </div>

        {/* VS */}
        <div className="text-2xl font-bold text-gray-400">VS</div>

        {/* Right App */}
        <div
          className="w-40 cursor-pointer transform transition-transform hover:scale-105"
          onClick={() => handleChoice(currentPair[1])}
        >
          <MiniAppCard miniApp={currentPair[1]} onTap={() => handleTap(currentPair[1])} />
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 space-y-1">
        <div>Tap on your preferred app to continue</div>
        <div>Use ← → arrow keys to choose</div>
      </div>
    </div>
  );
};
