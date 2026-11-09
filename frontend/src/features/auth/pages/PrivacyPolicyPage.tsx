import type { ReactNode } from "react";

import { PageHeader } from "@/shared/ui/PageHeader";

import { usePrivacyPolicy } from "../hooks";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function PrivacyPolicyPage() {
  const { data } = usePrivacyPolicy();

  return (
    <>
      <PageHeader
        title="Politique de confidentialité"
        description={data ? `Version ${data.version}` : undefined}
      />

      <div className="flex flex-col gap-8 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">
        <Section title="Qui est responsable de tes données ?">
          <p>
            Nexus est une application de révision développée dans le cadre d'un
            projet de fin d'études par [ton nom]. Pour toute question sur tes
            données, écris à [adresse de contact].
          </p>
        </Section>

        <Section title="Quelles données sont collectées ?">
          <ul>
            <li>Ton adresse e-mail, pour te connecter et te contacter.</li>
            <li>
              Ton mot de passe, uniquement sous une forme chiffrée de façon
              irréversible : personne ne peut le lire, pas même nous.
            </li>
            <li>Ton nom d'utilisateur et ta filière.</li>
            <li>
              Les cours et documents que tu déposes, ainsi que les fiches et les
              QCM générés à partir d'eux.
            </li>
            <li>
              La date et la version de cette politique que tu as acceptée.
            </li>
          </ul>
          <p>
            Nous ne collectons que ce qui est nécessaire au fonctionnement de
            Nexus. Ton prénom et ton nom ne sont pas demandés à l'inscription.
          </p>
        </Section>

        <Section title="Pourquoi ces données sont-elles utilisées ?">
          <ul>
            <li>Créer et sécuriser ton compte.</li>
            <li>
              Générer des fiches de révision et des QCM à partir de tes
              documents, grâce à une intelligence artificielle.
            </li>
            <li>
              Suivre ta progression et t'envoyer les e-mails liés à ton compte.
            </li>
          </ul>
          <p>
            Tes données ne sont jamais vendues, ni utilisées à des fins
            publicitaires.
          </p>
        </Section>

        <Section title="Qui reçoit tes données ?">
          <p>
            Pour générer tes fiches et tes QCM, le contenu de tes documents est
            envoyé à Mistral AI, un fournisseur d'intelligence artificielle dont
            les serveurs sont situés dans l'Union européenne. Nexus est hébergé
            en Union européenne par [hébergeur].
          </p>
        </Section>

        <Section title="Combien de temps sont-elles conservées ?">
          <p>
            Tes données sont conservées tant que ton compte existe. Lorsque tu
            supprimes ton compte, toutes tes données, documents compris, sont
            effacées définitivement. Les liens de vérification d'adresse e-mail
            expirent au bout de 24 heures.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Nexus utilise uniquement deux cookies strictement nécessaires : un
            cookie de session, pour te garder connecté, et un cookie de sécurité
            contre la falsification de requêtes. Aucun cookie de mesure
            d'audience ni de publicité n'est utilisé.
          </p>
        </Section>

        <Section title="Quels sont tes droits ?">
          <p>
            Tu peux à tout moment accéder à tes données, les corriger, les
            supprimer, en obtenir une copie ou t'opposer à leur traitement, en
            écrivant à [adresse de contact]. Si tu estimes que tes droits ne
            sont pas respectés, tu peux adresser une réclamation à la CNIL
            (cnil.fr).
          </p>
        </Section>
      </div>
    </>
  );
}
