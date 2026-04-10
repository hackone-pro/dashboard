# **Documento de Concepção v1**

## **Funcionalidade: Copiloto IA Contextual do SecurityOne**

---

## **1\. Resumo executivo**

O SecurityOne já centraliza, em um único ambiente, sinais relevantes para operação de um SOC moderno: risco, incidentes, eventos, dashboards, automações e integrações. Esse modelo reduz a fragmentação da operação e fortalece a proposta da plataforma como um NG-SOC orientado por visibilidade, eficiência e resposta.

Mesmo assim, ainda existe uma lacuna importante entre **ter acesso ao contexto** e **transformar esse contexto em decisão rápida e segura**. Na prática, o usuário ainda precisa interpretar telas analíticas, correlacionar informações, entender relevância, priorizar foco, estruturar hipóteses e definir próximos passos.

A proposta desta funcionalidade é criar uma nova camada de produto: o **Copiloto IA Contextual do SecurityOne**. Essa camada não deve nascer como um chatbot genérico, mas como um assistente operacional embutido na plataforma, capaz de entender a tela atual, o objeto em foco, os filtros ativos e os dados relacionados disponíveis ao usuário para acelerar entendimento, investigação, priorização, comunicação e, futuramente, ação supervisionada.

Esta concepção parte de uma visão ampla de futuro, mas organiza claramente a implementação por fases, de modo que a ambição do produto não comprometa a clareza de escopo, a segurança nem a viabilidade técnica.

---

## **2\. Tese da oportunidade**

O SecurityOne já resolve bem o problema de **centralização de contexto operacional**. O próximo salto de valor não está apenas em mostrar mais dados, mas em ajudar o usuário a:

* entender rapidamente o que está vendo  
* distinguir o que importa do que é ruído  
* investigar com mais confiança  
* transformar análise em próximo passo  
* comunicar com clareza o que aconteceu e o que fazer

A oportunidade, portanto, não é criar “mais uma IA dentro da plataforma”.  
A oportunidade é criar uma **camada contextual de inteligência operacional** que aumente produtividade, reduza esforço cognitivo, padronize análises e amplie o valor prático do ecossistema já existente no SecurityOne.

---

## **3\. Problema a ser resolvido**

O problema central não é a ausência de chat.

O problema central é que, mesmo com os dados já concentrados no SecurityOne, o usuário ainda precisa fazer manualmente uma parte relevante do trabalho cognitivo de operação:

* interpretar telas  
* entender o significado dos sinais  
* contextualizar eventos e incidentes  
* cruzar fatores de risco  
* formular hipóteses  
* decidir prioridade  
* estruturar comunicação técnica e executiva

Em um ambiente de SOC, essa lacuna tem impacto direto em:

* tempo de triagem  
* confiança de analistas menos experientes  
* consistência entre analistas  
* velocidade de investigação  
* qualidade do handoff  
* capacidade de escala operacional

---

## **4\. O que é o Copiloto IA do SecurityOne**

O Copiloto IA do SecurityOne será uma **camada contextual de assistência operacional** embutida na plataforma, capaz de entender o momento do usuário dentro do produto e responder de forma útil, explicável e orientada ao fluxo real de trabalho.

Ele deve ser concebido como um **copiloto operacional do SOC**, e não como um chatbot genérico de perguntas abertas.

Seu papel é ajudar o usuário a:

* entender  
* priorizar  
* investigar  
* recomendar  
* comunicar  
* futuramente, acionar fluxos supervisionados

---

## **5\. O que muda em relação à IA já existente no produto**

O SecurityOne já possui uma camada relevante de IA no detalhe do incidente. Essa capacidade atual é valiosa e deve ser preservada como parte da experiência do produto.

O novo Copiloto IA não substitui essa inteligência existente. Ele a expande.

### **5.1 IA já existente no incidente**

A IA atual está associada ao objeto incidente e entrega apoio como:

