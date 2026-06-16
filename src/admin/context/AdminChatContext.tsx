import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminChatWidget } from '@/admin/components/layout/AdminChatWidget';

interface AdminChatContextValue {
  isOpen: boolean;
  openChat: (caregiverId?: string) => void;
  closeChat: () => void;
  selectedCaregiverId: string | null;
  setSelectedCaregiverId: (id: string | null) => void;
}

const AdminChatContext = createContext<AdminChatContextValue | null>(null);

export function AdminChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const openChat = useCallback((caregiverId?: string) => {
    setIsOpen(true);
    if (caregiverId) setSelectedCaregiverId(caregiverId);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const messageId = params.get('message');
    if (!messageId) return;

    openChat(messageId);
    params.delete('message');
    const nextSearch = params.toString();
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, openChat]);

  const value = useMemo(
    () => ({
      isOpen,
      openChat,
      closeChat,
      selectedCaregiverId,
      setSelectedCaregiverId,
    }),
    [isOpen, openChat, closeChat, selectedCaregiverId],
  );

  return (
    <AdminChatContext.Provider value={value}>
      {children}
      <AdminChatWidget
        open={isOpen}
        selectedId={selectedCaregiverId}
        onOpen={() => setIsOpen(true)}
        onClose={closeChat}
        onSelectId={setSelectedCaregiverId}
      />
    </AdminChatContext.Provider>
  );
}

export function useAdminChat() {
  const context = useContext(AdminChatContext);
  if (!context) {
    throw new Error('useAdminChat must be used within AdminChatProvider');
  }
  return context;
}
