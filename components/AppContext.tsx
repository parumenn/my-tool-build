import React, { createContext } from 'react';

interface AppContextType {
  showAds: boolean;
  setShowAds: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContextType>({
  showAds: true,
  setShowAds: () => {},
});

export const WorkspaceContext = createContext<boolean>(false);
