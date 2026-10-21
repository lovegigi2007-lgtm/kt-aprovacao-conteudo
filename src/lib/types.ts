export type Rede = "Instagram" | "LinkedIn" | "TikTok";
export type Formato = "Estático" | "Reels" | "Carrossel" | "Story";
export type Tipo = "Conteúdo" | "Criativo";
export type Status =
  | "Rascunho"
  | "Em aprovação"
  | "Reprovado"
  | "Aprovado"
  | "Publicado";

export interface Conteudo {
  id: string;
  titulo: string;
  dataHora: string; // ISO
  rede: Rede;
  formato: Formato;
  tipo: Tipo;
  status: Status;
  etiquetas: string[];
  responsavel: string;
  motivoReprovacao?: string;
  corCapa: string; // placeholder de miniatura
  miniaturaUrl?: string | null;
}
