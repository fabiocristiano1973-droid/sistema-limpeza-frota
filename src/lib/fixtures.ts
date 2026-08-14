import { Turno } from "@/types/inspection";

// O turno continua sendo uma lista fixa (não é um cadastro em si — apenas um
// atributo sugerido pela Equipe). Os demais dados (frota, garagens, tipos de
// limpeza, inspetores, equipes) agora vêm dos cadastros em
// src/lib/repository/cadastros.ts.
export const TURNOS: Turno[] = ["Manhã", "Tarde", "Noite"];
