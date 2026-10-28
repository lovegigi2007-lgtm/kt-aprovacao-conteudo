// Funções de data/hora cientes do fuso de Brasília (America/Sao_Paulo).
//
// Por que isso existe: o site roda na Vercel, cujo servidor trabalha em
// UTC, não no horário de Brasília. Qualquer conta de data "ingênua" feita
// direto com nascente Date (sem dizer o fuso) acaba, na produção, usando
// UTC — o que fazia um post marcado pra sábado à noite aparecer no domingo,
// por exemplo. O Brasil não tem mais horário de verão desde 2019, então
// aqui assumimos um deslocamento fixo de -03:00.

const FUSO = "America/Sao_Paulo";
const OFFSET_HORAS = 3; // Brasília = UTC-3, sem horário de verão

// "YYYY-MM-DD" de um timestamp (Date ou string ISO), já convertido pro
// fuso de Brasília — use isso para agrupar conteúdos por dia.
export function chaveDiaBR(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// "HH:MM" de um timestamp, no fuso de Brasília.
export function horaBR(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// Converte uma data ("YYYY-MM-DD") e hora ("HH:MM") que a pessoa digitou,
// entendendo como horário de Brasília, pro instante UTC certo pra guardar
// no banco. Não depende do fuso do servidor.
export function dataHoraBRParaUTC(data: string, hora: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, h + OFFSET_HORAS, m));
}

// "YYYY-MM-DD" de hoje, no fuso de Brasília (não no fuso do servidor).
export function hojeChaveBR(): string {
  return chaveDiaBR(new Date());
}
