import type { LeifMood } from "@/components/LeifMascot";

export type LeifGreeting = { message: string; mood: LeifMood };

/**
 * Mensagem contextual do Leif para o Painel, baseada no horário do dia
 * e no progresso de aderência ao plano.
 */
export function leifGreeting(params: {
  hour: number;
  adherence: number; // 0..1
  plannedItems: number;
  name?: string | null;
}): LeifGreeting {
  const { hour, adherence, plannedItems, name } = params;
  const guerreiro = name?.trim() ? name.trim().split(/\s+/)[0] : "guerreiro";

  // Madrugada — hora de descansar
  if (hour >= 23 || hour < 5) {
    return {
      mood: "sleep",
      message: `A madrugada é dos lobos, ${guerreiro}. Descanse — a recuperação também é treino.`,
    };
  }

  const behind = plannedItems > 0 && adherence < 0.5;

  // Noite com a conquista atrasada
  if (hour >= 18) {
    if (behind) {
      return {
        mood: "sad",
        message: `O dia quase acaba e a conquista está incompleta, ${guerreiro}. Ainda há tempo de honrar o plano.`,
      };
    }
    return {
      mood: "normal",
      message: `Boa noite, ${guerreiro}. Revise a jornada do dia e prepare-se para a próxima batalha.`,
    };
  }

  // Tarde
  if (hour >= 12) {
    if (behind) {
      return {
        mood: "motivate",
        message: `Boa tarde, ${guerreiro}! A conquista pede ritmo — retome o plano e avance.`,
      };
    }
    return {
      mood: "normal",
      message: `Boa tarde, ${guerreiro}! Mantenha o ritmo firme rumo à vitória.`,
    };
  }

  // Manhã
  return {
    mood: "motivate",
    message: `Bom dia, ${guerreiro}! Comece o dia forte — a glória pertence aos disciplinados.`,
  };
}
