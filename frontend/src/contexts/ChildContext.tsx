import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface ChildData {
  child_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  age_months: number;
  allergies?: {
    confirmed: string[];
    suspected: string[];
  };
  medications?: string[];
  family_history?: {
    allergies: string[];
    conditions: string[];
  };
}

interface ChildContextType {
  children: ChildData[];
  selectedChild: ChildData | null;
  selectedChildId: string;
  setSelectedChildId: (childId: string) => void;
  loadChildren: () => Promise<void>;
  loading: boolean;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

interface ChildProviderProps {
  children: ReactNode;
}

export const ChildProvider: React.FC<ChildProviderProps> = ({ children }) => {
  const [childrenList, setChildrenList] = useState<ChildData[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const selectedChild = childrenList.find(child => child.child_id === selectedChildId) || null;

  const loadChildren = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading children from ChildContext...');
      const childrenData = await firebaseService.getUserChildren();
      console.log('Loaded children:', childrenData);
      
      setChildrenList(childrenData);
      
      // Auto-select first child if none selected
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].child_id);
      }
      
      // If currently selected child is no longer available, select first available
      if (selectedChildId && !childrenData.find(child => child.child_id === selectedChildId)) {
        setSelectedChildId(childrenData.length > 0 ? childrenData[0].child_id : '');
      }
    } catch (error) {
      console.error('Failed to load children in ChildContext:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load children when context mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadChildren();
    } else {
      setChildrenList([]);
      setSelectedChildId('');
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const value: ChildContextType = {
    children: childrenList,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    loadChildren,
    loading,
  };

  return (
    <ChildContext.Provider value={value}>
      {children}
    </ChildContext.Provider>
  );
};

export const useChild = (): ChildContextType => {
  const context = useContext(ChildContext);
  if (context === undefined) {
    throw new Error('useChild must be used within a ChildProvider');
  }
  return context;
};
