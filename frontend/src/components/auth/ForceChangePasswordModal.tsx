import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MINIMUM_PASSWORD_LENGTH = 8;

const passwordRules = (password: string) => [
  { label: "Pelo menos 8 caracteres", met: password.length >= MINIMUM_PASSWORD_LENGTH },
  { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
  { label: "Letra minúscula", met: /[a-z]/.test(password) },
  { label: "Número", met: /[0-9]/.test(password) },
];

const ForceChangePasswordModal = () => {
  const { userProfile, changePassword } = useAuthStore();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = userProfile?.must_change_password === true;

  const rules = passwordRules(newPassword);
  const allRulesMet = rules.every((r) => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesMet && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const result = await changePassword(newPassword);
      if (result.success) {
        toast({
          title: "Senha alterada com sucesso",
          description: "Sua senha foi atualizada. Bem-vindo ao sistema!",
        });
      } else {
        toast({
          title: "Erro ao alterar senha",
          description: result.error || "Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/80 animate-in fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-[9999] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-background p-6 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <div>
              <DialogPrimitive.Title className="text-xl font-semibold">
                Defina sua nova senha
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                Por segurança, você precisa criar uma senha pessoal antes de continuar.
              </DialogPrimitive.Description>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength rules */}
              {newPassword.length > 0 && (
                <ul className="grid grid-cols-2 gap-1 pt-1">
                  {rules.map((rule) => (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        rule.met ? "text-green-600" : "text-muted-foreground"
                      )}
                    >
                      <ShieldCheck
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          rule.met ? "text-green-600" : "text-muted-foreground/40"
                        )}
                      />
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "pr-10",
                    confirmPassword.length > 0 &&
                      (passwordsMatch ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive")
                  )}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default ForceChangePasswordModal;