* resumo do caso  
* análise inicial  
* possíveis causas  
* recomendações  
* apoio à resposta

### **5.2 Papel do novo Copiloto IA**

O novo copiloto tem papel diferente e mais transversal:

* entende a tela em que o usuário está  
* responde perguntas situadas ao contexto  
* cruza sinais e dados relacionados  
* ajuda na leitura de risco e panorama  
* apoia investigação conversacional  
* traduz informação para diferentes níveis de usuário  
* gera artefatos de comunicação  
* futuramente apoia ações supervisionadas

### **5.3 Diferença conceitual**

Em termos simples:

* **IA atual no incidente** \= inteligência embutida no objeto  
* **Copiloto IA** \= camada contextual de orquestração cognitiva da experiência

Essa distinção é essencial para evitar sobreposição de valor e garantir clareza na narrativa de produto.

---

## **6\. Visão futura da funcionalidade**

Na sua forma madura, o Copiloto IA do SecurityOne deve funcionar como uma camada transversal de inteligência operacional presente nas áreas mais relevantes da plataforma.

Essa camada deve:

### **6.1 Entender o contexto de navegação**

Saber:

* em qual tela o usuário está  
* qual tenant está em foco  
* qual objeto está aberto  
* quais filtros estão aplicados  
* qual período está selecionado  
* quais dados visíveis e relacionados estão disponíveis

### **6.2 Adaptar sua ajuda ao momento do usuário**

O copiloto não deve responder da mesma forma em todos os contextos.

Exemplos:

* na Home, deve sintetizar cenário e prioridade  
* em Risk Level, deve explicar causalidade e impacto  
* em Incidente, deve apoiar entendimento, investigação e comunicação  
* em Evento, deve traduzir sinal técnico e sugerir leitura inicial  
* em Dashboards, deve destacar desvios, tendências e hipóteses  
* em Automações, deve sugerir playbooks e orientar uso  
* em Integrações, deve apontar lacunas de cobertura e impacto operacional

### **6.3 Apoiar diferentes níveis de maturidade do usuário**

O copiloto deve ser útil para:

* analistas mais juniores, com apoio de entendimento e orientação  
* analistas mais seniores, com aceleração de investigação e síntese  
* líderes, com leitura rápida de cenário e suporte à decisão  
* gestores, com tradução executiva e visão consolidada

### **6.4 Servir como ponte entre contexto e ação**

A visão de longo prazo do copiloto não termina em explicação.  
Ela evolui para apoio cada vez mais prático à operação, incluindo:

* recomendação de próximos passos  
* sugestão de playbooks  
* geração assistida de tarefas  
* criação de resumos e handoff  
* apoio à formalização de comunicação com cliente  
* execução supervisionada de ações, com confirmação humana e governança

---

## **7\. Princípios estruturais da funcionalidade**

Estes princípios devem valer tanto para o MVP quanto para a evolução futura.

### **7.1 Contexto antes de conversa**

O valor do copiloto vem do contexto operacional, não da habilidade de conversar sobre qualquer tema.

### **7.2 Utilidade antes de amplitude**

É melhor resolver muito bem os fluxos mais críticos do que tentar cobrir toda a plataforma de forma rasa.

### **7.3 Evidência antes de opinião**

Toda resposta relevante deve indicar a base que sustentou a conclusão, hipótese ou recomendação.

### **7.4 Assistência antes de autonomia**

O copiloto deve ajudar, organizar e recomendar antes de executar qualquer ação.

### **7.5 Clareza antes de complexidade**

A experiência deve simplificar a operação, e não criar mais opacidade.

### **7.6 Segurança antes de conveniência**

Permissão, isolamento de tenant, auditoria e confirmação humana não são detalhes técnicos; são parte do produto.

### **7.7 Valor operacional antes de volume de uso**

O sucesso do copiloto não deve ser medido apenas por quantidade de mensagens, mas por impacto real no fluxo do usuário.

---

## **8\. Personas e foco de valor**

