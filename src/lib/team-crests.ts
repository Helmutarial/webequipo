const normalize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();

const crests: Record<string, string> = {
  "ALDAPANGORAFC": "/club-crest.png",
  "AULACF": "/team-crests/aula-cf.png",
  "ASOCIACIONALACRAN1997": "/team-crests/asociacion-alacran-1997.png",
  "ESTRELLACOJAFC": "/team-crests/estrella-coja-fc.png",
  "DRAGONESDELAVAPIESB": "/team-crests/dragones-de-lavapies-b.png",
  "ESCUELADEHORTALEZA": "/team-crests/escuela-de-hortaleza.png",
  "AVILAFC": "/team-crests/avila-fc.png",
  "BOSTONTURRADORES": "/team-crests/boston-turradores.png",
  "ACDMCAM": "/team-crests/acdm-cam.png",
  "ATLETICOJABALIS": "/team-crests/atletico-jabalis.png",
};

export const getTeamCrest = (team: string) => crests[normalize(team)] || null;
