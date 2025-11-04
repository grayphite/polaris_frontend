import React, { createContext, useContext, useState } from 'react';
import { InvitationsResponse } from '../services/invitationService';

type InvitationsContextValue = {
  invitationsResponse: InvitationsResponse | null;
  setInvitationsResponse: (response: InvitationsResponse | null) => void;
  invitationCount: number;
};

const InvitationsContext = createContext<InvitationsContextValue | undefined>(undefined);

export const InvitationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invitationsResponse, setInvitationsResponse] = useState<InvitationsResponse | null>(null);

  const invitationCount = invitationsResponse?.pagination.total || 0;

  const value: InvitationsContextValue = {
    invitationsResponse,
    setInvitationsResponse,
    invitationCount,
  };

  return <InvitationsContext.Provider value={value}>{children}</InvitationsContext.Provider>;
};

export const useInvitations = (): InvitationsContextValue => {
  const context = useContext(InvitationsContext);
  if (context === undefined) {
    throw new Error('useInvitations must be used within an InvitationsProvider');
  }
  return context;
};

