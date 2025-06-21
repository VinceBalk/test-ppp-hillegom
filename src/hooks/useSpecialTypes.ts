
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpecialType {
  id: string;
  name: string;
  is_tiebreaker: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSpecialTypes() {
  const [specialTypes, setSpecialTypes] = useState<SpecialType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSpecialTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('special_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching special types:', error);
        toast({
          title: "Fout",
          description: "Kon specials niet laden",
          variant: "destructive",
        });
        return;
      }

      setSpecialTypes(data || []);
    } catch (error) {
      console.error('Error in fetchSpecialTypes:', error);
      toast({
        title: "Fout",
        description: "Kon specials niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSpecialType = async (specialData: Omit<SpecialType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('special_types')
        .insert([specialData])
        .select()
        .single();

      if (error) {
        console.error('Error creating special type:', error);
        toast({
          title: "Fout",
          description: "Kon special niet aanmaken",
          variant: "destructive",
        });
        return null;
      }

      setSpecialTypes(prev => [...prev, data]);
      toast({
        title: "Succes",
        description: "Special succesvol aangemaakt",
      });
      return data;
    } catch (error) {
      console.error('Error in createSpecialType:', error);
      toast({
        title: "Fout",
        description: "Kon special niet aanmaken",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSpecialType = async (id: string, updates: Partial<SpecialType>) => {
    try {
      const { data, error } = await supabase
        .from('special_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating special type:', error);
        toast({
          title: "Fout",
          description: "Kon special niet bijwerken",
          variant: "destructive",
        });
        return null;
      }

      setSpecialTypes(prev => prev.map(special => special.id === id ? data : special));
      toast({
        title: "Succes",
        description: "Special succesvol bijgewerkt",
      });
      return data;
    } catch (error) {
      console.error('Error in updateSpecialType:', error);
      toast({
        title: "Fout",
        description: "Kon special niet bijwerken",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteSpecialType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('special_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting special type:', error);
        toast({
          title: "Fout",
          description: "Kon special niet verwijderen",
          variant: "destructive",
        });
        return false;
      }

      setSpecialTypes(prev => prev.filter(special => special.id !== id));
      toast({
        title: "Succes",
        description: "Special succesvol verwijderd",
      });
      return true;
    } catch (error) {
      console.error('Error in deleteSpecialType:', error);
      toast({
        title: "Fout",
        description: "Kon special niet verwijderen",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSpecialTypes();
  }, []);

  return {
    specialTypes,
    loading,
    createSpecialType,
    updateSpecialType,
    deleteSpecialType,
    refetch: fetchSpecialTypes
  };
}
