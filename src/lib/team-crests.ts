const normalize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();

const crests: Record<string, string> = {
  "ALDAPANGORAFC": "/club-crest.png",
  "AULACF": "/team-crests/aula-cf.png",
  "ASOCIACIONALACRAN1997": "/team-crests/asociacion-alacran-1997.png",
};

export const getTeamCrest = (team: string) => crests[normalize(team)] || null;
