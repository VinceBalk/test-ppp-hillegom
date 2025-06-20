
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  description: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, description');

      if (error) throw error;

      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = JSON.parse(setting.value);
        return acc;
      }, {} as Record<string, string>);

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Fout',
        description: 'Kon instellingen niet laden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(settingsToUpdate, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: 'Opgeslagen',
        description: 'Instellingen zijn succesvol opgeslagen.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Fout',
        description: 'Kon instellingen niet opslaan.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-muted-foreground">
          Beheer de systeem instellingen en configuratie
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Uitstraling</CardTitle>
            <CardDescription>
              Pas het uiterlijk van de applicatie aan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Lettertype Familie</Label>
              <Input
                id="fontFamily"
                value={settings.fontFamily || ''}
                onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                placeholder="Inter, sans-serif"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontSize">Lettergrootte</Label>
              <Input
                id="fontSize"
                value={settings.fontSize || ''}
                onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                placeholder="16px"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="headingColor">Kop Kleur</Label>
              <Input
                id="headingColor"
                type="color"
                value={settings.headingColor || '#1f2937'}
                onChange={(e) => handleSettingChange('headingColor', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paragraphColor">Tekst Kleur</Label>
              <Input
                id="paragraphColor"
                type="color"
                value={settings.paragraphColor || '#6b7280'}
                onChange={(e) => handleSettingChange('paragraphColor', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primaire Kleur</Label>
              <Input
                id="primaryColor"
                type="color"
                value={settings.primaryColor || '#3b82f6'}
                onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Achtergrond Kleur</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={settings.backgroundColor || '#ffffff'}
                onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Layout</CardTitle>
            <CardDescription>
              Configureer de layout instellingen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spacing">Ruimte</Label>
              <Input
                id="spacing"
                value={settings.spacing || ''}
                onChange={(e) => handleSettingChange('spacing', e.target.value)}
                placeholder="1rem"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="borderColor">Rand Kleur</Label>
              <Input
                id="borderColor"
                type="color"
                value={settings.borderColor || '#e5e7eb'}
                onChange={(e) => handleSettingChange('borderColor', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="borderWidth">Rand Breedte</Label>
              <Input
                id="borderWidth"
                value={settings.borderWidth || ''}
                onChange={(e) => handleSettingChange('borderWidth', e.target.value)}
                placeholder="1px"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="borderRadius">Rand Radius</Label>
              <Input
                id="borderRadius"
                value={settings.borderRadius || ''}
                onChange={(e) => handleSettingChange('borderRadius', e.target.value)}
                placeholder="0.375rem"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Configureer logo en favicon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl || ''}
                onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                value={settings.faviconUrl || ''}
                onChange={(e) => handleSettingChange('faviconUrl', e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Titel</Label>
              <Input
                id="metaTitle"
                value={settings.metaTitle || ''}
                onChange={(e) => handleSettingChange('metaTitle', e.target.value)}
                placeholder="PPP Hillegom"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tournament Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Toernooi Instellingen</CardTitle>
            <CardDescription>
              Configureer toernooi gerelateerde instellingen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rankingType">Ranking Type</Label>
              <Select
                value={settings.rankingType || 'handmatig'}
                onValueChange={(value) => handleSettingChange('rankingType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer ranking type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handmatig">Handmatig</SelectItem>
                  <SelectItem value="automatisch">Automatisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Opslaan...' : 'Instellingen Opslaan'}
        </Button>
      </div>
    </div>
  );
}