### **8.1 Personas centrais da visão completa**

O copiloto, em sua forma madura, pode gerar valor para:

* Analista SOC N1  
* Analista SOC N2 / N3  
* Líder ou coordenador de SOC  
* Gestor com necessidade de leitura executiva

### **8.2 Personas prioritárias para a implementação inicial**

Para a primeira entrega, o foco deve estar em:

#### **Analista SOC N1 / N2**

Necessita:

* entender rapidamente o contexto  
* identificar prioridade  
* reduzir insegurança na triagem  
* receber ajuda concreta para próximos passos

#### **Líder / coordenador de SOC**

Necessita:

* visão resumida do cenário  
* entendimento de risco e criticidade  
* aceleração de comunicação e acompanhamento operacional

Essa separação evita que a visão futura seja confundida com a primeira camada de entrega.

---

## **9\. Jobs-to-be-done do Copiloto IA**

O copiloto deve ser concebido para resolver principalmente estes trabalhos.

### **9.1 Entender rapidamente o contexto**

* “Resuma esta tela para mim”  
* “O que está mais crítico aqui?”  
* “O que mudou recentemente?”

### **9.2 Explicar sinais e conceitos**

* “Explique este alerta em linguagem simples”  
* “O que significa esta categoria MITRE?”  
* “Qual a relevância deste indicador?”

### **9.3 Apoiar investigação**

* “Quais hipóteses devo validar?”  
* “Quais evidências ainda faltam?”  
* “Quais sinais sugerem maior gravidade?”

### **9.4 Recomendar próximos passos**

* “O que devo priorizar agora?”  
* “Qual ação faz mais sentido neste contexto?”  
* “Esse caso merece escalonamento?”

### **9.5 Ajudar na comunicação**

* “Gere um resumo técnico”  
* “Gere um resumo executivo”  
* “Transforme essa análise em nota para cliente”

### **9.6 Futuramente, apoiar ação supervisionada**

* “Sugira o playbook mais adequado”  
* “Monte tarefas iniciais para este caso”  
* “Prepare a execução para aprovação humana”

---

## **10\. Casos de uso por tela**

## **10.1 Home**

### **Papel do copiloto**

Leitura de panorama, priorização e síntese executiva.

### **Exemplos**

* “Quais são os maiores sinais de atenção neste momento?”  
* “O que mais está puxando o risco?”  
* “Faça um resumo executivo do cenário atual”

---

## **10.2 Risk Level**

### **Papel do copiloto**

Explicação causal, leitura de composição do risco e orientação de foco.

### **Exemplos**

* “Por que o risco subiu?”  
* “Quais fatores têm maior peso agora?”  
* “O que devo atacar primeiro para reduzir o risco?”

---

## **10.3 Incidente**

### **Papel do copiloto**

Expansão da IA já existente para investigação guiada, priorização e comunicação.

### **Exemplos**

* “Explique este incidente para um analista N1”  
* “Quais são as causas mais prováveis?”  
* “Monte um plano de ação inicial”  
* “Transforme esta análise em resumo para cliente”

---

## **10.4 Evento**

### **Papel do copiloto**

Tradução técnica, contextualização inicial e apoio à correlação.

### **Exemplos**

* “Explique este log”  
* “Esse evento é normal ou suspeito?”  
* “Quais campos merecem atenção?”  
* “Isso pode estar relacionado a qual tipo de ataque?”

---

## **10.5 Dashboards**

### **Papel do copiloto**

Leitura analítica de desvios, tendências e comportamentos relevantes.

### **Exemplos**

* “Resuma os principais desvios deste dashboard”  
* “Quais tendências merecem investigação?”  
* “Quais indicadores pioraram?”

---

## **10.6 Automações / Playbooks**

### **Papel do copiloto**

Orientação, sugestão de playbooks e, futuramente, apoio à execução supervisionada.

---

## **10.7 Integrações**

### **Papel do copiloto**

