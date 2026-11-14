"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";

export function useUpdatePasswordFields() {
  return useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
    },
  });
}
