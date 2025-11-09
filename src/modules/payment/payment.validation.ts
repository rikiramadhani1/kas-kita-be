import { z } from "zod";

export const createPaymentSchema = z.object({
  months: z
    .number({ required_error: "bulan wajib diisi", invalid_type_error: "bulan harus angka" })
    .positive("amount harus > 0")
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
