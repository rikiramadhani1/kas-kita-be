import { z } from "zod";

export const createCashflowSchema = z.object({
  source: z.enum(["income", "expense"], {
    required_error: "source wajib diisi",
    invalid_type_error: "source harus 'income' atau 'expense'",
  }),
  amount: z
    .number({ required_error: "amount wajib diisi",
        invalid_type_error: "amount harus berupa angka" })
    .positive("amount harus lebih dari 0"),
  description: z
    .string({ required_error: "description wajib diisi" })
    .min(1, "description tidak boleh kosong"),
  type: z.enum(["in", "out"], {
    required_error: "type wajib diisi",
    invalid_type_error: "type harus 'income' atau 'expense'",
  }),
});

export type CreateCashflowDTO = z.infer<typeof createCashflowSchema>;