Leitura de cobertura, lacunas de visibilidade e impacto de fontes conectadas ou ausentes.

---

## **11\. Modelo de experiência do usuário**

## **11.1 Conceito de interface**

O copiloto deve ser apresentado como um **painel lateral contextual** dentro da plataforma, persistente como conceito, mas acionado de forma discreta e não invasiva.

### **Proposta inicial de experiência**

* botão ou ícone persistente de copiloto  
* abertura em painel lateral direito  
* contexto automático da tela atual  
* prompts sugeridos por tela  
* campo de pergunta livre  
* respostas estruturadas  
* continuidade da conversa dentro da sessão

---

## **11.2 Estrutura padrão da resposta**

Sempre que fizer sentido, a resposta do copiloto deve seguir uma estrutura previsível:

1. **Resposta principal**  
2. **Por que isso importa**  
3. **Evidências ou sinais consultados**  
4. **Nível de confiança**  
5. **Próximos passos sugeridos**  
6. **Prompts de continuação**

Isso aumenta confiança, legibilidade e usabilidade.

---

## **11.3 Wireframe textual de referência**

### **Exemplo: detalhe do incidente**

**Painel lateral do Copiloto IA**

**Título:** Copiloto IA  
**Subtítulo:** Contexto atual: Incidente \#4821 | Tenant ACME | Últimas 24h

**Prompts sugeridos**

* Resuma este incidente  
* Quais evidências mais importam?  
* Qual deve ser o próximo passo?  
* Gere um resumo para cliente

**Resposta**

* **Resumo:** há indícios consistentes de atividade suspeita associada ao host X com impacto potencial em credenciais e persistência.  
* **Por que isso importa:** o caso combina criticidade elevada, recorrência de sinais e presença de comportamento compatível com técnica MITRE relevante.  
* **Evidências usadas:** timeline do incidente, origem do alerta, host afetado, categoria MITRE, eventos correlatos.  
* **Confiança:** média  
* **Próximos passos:** validar atividade do usuário, revisar eventos correlatos, confirmar necessidade de isolamento.  
* **Continuar com:** “monte um plano de ação inicial”

## **11.4 Mockups conceituais de apresentação**

Os mockups abaixo representam, de forma textual, como o Copiloto IA pode se materializar dentro da interface do SecurityOne. O objetivo não é definir design final, mas tornar visível sua posição no produto, seu comportamento e a lógica de interação em contextos reais de uso.

---

### **11.4.1 Mockup 1 — Copiloto recolhido / estado discreto global**

**Objetivo**  
 Mostrar como o copiloto permanece disponível sem competir com a interface principal.

**Representação textual**  
 **Tela principal do SecurityOne**  
 \[conteúdo normal da tela: widgets, tabelas, gráficos, filtros\]

**Canto inferior ou lateral direito**  
 `[ ícone Copiloto IA ]`

**Ao hover ou foco**  
 `[ ícone Copiloto IA ] Copiloto IA`  
 `Ajuda contextual disponível`

**Comportamento esperado**

* componente persistente e discreto

* abertura sob demanda, sem interferir na navegação

* percepção de ajuda contextual disponível em qualquer tela relevante

**Mensagem principal**  
 O copiloto faz parte do produto, mas não domina a experiência.

---

### **11.4.2 Mockup 2 — Copiloto aberto na Home**

**Objetivo**  
 Mostrar o copiloto como camada de leitura de cenário e priorização.

**Representação textual**  
 **Área principal da Home**

* Risk Level

* últimos incidentes

* mapa de ataque

* tendência de casos

* fontes geradoras de alerta

**Painel lateral direito — Copiloto IA**  
 **Título:** Copiloto IA  
 **Subtítulo:** Contexto atual: Home | Tenant ACME | Últimos 7 dias

**Prompts sugeridos**

* Resuma o cenário atual

* O que merece mais atenção agora?

* O que mais está puxando o risco?

* Gere um resumo executivo

**Pergunta do usuário**

