import { useProjectStore } from "@/stores/projectStore";

export function Header() {
  const { filters, setFilters } = useProjectStore();

  const handleLogoUpload = () => {
    // Placeholder for logo upload functionality
    console.log("Logo upload clicked");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-gradient-to-r from-background to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-start">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Logo placeholder with upload functionality */}
            <img 
              src="/kubik-logo.png" 
              alt="KUBIK ENG" 
              className="h-16 w-auto"
            />
            
            <div>
              <h1 className="text-3xl font-bold text-foreground">Project Tracker</h1>
              <p className="text-sm text-muted-foreground">Controle de Documentos</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}