const SERVICES = [
  { id: "vpn", name: "VPN", aliases: ["vpn"] },
  { id: "email", name: "E-mail", aliases: ["email", "correio"] },
  {
    id: "servers",
    name: "Servidores",
    aliases: ["servers", "server", "servidor", "servidores"],
  },
  {
    id: "wifi",
    name: "Wi-Fi corporativo",
    aliases: ["wifi", "wireless"],
  },
] as const;

function normalizeServiceName(serviceName: string) {
  return serviceName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function checkSystemStatus(serviceName?: string) {
  const requestedService = serviceName
    ? normalizeServiceName(serviceName)
    : undefined;
  const selectedServices = requestedService
    ? SERVICES.filter((service) =>
        service.aliases.some((alias) => requestedService.includes(alias)),
      )
    : [...SERVICES];

  if (selectedServices.length === 0) {
    return {
      recognized: false as const,
      source: "not_integrated" as const,
      availableServices: SERVICES.map(({ id, name }) => ({ id, name })),
      message:
        "Serviço não reconhecido. Nenhum status operacional foi consultado.",
    };
  }

  return {
    recognized: true as const,
    checkedAt: new Date().toISOString(),
    source: "not_integrated" as const,
    services: selectedServices.map((service) => ({
      id: service.id,
      name: service.name,
      status: "UNKNOWN" as const,
    })),
    message:
      "Não há integração de monitoramento configurada. O status em tempo real não pode ser confirmado.",
  };
}