O que merece mais atenção agora?

**Resposta do copiloto**

* **Resumo:** aumento do risco, recorrência de incidentes críticos e concentração de alertas em fontes específicas

* **Por que isso importa:** combinação de criticidade operacional e elevação de exposição

* **Evidências usadas:** Risk Level, incidentes recentes, tendência de volume, top sources

* **Confiança:** média-alta

* **Próximos passos:** revisar incidentes críticos, validar fontes mais ativas, analisar variação recente do risco

**Mensagem principal**  
 Na Home, o copiloto transforma panorama em prioridade.

---

### **11.4.3 Mockup 3 — Copiloto aberto no detalhe do incidente**

**Objetivo**  
 Mostrar o principal caso de uso do MVP: investigação assistida e apoio à decisão.

**Representação textual**  
 **Área principal — Detalhe do incidente**

* ID do incidente

* criticidade

* status

* timeline

* evidências

* host / usuário / IOC

* categoria MITRE

* tarefas e ações

**Painel lateral direito — Copiloto IA**  
 **Título:** Copiloto IA  
 **Subtítulo:** Contexto atual: Incidente \#4821 | Tenant ACME | Severidade Alta

**Prompts sugeridos**

* Resuma este incidente

* Quais evidências mais importam?

* Qual deve ser o próximo passo?

* Gere um resumo para cliente

**Pergunta do usuário**

Quais evidências mais importam?

**Resposta do copiloto**

* **Resumo:** timeline, origem dos alertas, host afetado, técnica MITRE e eventos correlatos são os sinais mais relevantes

* **Por que isso importa:** sustentam que o caso exige validação aprofundada e possível contenção

* **Evidências usadas:** timeline, origem, host, MITRE, eventos relacionados

* **Confiança:** média

* **Próximos passos:** validar atividade do host, revisar comportamento do usuário, confirmar necessidade de isolamento

**Mensagem principal**  
 No incidente, o copiloto aprofunda análise, organiza investigação e orienta o próximo passo.

---

### **11.4.4 Mockup 4 — Copiloto gerando artefato de comunicação**

**Objetivo**  
 Mostrar utilidade prática na geração assistida de conteúdo operacional.

**Representação textual**  
 **Área principal — Detalhe do incidente**  
 \[conteúdo do incidente mantido ao fundo\]

**Painel lateral direito — Copiloto IA**  
 **Título:** Copiloto IA  
 **Subtítulo:** Contexto atual: Incidente \#4821 | Geração de resumo

**Pergunta do usuário**

Gere um resumo para cliente

**Resposta do copiloto**  
 **Resumo para cliente**  
 Foi identificado um incidente com indícios consistentes de atividade suspeita no ativo monitorado. A investigação está em andamento, com validação do impacto, da origem e da necessidade de medidas adicionais de contenção.

**Situação atual**

* incidente em análise

* criticidade alta

* evidências iniciais confirmadas

**Próximos passos previstos**

* aprofundar investigação

* confirmar extensão do impacto

* definir contenção, se necessária

**Ações disponíveis**

* Copiar texto

* Editar resposta

* Gerar versão executiva

* Gerar versão técnica

* Salvar como nota do caso

**Mensagem principal**  
 O copiloto reduz esforço operacional também na comunicação, documentação e handoff.

---

## **12\. Fronteira de contexto da funcionalidade**

Para manter utilidade e viabilidade, a concepção do copiloto deve deixar claro que existem camadas de contexto.

### **Nível 1 — Contexto imediato**

* tela atual  
* objeto aberto  
* filtros aplicados  
* período selecionado  
* dados visíveis

### **Nível 2 — Contexto relacionado**

* entidades relacionadas ao objeto atual  
* eventos, evidências, sinais ou campos correlatos  
* dados de módulos diretamente conectados ao caso em análise

### **Nível 3 — Contexto expandido**

* consultas transversais mais amplas  
* apoio comparativo entre módulos  
* histórico mais abrangente  
* apoio mais profundo de correlação

