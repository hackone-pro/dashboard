// src/utils/toast.ts
import { toast } from "react-toastify";

export const toastSuccess = (msg: string) =>
    toast.success(msg, {
        position: 'top-right',
        theme: 'dark',
    })

export const toastError = (msg: string) =>
    toast.error(msg, {
        position: 'top-right',
        theme: 'dark',
    })