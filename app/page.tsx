"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/DemoComponents";
import { Icon } from "./components/DemoComponents";
import { Home } from "./components/DemoComponents";
import { Features } from "./components/DemoComponents";
import { Swipe } from "./components/DemoComponents";
import { TopScores } from "./components/TopScores";
import { sdk } from '@farcaster/miniapp-sdk'

// Client-side'da ready signal gönder
if (typeof window !== 'undefined') {
  console.log('Sending Farcaster SDK ready signal...');
  try {
    sdk.actions.ready();
    console.log('Farcaster SDK ready signal sent!');
  } catch (error) {
    console.error('Error sending ready signal:', error);
  }
}

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("swipe"); // Direkt swipe ekranına başla
  const [appReady, setAppReady] = useState(false);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  // Backup ready signal - component mount olduğunda tekrar gönder
  useEffect(() => {
    const sendBackupReady = async () => {
      console.log('Component mounted, sending backup ready signal...');
      try {
        await sdk.actions.ready();
        console.log('Backup ready signal sent!');
      } catch (error) {
        console.error('Error sending backup ready signal:', error);
      }
    };

    sendBackupReady();
  }, []);

  useEffect(() => {
    // MiniKit SDK'ya app'in hazır olduğunu bildir
    const initializeApp = async () => {
      try {
        if (!isFrameReady) {
          setFrameReady();
          console.log('MiniKit frame ready signal sent');
        }

        // App tamamen yüklendiğinde ready state'i set et
        setAppReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Hata olsa bile app'i ready yap
        setAppReady(true);
      }
    };

    initializeApp();
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  // App henüz hazır değilse loading göster
  if (!appReady) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">SwipeCast</h2>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="z-10">
                <ConnectWallet>
                  <Name className="text-inherit" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {activeTab === "home" && <Home setActiveTab={setActiveTab} />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
          {activeTab === "swipe" && <Swipe setActiveTab={setActiveTab} />}
          {activeTab === "scores" && <TopScores setActiveTab={setActiveTab} />}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