### **Diretriz**

O MVP deve começar com prioridade em **contexto imediato e contexto relacionado controlado**, e não com acesso amplo e irrestrito a tudo.

---

## **13\. Guardrails e governança**

A governança da funcionalidade precisa nascer junto com sua proposta de valor.

### **Regras estruturais**

* o copiloto deve respeitar escopo de tenant e permissões do usuário  
* toda resposta relevante deve indicar se se trata de fato, hipótese ou recomendação  
* o sistema deve apontar explicitamente quando não houver evidência suficiente  
* ações críticas não devem ser executadas automaticamente nas fases iniciais  
* deve haver registro auditável das interações relevantes  
* a funcionalidade deve diferenciar com clareza:  
  * explicação  
  * hipótese  
  * recomendação  
  * ação possível  
  * ação executada

### **Princípio de confiança**

Em contexto crítico, o copiloto deve preferir:

* resposta limitada  
* indicação de incerteza  
* necessidade de validação humana

em vez de excesso de confiança sem base suficiente.

---

## **14\. Visão completa x implementação por fases**

A concepção desta funcionalidade deve preservar dois níveis de leitura:

### **14.1 Visão completa**

Como o copiloto idealmente funciona no produto maduro.

### **14.2 Estratégia de implementação**

Como essa visão será construída por etapas, com foco, segurança e valor incremental.

Essa distinção é proposital e necessária.  
Ela permite pensar grande sem transformar a primeira entrega em um escopo inflado.

---

## **15\. Estratégia de implementação por fases**

## **15.1 Fase 1 — MVP: leitura, explicação e recomendação contextual**

### **Objetivo**

Validar que o copiloto melhora entendimento, priorização e comunicação em superfícies de alto valor.

### **Escopo prioritário**

* Home  
* Risk Level  
* Detalhe do incidente

### **Escopo secundário possível, dependendo de capacidade**

* Detalhe do evento

### **Capacidades do MVP**

* resumir contexto atual  
* explicar sinais e indicadores  
* destacar fatores mais relevantes  
* sugerir próximos passos  
* traduzir conteúdo técnico para linguagem simples ou executiva  
* gerar resumo técnico e executivo  
* manter contexto na sessão atual  
* exibir evidências consultadas  
* respeitar permissões e registrar auditoria

### **O que o MVP ainda não pretende ser**

* buscador irrestrito de toda a plataforma  
* agente autônomo  
* motor de execução operacional  
* memória persistente entre ambientes sem política clara  
* substituto do analista humano

---

## **15.2 Fase 2 — Investigação assistida**

### **Objetivo**

Ampliar profundidade investigativa e correlação.

### **Possíveis capacidades**

* cruzamento mais profundo de sinais  
* hipóteses guiadas  
* perguntas de validação  
* apoio à construção de consultas  
* apoio a investigação em eventos e incidentes recorrentes

---

## **15.3 Fase 3 — Operação assistida**

### **Objetivo**

Conectar melhor o copiloto à execução do fluxo operacional.

### **Possíveis capacidades**

* sugestão de playbooks  
* criação assistida de tarefas  
* apoio a handoff entre turnos  
* geração de relatórios e notas estruturadas  
* assistência à documentação do caso

---

## **15.4 Fase 4 — Ação supervisionada**

### **Objetivo**

Permitir que o copiloto prepare ou inicie ações, sempre com controle humano.

### **Possíveis capacidades**

* preparação de ações de contenção para aprovação  
* disparo supervisionado de fluxos e automações  
* integração mais profunda com resposta e playbooks  
* confirmação explícita e trilha completa de auditoria

---

## **16\. Requisitos funcionais da fase inicial**

### **RF-01 — Contextualização automática**

O copiloto deve identificar a tela atual, o objeto em foco e os filtros ativos.

### **RF-02 — Consulta contextual**

