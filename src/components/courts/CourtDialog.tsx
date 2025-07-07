import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Court = {
  id?: string;
  name: string;
  background_color?: string;
  logo_url?: string;
  court_number?: number;
};

type CourtDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Court | null;
  onSave: () => void;
};

export default function CourtDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: CourtDialogProps) {
  const [name, setName] = useState("");
  const [courtNumber, setCourtNumber] = useState<string>(""); // string zodat we ook "" kunnen afvangen
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCourtNumber(initialData.court_number?.toString() || "");
    } else {
      setName("");
      setCourtNumber("");
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!name) return;

    setLoading(true);

    const payload = {
      name,
      court_number: courtNumber !== "" ? parseInt(courtNumber, 10) : null,
    };

    let response;
    if (initialData?.id) {
      response = await supabase
        .from("courts")
        .update(payload)
        .eq("id", initialData.id);
    } else {
      response = await supabase.from("courts").insert([payload]);
    }

    setLoading(false);

    if (response.error) {
      toast({
        title: "Fout bij opslaan",
        description: response.error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Baan opgeslagen" });
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Bewerk Baan" : "Nieuwe Baan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Naam</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Naam van de baan"
            />
          </div>

          <div>
            <Label>Baannummer (uniek)</Label>
            <Input
              type="number"
              value={courtNumber}
              onChange={(e) => setCourtNumber(e.target.value)}
              placeholder="Bijv. 1"
              min={1}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
