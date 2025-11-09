import { z } from "zod";

export const setPinSchema = z.object({
  pin: z
    .string({
      required_error: "PIN is required",
      invalid_type_error: "PIN must be a string",
    })
    .regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});

export type SetPinInput = z.infer<typeof setPinSchema>;


export const loginMemberSchema = z.object({
  phone: z
    .string({
      required_error: "Phone number is required",
      invalid_type_error: "Phone number must be a string",
    })
    .min(8, "Phone number must be at least 8 digits"),
  pin: z
    .string({
      required_error: "PIN is required",
      invalid_type_error: "PIN must be a string",
    })
    .regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});

export type LoginMemberInput = z.infer<typeof loginMemberSchema>;