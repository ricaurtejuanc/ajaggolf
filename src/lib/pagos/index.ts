import type { MetodoPago } from "@/types/database";

/**
 * Abstracción de método de pago. El resto de la app (carrito, checkout,
 * estados de pedidos_pago) no conoce los detalles de "Bizum": solo pide
 * instrucciones a un proveedor y avanza el pedido por los mismos estados
 * (pendiente_confirmacion -> marcado_pagado -> confirmado).
 *
 * Añadir Stripe en el futuro es implementar este interfaz y registrarlo en
 * `proveedoresPago`; Stripe normalmente saltaría directo a "confirmado" vía
 * webhook en lugar de pasar por "marcado_pagado" (confirmación manual), pero
 * ese matiz vive dentro del proveedor, no en el resto del flujo.
 */
export interface InstruccionesPago {
  titulo: string;
  pasos: string[];
  /** true si el usuario debe marcar manualmente "ya he pagado" (flujo Bizum). */
  requiereConfirmacionManual: boolean;
}

export interface ProveedorPago {
  metodo: MetodoPago;
  obtenerInstrucciones(args: {
    totalCents: number;
    bizumNumero?: string;
    ubicacionConfirmacion?: string;
  }): InstruccionesPago;
}

const bizumProvider: ProveedorPago = {
  metodo: "bizum",
  obtenerInstrucciones({ totalCents, bizumNumero, ubicacionConfirmacion }) {
    const numero = bizumNumero ?? "633 88 10 27 4";
    const ubicacion = ubicacionConfirmacion ?? "tu área de usuario";
    return {
      titulo: "Paga con Bizum",
      pasos: [
        `Haz un Bizum de ${(totalCents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} al número ${numero}.`,
        "Indica tu nombre y el nombre del torneo en el concepto.",
        `Cuando lo hayas enviado, pulsa "Ya he pagado" en ${ubicacion}.`,
        "El organizador confirmará el ingreso y tu inscripción quedará en firme.",
      ],
      requiereConfirmacionManual: true,
    };
  },
};

const transferenciaProvider: ProveedorPago = {
  metodo: "transferencia",
  obtenerInstrucciones({ totalCents }) {
    return {
      titulo: "Paga con transferencia",
      pasos: [
        `Realiza una transferencia de ${(totalCents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}.`,
        "Incluye tu nombre y el nombre del torneo en el concepto.",
        "El organizador confirmará el ingreso y tu inscripción quedará en firme.",
      ],
      requiereConfirmacionManual: true,
    };
  },
};

const tarjetaProvider: ProveedorPago = {
  metodo: "tarjeta",
  obtenerInstrucciones() {
    return {
      titulo: "Pago con tarjeta",
      pasos: ["Esta opción de pago estará disponible próximamente."],
      requiereConfirmacionManual: false,
    };
  },
};

const clubProvider: ProveedorPago = {
  metodo: "club",
  obtenerInstrucciones() {
    return {
      titulo: "Pago en el club",
      pasos: ["Paga directamente en el club el día del torneo. Tu inscripción ya está confirmada."],
      requiereConfirmacionManual: false,
    };
  },
};

export const proveedoresPago: Record<MetodoPago, ProveedorPago> = {
  bizum: bizumProvider,
  transferencia: transferenciaProvider,
  tarjeta: tarjetaProvider,
  // stripe: se añadirá aquí implementando ProveedorPago sin tocar el resto del flujo.
  stripe: bizumProvider,
  club: clubProvider,
};

export function obtenerProveedorPago(metodo: MetodoPago): ProveedorPago {
  return proveedoresPago[metodo];
}
