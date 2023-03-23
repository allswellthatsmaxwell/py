import React from 'react';

const HeaderContext = React.createContext({
  user: null,
  selectedTopic: null,
  setSelectedTopic: (selectedTopic: any) => {},
  historySelected: false,
  setHistorySelected: (historySelected: boolean) => {}
});

export const HeaderProvider = HeaderContext.Provider;
export const HeaderConsumer = HeaderContext.Consumer;
export default HeaderContext;