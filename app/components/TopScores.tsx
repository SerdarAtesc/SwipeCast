"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./DemoComponents";
import { getAllAppsSortedByScore, type ContractScore, type GameScore } from "../../lib/contract";

interface TopScoresProps {
  setActiveTab: (tab: string) => void;
}

interface MiniAppData {
  miniApp: {
    domain: string;
    name: string;
    iconUrl: string;
    author: {
      displayName: string;
    };
    id:string;
    tags?: string[];
    primaryCategory?: string;
  };
  rank: number;
}

interface EnrichedGameScore extends GameScore {
  miniApp?: {
    name: string;
    iconUrl: string;
    author: {
      displayName: string;
    };
    domain: string;
    description?: string;
  };
}

export function TopScores({ setActiveTab }: TopScoresProps) {
  const [scores, setScores] = useState<EnrichedGameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [miniAppsData, setMiniAppsData] = useState<MiniAppData[]>([]);

  // Enrich scores with mini app data
  const enrichScoresWithAppData = (scores: GameScore[], miniApps: MiniAppData[]): EnrichedGameScore[] => {
    console.log('Enriching scores with app data...',scores);
    console.log('With mini apps data:', miniApps);
    return scores.map(score => {
      // Try multiple matching strategies
      let miniApp = miniApps.find(app => app.miniApp.id === score.id);

      // If not found by domain, try by app_id
      if (!miniApp && score.app_id) {
        miniApp = miniApps.find(app => app.miniApp.domain === score.app_id);
      }

      // If still not found, try by app_name
      if (!miniApp && score.app_name) {
        miniApp = miniApps.find(app =>
          app.miniApp.name.toLowerCase() === score.app_name.toLowerCase()
        );
      }

      // Debug log for troubleshooting
      if (!miniApp) {
        console.log('No match found for score:', {
          app_id: score.app_id,
          app_name: score.app_name,
          app_domain: score.app_domain,
          availableDomains: miniApps.slice(0, 5).map(app => app.miniApp.domain)
        });
      }

      return {
        ...score,
        miniApp: miniApp?.miniApp
      };
    });
  };

  // Convert contract scores to GameScore format
  const convertContractScoresToGameScores = (contractScores: ContractScore[], miniApps: MiniAppData[]): GameScore[] => {
    return contractScores.map(contractScore => {
      const miniApp = miniApps.find(app => app.miniApp.id === contractScore.appId);
      return {
        id: contractScore.appId,
        app_id: contractScore.appId,
        app_name: miniApp?.miniApp.name || 'Unknown App',
        app_domain: miniApp?.miniApp.domain || '',
        category: miniApp?.miniApp.primaryCategory || 'uncategorized',
        score: Number(contractScore.score),
        wins: Number(contractScore.score), // Contract sadece score tutuyor, wins olarak aynı değeri kullanıyoruz
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  };

  // Load scores from contract only
  const loadScores = async (category: string = "all") => {
    setLoading(true);
    try {
      console.log('Loading scores from contract for category:', category);

      // Contract'tan tüm app'leri ve score'larını al
      const contractScores = await getAllAppsSortedByScore();
      console.log('Raw scores from contract:', contractScores.slice(0, 3));

      if (contractScores.length === 0) {
        console.log('No scores found in contract');
        setScores([]);
        return;
      }

      // Contract score'larını GameScore formatına çevir
      let gameScores = convertContractScoresToGameScores(contractScores, miniAppsData);

      // Category filter uygula
      if (category !== "all") {
        gameScores = gameScores.filter(score => score.category === category);
      }

      // Score'a göre sırala
      gameScores.sort((a, b) => b.score - a.score);

      // Limit uygula
      const limit = category === "all" ? 50 : 20;
      gameScores = gameScores.slice(0, limit);

      console.log('Processed scores:', gameScores.slice(0, 3));

      // Enrich with mini app data
      const enrichedScores = enrichScoresWithAppData(gameScores, miniAppsData);
      console.log('Enriched scores:', enrichedScores.slice(0, 3));
      setScores(enrichedScores);
    } catch (error) {
      console.error('Failed to load scores from contract:', error);
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  // Load categories from mini apps data
  const loadCategories = async () => {
    try {
      if (!miniAppsData || miniAppsData.length === 0) {
        console.log('No mini apps data available for categories');
        return;
      }

      // Mini apps data'dan kategorileri çıkar
      const uniqueCategories = [...new Set(
        miniAppsData
          .map((app: MiniAppData) => app.miniApp.primaryCategory)
          .filter(Boolean)
      )] as string[];

      setCategories(uniqueCategories.sort());
      console.log('Loaded categories:', uniqueCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Load mini apps data
  const loadMiniAppsData = async () => {
    try {
      const response = await fetch('/data.json');
      const data = await response.json();
      const miniApps = data.result.miniApps || [];
      console.log('Loaded mini apps:', miniApps.length, 'apps');
      console.log('Sample domains:', miniApps.slice(0, 3).map((app: MiniAppData) => app.miniApp.domain));
      setMiniAppsData(miniApps);
    } catch (error) {
      console.error('Failed to load mini apps data:', error);
    }
  };

  useEffect(() => {
    loadMiniAppsData();
  }, []);

  useEffect(() => {
    if (miniAppsData.length > 0) {
      loadCategories();
      loadScores();
    }
  }, [miniAppsData]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    loadScores(category);
  };

  const getRankIcon = (index: number) => {
    if (typeof index !== 'number' || isNaN(index)) return "#?";

    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `#${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    if (typeof index !== 'number' || isNaN(index)) return "text-gray-500 bg-gray-50";

    switch (index) {
      case 0: return "text-yellow-600 bg-yellow-50";
      case 1: return "text-gray-600 bg-gray-50";
      case 2: return "text-orange-600 bg-orange-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("swipe")}
        >
          ← Back to Tournament
        </Button>
        <h2 className="text-xl font-semibold text-[var(--app-foreground)]">🏆 Top Scores</h2>
        <div className="w-16"></div>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading scores...</div>
        </div>
      )}

      {/* Scores List */}
      {!loading && (
        <div className="space-y-3">
          {scores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No scores found for this category
            </div>
          ) : (
            scores.map((score, index) => (
              <div
                key={score.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                  index < 3 ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-gray-200 bg-white'
                }`}
              >
                {/* Rank and App Info */}
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(index)}`}>
                    {getRankIcon(index)}
                  </div>

                  {/* App Icon */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                    {score.miniApp?.iconUrl ? (
                      <img
                        src={score.miniApp.iconUrl}
                        alt={score.miniApp.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTIiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0zIDkgOS03IDkgN3YxMWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">📱</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {score.miniApp?.name || score.app_name || 'Unknown App'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {score.miniApp?.author?.displayName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {score.category || 'uncategorized'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{score.score || 0}</div>
                  <div className="text-sm text-gray-500">{score.wins || 0} wins</div>
                  <div className="text-xs text-gray-400">
                    {score.updated_at ? new Date(score.updated_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Summary */}
      {!loading && scores.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Apps:</span>
              <span className="font-medium ml-2">{scores.length || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Top Score:</span>
              <span className="font-medium ml-2">{scores[0]?.score || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Total Wins:</span>
              <span className="font-medium ml-2">{scores.reduce((sum, score) => sum + (score.wins || 0), 0)}</span>
            </div>
            <div>
              <span className="text-blue-700">Category:</span>
              <span className="font-medium ml-2 capitalize">
                {selectedCategory === "all" ? "All" : (selectedCategory || "Unknown")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <Button
          onClick={() => loadScores(selectedCategory)}
          variant="outline"
          disabled={loading}
        >
          🔄 Refresh Scores
        </Button>
      </div>
    </div>
  );
}