O copiloto deve responder com base no contexto da tela e nos dados correlatos permitidos.

### **RF-03 — Sugestões guiadas**

Cada tela deve oferecer prompts sugeridos adequados ao contexto.

### **RF-04 — Explicação adaptativa**

O copiloto deve explicar o mesmo conteúdo em linguagem operacional, simples ou executiva.

### **RF-05 — Investigação assistida básica**

O copiloto deve sugerir hipóteses iniciais, pontos de atenção e próximos passos.

### **RF-06 — Geração de artefatos de comunicação**

O copiloto deve gerar resumos técnicos, resumos executivos e notas de apoio.

### **RF-07 — Transparência da resposta**

O copiloto deve indicar os dados, sinais ou fontes que sustentaram a resposta.

### **RF-08 — Contexto conversacional de sessão**

O copiloto deve manter contexto dentro da sessão ativa.

### **RF-09 — Respeito a permissões**

O copiloto só deve acessar e expor dados para os quais o usuário tenha acesso.

### **RF-10 — Auditoria**

Interações relevantes devem ser registradas para rastreabilidade.

---

## **17\. Requisitos não funcionais**

### **RNF-01 — Segurança**

Toda resposta deve respeitar tenant, perfil de acesso e políticas de privacidade.

### **RNF-02 — Latência**

A resposta deve ser rápida o suficiente para não quebrar o fluxo operacional.

### **RNF-03 — Confiabilidade**

O sistema deve preferir limitação explícita a inferência sem base.

### **RNF-04 — Observabilidade**

Deve existir rastreabilidade sobre prompts, fontes, resposta, tempo e erro.

### **RNF-05 — Escalabilidade**

A arquitetura deve permitir expansão progressiva para novas telas.

### **RNF-06 — Explicabilidade**

O usuário deve entender por que recebeu determinada resposta.

### **RNF-07 — Isolamento de contexto**

Não deve haver vazamento entre tenants, sessões ou usuários.

---

## **18\. Arquitetura conceitual de alto nível**

### **Camada 1 — Interface do copiloto**

Componente de front-end embutido na plataforma.

### **Camada 2 — Serviço de contexto**

Responsável por capturar:

* tela atual  
* entidade atual  
* tenant  
* filtros  
* período  
* metadados úteis

### **Camada 3 — Orquestrador do copiloto**

Responsável por:

* classificar intenção  
* montar contexto de consulta  
* decidir quais fontes consultar  
* compor a resposta  
* aplicar guardrails

### **Camada 4 — Recuperação de dados**

Conectores para módulos como:

* incidentes / DFIR  
* eventos / SIEM  
* risk level  
* dashboards  
* integrações  
* automações / playbooks

### **Camada 5 — Modelo de linguagem**

Responsável por interpretar, resumir, explicar, recomendar e estruturar resposta.

### **Camada 6 — Camada de ação controlada**

Presente apenas nas fases futuras, para apoiar ações supervisionadas com confirmação humana.

---

## **19\. Benefícios esperados**

## **19.1 Para o usuário**

* menor tempo para entender o que está vendo  
* menor esforço cognitivo em telas analíticas  
* mais segurança para analistas menos experientes  
* mais velocidade para investigação e comunicação  
* melhor apoio à priorização

## **19.2 Para a operação**

* maior consistência analítica  
* melhor handoff entre pessoas e turnos  
* mais padronização de leitura e recomendação  
* melhor aproveitamento dos módulos já existentes

## **19.3 Para MSSPs e negócio**

* maior escala operacional  
* redução de dependência de senioridade em tarefas repetitivas  
* aumento do valor percebido da plataforma  
* reforço da narrativa de eficiência, inteligência e maturidade  
* potencial de diferenciação competitiva e posicionamento premium

---

## **20\. Riscos e trade-offs principais**

### **20.1 Alucinação ou inferência sem base**

Risco de a IA responder além da evidência disponível.

### **20.2 Perda de confiança**

