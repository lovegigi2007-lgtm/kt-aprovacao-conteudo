// Converte entre os valores salvos no banco (enums em minúsculo/underscore)
// e os rótulos em português mostrados na tela.

export const statusParaLabel: Record<string, string> = {
  rascunho: "Rascunho",
  em_aprovacao: "Em aprovação",
  reprovado: "Reprovado",
  aprovado: "Aprovado",
  publicado: "Publicado",
};

export const redeParaLabel: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export const formatoParaLabel: Record<string, string> = {
  estatico: "Estático",
  reels: "Reels",
  carrossel: "Carrossel",
  story: "Story",
};

export const tipoParaLabel: Record<string, string> = {
  conteudo: "Conteúdo",
  criativo: "Criativo",
};

export const labelParaRede: Record<string, string> = {
  Instagram: "instagram",
  LinkedIn: "linkedin",
  TikTok: "tiktok",
};

export const labelParaFormato: Record<string, string> = {
  "Estático": "estatico",
  Reels: "reels",
  Carrossel: "carrossel",
  Story: "story",
};

export const labelParaTipo: Record<string, string> = {
  "Conteúdo": "conteudo",
  Criativo: "criativo",
};

export const corPorCapaPadrao = "#39812C";
