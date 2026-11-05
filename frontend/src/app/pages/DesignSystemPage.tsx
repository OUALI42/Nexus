import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";

export function DesignSystemPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">Design system</h1>
        <p className="text-fg-muted">
          Composants et états, à vérifier dans les deux thèmes.
        </p>
        <ThemeSwitcher />
      </header>

      <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold">Boutons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Générer une fiche</Button>
          <Button variant="ai">Demander à l'IA</Button>
          <Button variant="outline">Annuler</Button>
          <Button variant="danger">Supprimer</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Petit</Button>
          <Button isLoading>Génération…</Button>
          <Button disabled>Désactivé</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold">Champs</h2>
        <Input label="Adresse e-mail" type="email" required />
        <Input
          label="Mot de passe"
          type="password"
          hint="10 caractères minimum."
          required
        />
        <Input
          label="Nom du casier"
          defaultValue="M"
          error="Le nom doit contenir au moins 2 caractères."
        />
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold">Fenêtre modale</h2>
        <div>
          <Button
            variant="outline"
            onClick={() => {
              setModalOpen(true);
            }}
          >
            Supprimer le casier
          </Button>
        </div>
        <Modal
          open={isModalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
          title="Supprimer le casier ?"
          description="Les documents qu'il contient seront conservés."
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setModalOpen(false);
                }}
              >
                Supprimer
              </Button>
            </>
          }
        >
          <Input label="Tape le nom du casier pour confirmer" />
        </Modal>
      </section>
    </div>
  );
}
