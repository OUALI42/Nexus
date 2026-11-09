import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "./password-strength";

// Same rule as the backend username_validator.
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;

export const registerFormSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(
      z.email({
        error: "Saisis une adresse e-mail valide, par exemple nom@exemple.fr.",
      }),
    ),
  password: z.string().min(PASSWORD_MIN_LENGTH, {
    error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
  }),
  username: z.string().trim().regex(USERNAME_PATTERN, {
    error:
      "3 à 30 caractères : lettres sans accent, chiffres, points, tirets ou tirets bas.",
  }),
  track: z.string().min(1, { error: "Choisis ta filière." }),
  privacyPolicyAccepted: z.boolean().refine((accepted) => accepted, {
    error:
      "Tu dois accepter la politique de confidentialité pour créer un compte.",
  }),
});

export type RegisterFormValues = z.input<typeof registerFormSchema>;
export type RegisterFormData = z.output<typeof registerFormSchema>;
