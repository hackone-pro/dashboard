import severidade from "./severidade.controller";
import tenant from "./tenant.controller";
import firewalls from "./firewalls.controller";
import agentes from "./agentes.controller";
import paises from "./paises.controller";
import vulnerabilidades from "./vulnerabilidades.controller";
import eventos from "./eventos.controller";
import usuarios from "./usuarios.controller";
import risco from "./risklevel.controller";
import servidores from "./servidores.controller";


export default {
  ...severidade,
  ...tenant,
  ...firewalls,
  ...agentes,
  ...paises,
  ...vulnerabilidades,
  ...eventos,
  ...usuarios,
  ...risco,
  ...servidores
}