Se errar em contexto crítico, o copiloto pode ser abandonado rapidamente.

### **20.3 Escopo excessivo**

Tentar cobrir toda a plataforma desde o início tende a atrasar a entrega e reduzir qualidade.

### **20.4 Ambiguidade entre recomendação e ação**

O usuário pode interpretar sugestão como execução confirmada.

### **20.5 Custo operacional**

Respostas contextuais podem gerar custo relevante de processamento, consulta e modelo.

### **20.6 UX mal resolvida**

Se a experiência parecer um chat vazio ou genérico, a adoção tende a ser baixa.

### **20.7 Redundância com capacidades já existentes**

Sem posicionamento correto, o copiloto pode parecer apenas uma repetição da IA atual do incidente.

---

## **21\. Métricas de sucesso**

As métricas devem ser organizadas por adoção, eficiência, qualidade e impacto percebido.

## **21.1 Adoção**

* percentual de usuários elegíveis que utilizam o copiloto  
* frequência de uso por sessão  
* telas com maior adoção  
* taxa de retorno ao copiloto

## **21.2 Eficiência**

* redução do tempo para compreensão inicial do caso  
* redução do tempo para primeira hipótese  
* redução do tempo para produção de resumo técnico  
* redução do tempo de leitura operacional da Home e do Risk Level

## **21.3 Qualidade percebida**

* taxa de respostas avaliadas como úteis  
* taxa de respostas com evidência considerada suficiente  
* taxa de feedback negativo  
* taxa de abandono após primeira interação

## **21.4 Valor de negócio**

* aumento do uso de módulos estratégicos  
* impacto na percepção de valor da IA do produto  
* contribuição para narrativa comercial e diferenciação  
* evidência de ganho operacional em contas piloto

---

## **22\. Decisões recomendadas nesta versão**

1. O Copiloto IA será tratado como uma camada contextual de assistência operacional, e não como chatbot genérico.  
2. A visão do produto será explicitamente maior que o MVP.  
3. O MVP será uma etapa de validação da visão, e não a definição final da funcionalidade.  
4. A fase inicial deve priorizar superfícies com alta densidade de contexto e alto valor operacional.  
5. A resposta do copiloto deve ser explicável, auditável e ancorada em evidências.  
6. Ações sensíveis não devem ser executadas automaticamente nas fases iniciais.  
7. O valor da funcionalidade será medido por impacto operacional, e não apenas por volume de conversas.

---

## **23\. Pontos em aberto para refinamento**

* O detalhe do evento entra no MVP ou no fast follow imediato?  
* Quais dados relacionados poderão ser consultados na fase inicial?  
* Como será exibida a evidência da resposta sem poluir a interface?  
* Haverá memória apenas por sessão ou também entre sessões em fases futuras?  
* Quais artefatos formais entram logo no início: resumo técnico, resumo executivo, nota para cliente, handoff?  
* Como separar visualmente fato, hipótese e recomendação na resposta?  
* Em quais situações o copiloto poderá sugerir ações operacionais já na primeira fase?

---

## **24\. Conclusão**

A melhor forma de conceber esta funcionalidade é tratá-la como uma **nova camada de produto dentro do SecurityOne**: uma camada contextual de inteligência operacional que transforma dados já centralizados em entendimento, priorização, investigação e recomendação prática.

A visão futura do copiloto deve ser ampla, porque o potencial da funcionalidade vai além de um painel de chat. Ela pode se tornar uma interface operacional inteligente para leitura, investigação, comunicação e, futuramente, ação supervisionada dentro do NG-SOC.

Ao mesmo tempo, essa ambição precisa ser construída com disciplina.  
Por isso, a implementação deve evoluir por fases, começando onde o valor é mais claro, o contexto é mais rico e o risco é mais controlável.

O objetivo desta v1 é justamente equilibrar essas duas necessidades:

* preservar a visão completa do produto  
* deixar claro como essa visão pode ser construída com foco, segurança e maturidade

