
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Court {
  id: string;
  name: string;
  background_color?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching courts:', error);
        toast({
          title: "Fout",
          description: "Kon banen niet laden",
          variant: "destructive",
        });
        return;
      }

      setCourts(data || []);
    } catch (error) {
      console.error('Error in fetchCourts:', error);
      toast({
        title: "Fout",
        description: "Kon banen niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCourt = async (courtData: Omit<Court, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .insert([courtData])
        .select()
        .single();

      if (error) {
        console.error('Error creating court:', error);
        toast({
          title: "Fout",
          description: "Kon baan niet aanmaken",
          variant: "destructive",
        });
        return null;
      }

      setCourts(prev => [...prev, data]);
      toast({
        title: "Succes",
        description: "Baan succesvol aangemaakt",
      });
      return data;
    } catch (error) {
      console.error('Error in createCourt:', error);
      toast({
        title: "Fout",
        description: "Kon baan niet aanmaken",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCourt = async (id: string, updates: Partial<Court>) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating court:', error);
        toast({
          title: "Fout",
          description: "Kon baan niet bijwerken",
          variant: "destructive",
        });
        return null;
      }

      setCourts(prev => prev.map(court => court.id === id ? data : court));
      toast({
        title: "Succes",
        description: "Baan succesvol bijgewerkt",
      });
      return data;
    } catch (error) {
      console.error('Error in updateCourt:', error);
      toast({
        title: "Fout",
        description: "Kon baan niet bijwerken",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCourt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting court:', error);
        toast({
          title: "Fout",
          description: "Kon baan niet verwijderen",
          variant: "destructive",
        });
        return false;
      }

      setCourts(prev => prev.filter(court => court.id !== id));
      toast({
        title: "Succes",
        description: "Baan succesvol verwijderd",
      });
      return true;
    } catch (error) {
      console.error('Error in deleteCourt:', error);
      toast({
        title: "Fout",
        description: "Kon baan niet verwijderen",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  return {
    courts,
    loading,
    createCourt,
    updateCourt,
    deleteCourt,
    refetch: fetchCourts
  };
}
