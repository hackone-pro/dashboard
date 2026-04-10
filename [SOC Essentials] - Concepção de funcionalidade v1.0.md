# **Concepção de Funcionalidade**

## **SOC Essentials (SOC Lightweight)**

**Produto:** SecurityOne  
 **Módulo:** SOC  
 **Sub-módulo:** SOC Essentials  
 **Versão:** 1.0  
 **Status:** Concepção  
 **Owner:** Lucas Palma  
 **Data:** 10-03-2026

---

## **1\) Problema que esta feature resolve**

Clientes com menor maturidade ou que estão iniciando um SOC muitas vezes não querem assumir custo e complexidade de um SIEM “completo” logo no início. Porém quase todos possuem:

* Um **Firewall** (Fortinet, Palo Alto, Check Point, Cisco, pfSense etc.)

* Um **EDR/XDR** (Defender, CrowdStrike, Trend Micro, FortiEDR, SentinelOne etc.)

Esses produtos possuem dashboards próprios, mas geralmente:

* não consolidam visão unificada

* não têm boa gestão de incidentes

* não geram contextos acionáveis

* não conectam risco operacional com backlog e performance do SOC

O SOC Essentials resolve isso: o cliente integra Firewall e EDR/XDR via API e já obtém uma primeira versão do SOC dentro do SecurityOne.

---

## **2\) Objetivo do SOC Essentials**

Entregar um SOC operacional mínimo e útil, com:

1. Ingestão de telemetria via API de Firewall e EDR/XDR

2. Normalização de eventos em um esquema comum SecurityOne

3. Correlação básica e geração de incidentes

4. Enriquecimento e sumarização por IA

5. Dashboards: Risk Level, Incidents, Monitoria NG-SOC

6. Transparência de gaps: mostrar quando um campo não existe na fonte

---

## **3\) Escopo v1 (MVP) e o que fica fora**

### **3.1 Dentro do v1**

* Integrações: pelo menos 1 Firewall e/ou pelo menos 1 EDR/XDR via API

* Pipeline:

  * Coleta incremental

  * Normalização

  * Classificação de severidade

  * Geração de incidente

  * IA (triagem, incidentes e sumarização)

* Dashboards habilitados:

  * Incidents

  * Risk Level

  * SOC Analytics (com limitações claras)

  * Monitoria NG-SOC (visão de saúde e volume)

  * Threat Map

  * Relatórios

  * Home

### **3.2 Fora do v1 (v1.1+)**

* Correlação avançada multi-fonte e regras complexas (SIEM-like)

* Detecção de Vulnerabilidades (isso depende mais de scanner/agent específico)

* Integridade de arquivos baseada em FIM, se a fonte não entregar FIM

* Mostrar elementos bloqueados como estratégia comercial, para que o cliente queira fazer o upgrade.

---

## **4\) Princípios de produto (regras não negociáveis)**

1. O SOC Essentials deve funcionar sem SIEM.

2. A ausência de SIEM não pode quebrar o painel de incidentes nem o risk level.

3. A UI deve ser honesta: se a fonte não fornece dado, exibir “Não disponível” com explicação.

4. IA deve ser possível substituir por IA do cliente.

5. Múltiplas integrações do mesmo tipo devem ser suportadas com consolidação.

---

## **5\) Conceito técnico central: “Adapters \+ Normalized Events”**

Para suportar vários fabricantes, adotar este padrão:

### **5.1 Adapter/Code/Interpreter (por fabricante)**

Cada fabricante tem um Adapter com 4 responsabilidades:

1. Autenticar

2. Coletar incremental

3. Transformar para um esquema normalizado SecurityOne

4. Emitir eventos e métricas para o pipeline

### **5.2 Evento normalizado (modelo base)**

Todo evento ingerido do Firewall ou EDR/XDR vira um objeto padrão, mínimo:

* event\_id (interno)

* org\_id

* source\_type \= firewall | edr

* vendor (fortinet, paloalto, microsoft etc.)

* product (fortigate, defender, crowdstrike etc.)

* event\_time (timestamp original)

* ingest\_time (timestamp de ingestão)

* severity \= baixo | medio | alto | critico (mapeado)

* category (network\_threat, malware, auth, policy, intrusion, etc.)

* action (blocked, allowed, detected, quarantined etc.)

* asset:

  * host\_name (quando existir)

  * ip (quando existir)

  * user (quando existir)

* ioc:

  * src\_ip, dst\_ip, domain, url, hash (quando existir)

* raw\_payload (armazenamento conforme política)

Se algo não vier: o campo fica nulo e a UI deve tratar.

---

## **6\) Mapeamento de severidade (fundamental para Risk Level e Incidents)**

Cada fornecedor tem severidades próprias. Precisamos de um mapeamento consistente.

### **6.1 Regra padrão de mapeamento**

* Mapear em 4 buckets:

  * Crítico

  * Alto

  * Médio

  * Baixo

Exemplos:

* Defender: Informational \-\> Baixo, Low \-\> Baixo, Medium \-\> Médio, High \-\> Alto, Severe/Critical \-\> Crítico (ajustar conforme API real)

* CrowdStrike: severity 1-2 \-\> Baixo, 3 \-\> Médio, 4 \-\> Alto, 5 \-\> Crítico (exemplo de regra)

* Firewall: IPS critical \-\> Crítico, high \-\> Alto, medium \-\> Médio, low \-\> Baixo

### **6.2 Configuração customizável**

No painel de integrações, permitir override:

* “Mapeamento de severidade por integração” \- permitir mapear quando integrar

* Isso evita distorção por vendor.

---

## **7\) Como gerar incidentes sem SIEM (motor de incidentes do Essentials)**

O Essentials precisa de um “Incident Engine” simples, com regras de agrupamento.

### **7.1 Regra de agrupamento (v1)**

Agrupar eventos em incidentes por:

* source\_type

* asset.ip ou asset.host\_name quando existir

* category

* janela de tempo (ex.: 30 min a 2h configurável)

Exemplos:

* Muitos eventos “Malware detected” no mesmo host em 1h \-\> 1 incidente

* Many “Brute force login” do mesmo src\_ip para o mesmo dst\_ip \-\> 1 incidente

* IPS disparando repetidamente para o mesmo destino \-\> 1 incidente

### **7.2 Severidade do incidente**

A severidade do incidente deve ser:

* o máximo entre os eventos agrupados

* com ajuste por volume e recorrência

### **7.3 Campos mínimos do incidente**

* incident\_id

* org\_id

* created\_at

* status

* severity

* title e description

* primary\_asset

* event\_count

* sources\_involved (firewall, edr)

* first\_seen\_at, last\_seen\_at

* ai\_summary

---

## **8\) IA opcional e “Bring Your Own AI”**

### **8.1 IA SecurityOne (padrão)**

* sumariza incidente

* sugere hipóteses

* sugere próximos passos (containment)

* classifica tags (técnica MITRE quando possível)

### **8.2 IA do cliente**

O cliente pode:

* conectar IA própria via API no módulo de integrações

* o pipeline chama a IA externa para gerar ai\_summary e recommendations

### **8.3 Fallback**

Se IA falhar:

* incidentes continuam sendo criados

* campos de IA exibem “IA não disponível no momento”

---

## **9\) Comportamento da UI (o que aparece no SecurityOne)**

### **9.1 Matriz de habilitação de telas (SOC Essentials)**

Se existir pelo menos 1 integração EDR ou Firewall conectada com ingestão ativa:

* **Incidents**: habilitado

* **Risk Level**: habilitado

* **SOC Analytics**: habilitado com limitações

* **Monitoria NG-SOC**: habilitado como telemetria e saúde

* **Threat Map**: habilitado

* **Relatórios**

### **9.2 Gaps e “campos não disponíveis”**

Sempre que um componente do dashboard exigir um campo que a fonte não traz, a UI deve mostrar:

* “Não disponível nesta integração”

* Tooltip: “Este dado não é fornecido pela fonte X. Para habilitar, conecte Y ou habilite Z.”

---

## **10\) Como cada dashboard usa os dados** 

## **10.1 Risk Level**

* Usa contagem por severidade:

  * alertas por host (quando houver host)

  * alertas de firewall (sempre haverá)

  * incidentes abertos (sempre haverá)

  * auditoria CIS: fica como “não disponível” no Essentials

Importante:

* O Risk Level deve degradar graciosamente se um card não existir. O seu algoritimo deve ser calculado com base na quantidade de cards, por padrao ele é arbitrado com 4 elementos usando o nível de criticidade dos alertas (veja a documentação do risk level), no caso do essentials quando teremos apenas alertas de top hosts gerenciados pelo edr e/ou firewalls, o risk level deve ponderar somente esses elementos e esse dashboard ser ajustável para visualização somente dos cards selecionados.  
*   
  * Exibir só cards disponíveis e recalcular pesos proporcionalmente  
     Recomendação: para não “punir” o cliente por não ter CIS.

### **10.2 Incidents**

* Consome o Incident Engine

* Filtros por severidade, status, fonte, asset

* Detalhe do incidente mostra:

  * timeline de eventos

  * entidades e IOCs

  * recomendações da IA

### **10.3 SOC Analytics**

Sem SIEM, os tempos (MTTD/MTTA/MTTR) dependem dos timestamps disponíveis:

* first\_seen\_at vem do primeiro evento no incidente

* created\_at é quando o incidente foi criado

* acknowledged\_at é quando alguém atribuiu ou mudou status

* resolved\_at quando fechou

### **10.4 Monitoria NG-SOC**

No Essentials, ela vira “Monitoria de Ingestão”:

* volume de eventos/dia

* últimas sincronizações

* status das integrações

* coletor/adapter health

---

## **11\) Painel de integrações: UX e “flavors”**

O painel deve orientar o cliente com caminhos simples: As integrações só podem ser liberadas de acordo com o seu plano específico contratado, ter uma conta mãe que carrega profiles filhos, a conta mãe é quem contratou o plano específico. Precisa-se estruturar o painel de cobranças para que o licenciamento possa ser aplicado corretamente.

### **11.1 Cards e recomendações**

* Conectar EDR/XDR

  * Conectar Firewall

### **11.2 Indicador de maturidade**

Exibir um “nível de cobertura” de acordo com o plano contratado, isso pode ser no profile do cliente:

* Essentials: Firewall \+ EDR

* NG-SOC: SIEM \+ CTI \+ SOAR \+ IA \+ DFIR

---

## **12\) Requisitos de coleta (pull/webhook) e cadência**

### **12.1 Modo Pull (padrão)**

* O Adapter faz pull incremental:

  * since\_timestamp ou cursor

* Intervalo configurável:

  * padrão 5 min ou 15 min (depende do vendor)

### **12.2 Modo Webhook (quando possível)**

* Para vendors que suportam push/webhook:

  * reduzir latência

  * melhorar MTTD

### **12.3 Deduplicação**

* Dedupe por hash de (vendor\_event\_id \+ timestamp \+ asset \+ type)

---

## **13\) Observabilidade e saúde das integrações**

Cada integração deve expor:

* last\_success\_at

* last\_error\_at

* error\_rate (24h)

* events\_24h

* avg\_latency

* status (ok, degraded, fail)

E a UI deve ter:

* alerta quando ingestão cair abruptamente (sinal de telemetria caída)  
   Isso resolve o problema de “sem alertas pode ser bom ou pode ser cego”.

---

## **14\) Critérios de aceite (QA)**

1. Cliente conecta um Firewall via API e já vê:

   * alertas de firewall no Risk Level

   * incidentes gerados a partir de eventos do firewall

2. Cliente conecta um EDR/XDR via API e já vê:

   * incidentes com eventos do EDR

   * top assets quando existir hostname/device

3. Sem SIEM, a tela Incidents funciona e permite ver detalhes.

4. Risk Level funciona sem CIS

5. SOC Analytics calcula MTTA/MTTR sempre que houver dados de atribuição e fechamento.

6. Gaps são exibidos com mensagens claras quando campos não existirem.

7. IA pode ser desligada sem quebrar incidentes e dashboards.

8. IA externa pode ser conectada via API e escolhida como padrão.

9. Se IA externa falhar, o sistema continua operando e sinaliza indisponibilidade.

10. Multi-source: conectar 2 EDRs e 2 Firewalls consolida eventos e incidentes sem conflito.

11. Monitoria mostra saúde e volume por integração.

12. Queda brusca de ingestão dispara alerta de saúde.

---

## **15\) Itens em aberto para decisão**

1. Redistribuição de peso do Risk Level quando um card não existe (recomendado recalcular pesos).

2. Janela de agrupamento de incidentes (30 min, 1h, 2h) e se é global ou por org.

3. Catálogo mínimo de categorias de evento (taxonomy) para firewall e EDR.

4. Política de retenção de payload bruto por org (compliance).

5. Lista inicial de vendors do v1 e ordem de implementação.

---

# **Apêndice A: “Como o dev cria um novo conector”**

Este trecho é a instrução operacional que você pediu, para o dev saber “criei integração, popula tudo”.

Para adicionar um novo fabricante (ex.: CrowdStrike ou Palo Alto), o dev deve:

1. Implementar AdapterVendorX com:

   * auth

   * fetch incremental

   * parse para o modelo normalizado

2. Implementar SeverityMapperVendorX

3. Implementar NormalizerVendorX (categoria, action, assets, iocs)

4. Emitir eventos normalizados para o Event Store

5. Garantir que o Incident Engine consuma esses eventos

6. Garantir que os agregadores (Risk Engine e SOC Analytics) consumam:

   * contagens por severidade

   * incidentes abertos/fechados

7. Atualizar Integration Registry:

   * status e health

   * capabilities habilitadas

8. Validar UI:

   * Risk Level preenchido

   * Incidents preenchido

   * Monitoria mostrando ingestão

   * Gaps sinalizados quando necessário

---

 **Anexo: Concepção de Correlação de Logs e Abertura de Incidentes (v1)**

## **1\. Objetivo do v1**

Criar um mecanismo simples e previsível para:

1. reduzir ruído (deduplicar e agrupar eventos repetidos)  
2. correlacionar múltiplos logs de uma mesma fonte (ex.: firewall) em um único incidente  
3. correlacionar múltiplas fontes (ex.: firewall \+ EDR) em um único incidente  
4. gerar um incidente com narrativa clara: o que aconteceu, em quem, quando começou, quando terminou, e quais evidências suportam isso.

Este v1 deve ser determinístico e rastreável, com poucas regras, fácil de debugar.

---

## **2\. Princípios do design**

* **Normalize first:** correlação só acontece em cima de um evento normalizado.  
* **Determinístico antes de IA:** regras simples criam o agrupamento; IA entra depois apenas para resumo e próximos passos.  
* **Idempotência:** reprocessar eventos não cria incidentes duplicados.  
* **Janela de correlação:** incidentes são “rolling” dentro de uma janela configurável, por categoria.

---

## **3\. Entidades e modelo de dados (v1)**

### **3.1 NormalizedEvent (mínimo)**

Todo log ingerido deve virar um NormalizedEvent com campos mínimos:

* org\_id  
* source\_type (FIREWALL, EDR, SIEM, CIS, etc.)  
* vendor (Fortinet, Microsoft, etc.)  
* event\_time (UTC)  
* severity\_bucket (CRITICO, ALTO, MEDIO, BAIXO)  
* category (taxonomia v1, ver seção 4\)  
* action (ALLOW, DENY, DETECT, BLOCK, QUARANTINE, etc.)  
* asset\_host (hostname, quando existir)  
* asset\_ip (ip, quando existir)  
* user (quando existir)  
* src\_ip, dst\_ip, dst\_port, protocol (quando existir)  
* signature\_id ou rule\_id (quando existir)  
* ioc\_list (domínio, hash, url, ip, etc.)  
* vendor\_event\_id (quando existir)

### **3.2 DedupKey (obrigatório)**

Antes de correlacionar, deduplicar eventos repetidos.

* dedup\_key \= hash(org\_id \+ source\_type \+ vendor \+ vendor\_event\_id \+ event\_time \+ asset\_ip \+ category)  
   Se não existir vendor\_event\_id, usar:  
* dedup\_key \= hash(org\_id \+ source\_type \+ vendor \+ event\_time\_bucket(10s) \+ asset\_ip \+ src\_ip \+ dst\_ip \+ dst\_port \+ signature\_id \+ category)

Regra: se dedup\_key já existe, atualizar apenas contadores, não criar novo evento efetivo.

---

## **4\. Taxonomia mínima (category) para o v1**

Para viabilizar correlação simples, o v1 usa poucas categorias:

* NETWORK\_INTRUSION (IPS, exploit, signature)  
* NETWORK\_RECON (scan, enumeração, varredura)  
* AUTH\_ANOMALY (brute force, login anômalo, falha de autenticação)  
* MALWARE\_EXECUTION (detecção de malware, execução suspeita)  
* ENDPOINT\_BEHAVIOR (processo suspeito, persistence, lateral movement)  
* DATA\_EXFIL (exfiltração, upload anômalo)  
* POLICY\_VIOLATION (bloqueio por política, acesso proibido)  
* OTHER (fallback)

Mapeamento vendor \-\> category é feito no adapter de integração.

---

## **5\. Janela de correlação (v1)**

Cada categoria tem uma janela padrão para agrupar eventos no mesmo incidente:

* NETWORK\_INTRUSION: 60 min  
* NETWORK\_RECON: 30 min  
* AUTH\_ANOMALY: 30 min  
* MALWARE\_EXECUTION: 120 min  
* ENDPOINT\_BEHAVIOR: 120 min  
* DATA\_EXFIL: 180 min  
* POLICY\_VIOLATION: 60 min

Regra: enquanto o incidente estiver “ativo” e chegar novo evento dentro da janela, o incidente continua sendo atualizado (rolling).

---

## **6\. Engine de correlação v1: fases (sequência do pipeline)**

### **Fase 1: Ingestão e Normalização**

1. Adapter recebe log bruto.  
2. Adapter cria NormalizedEvent usando taxonomia v1.  
3. Salvar NormalizedEvent.

### **Fase 2: Deduplicação**

1. Calcular dedup\_key.  
2. Se já existe no intervalo curto (ex.: 5 min), incrementar contagem e finalizar.  
3. Se não existe, continuar.

### **Fase 3: Agrupamento intra-fonte (mesma fonte, mesmo problema)**

Objetivo: múltiplos logs do firewall para o mesmo problema virarem um único “candidato” (IncidentCandidate) e depois um incidente.

**Criar correlation\_key por categoria:**

* AUTH\_ANOMALY:  
   corr\_key \= hash(org\_id \+ category \+ user \+ src\_ip \+ auth\_service \+ asset\_target)  
* NETWORK\_RECON:  
   corr\_key \= hash(org\_id \+ category \+ src\_ip \+ dst\_ip \+ port\_range \+ protocol)  
* NETWORK\_INTRUSION:  
   corr\_key \= hash(org\_id \+ category \+ signature\_id \+ src\_ip \+ dst\_ip \+ dst\_port \+ action)  
* POLICY\_VIOLATION:  
   corr\_key \= hash(org\_id \+ category \+ rule\_id \+ src\_ip \+ dst\_ip \+ dst\_port)  
* EDR (MALWARE\_EXECUTION / ENDPOINT\_BEHAVIOR):  
   corr\_key \= hash(org\_id \+ category \+ asset\_host \+ process\_name \+ file\_hash(optional) \+ parent\_process(optional))

**Regras:**

1. Buscar IncidentCandidate aberto com corr\_key e event\_time dentro da janela da categoria.  
2. Se existir:  
   * atualizar last\_seen\_at, event\_count, top\_iocs, top\_assets, severity\_max  
3. Se não existir:  
   * criar novo IncidentCandidate com status OPEN

### **Fase 4: Merge multi-fonte (Firewall \+ EDR no mesmo incidente)**

Objetivo: unir candidatos de fontes diferentes quando representam o mesmo caso.

**MergeKey (prioridade):**

1. asset\_host (se existir)  
2. asset\_ip mapeado pelo inventário (ip \-\> host)  
3. user (quando for AUTH\_ANOMALY)

**Condição de merge:**

* Mesma org\_id  
* Mesmo asset (host ou ip) OU mesmo user  
* Tempo compatível:  
   evento do candidato B dentro de \[candidateA.first\_seen\_at \- 10min, candidateA.last\_seen\_at \+ 60min\]  
* Categoria compatível (exemplos):  
  * firewall NETWORK\_INTRUSION pode casar com EDR MALWARE\_EXECUTION ou ENDPOINT\_BEHAVIOR  
  * firewall AUTH\_ANOMALY pode casar com EDR ENDPOINT\_BEHAVIOR (ex.: execução após login anômalo)

**Ação:**

* Se bater condições, fundir em um único Incident:  
  * sources\_involved \= {FIREWALL, EDR}  
  * anexar eventos e evidências  
  * recalcular severidade final

### **Fase 5: Criação do Incidente (objeto final)**

Um incidente v1 deve ter:

* incident\_id  
* org\_id  
* title (gerado por template)  
* category  
* severity\_final  
* status (OPEN, TRIAGE, IN\_PROGRESS, RESOLVED)  
* first\_seen\_at, last\_seen\_at  
* event\_count\_total  
* assets\_involved  
* users\_involved  
* iocs\_involved  
* sources\_involved  
* evidence\_preview (top 10 eventos, compactados)

---

## **7\. Cálculo de severidade final (v1)**

Regra simples e debuggável:

1. severity\_final \= max(severity\_bucket de todos eventos no incidente)  
2. Ajuste por volume e recorrência:  
* Se event\_count\_total \>= 100 dentro da janela: subir 1 nível (até CRITICO)  
* Se mesma corr\_key reaparece em 3 janelas no mesmo dia: subir 1 nível  
3. Ajuste por ativo crítico:  
* Se asset estiver marcado como “crown jewel” ou “server”: subir 1 nível

---

## **8\. Títulos e templates (v1)**

Gerar títulos de incidente por categoria e entidades:

* AUTH\_ANOMALY:  
   “Tentativa de acesso suspeita para {user} a partir de {src\_ip}”  
* NETWORK\_RECON:  
   “Varredura de rede detectada de {src\_ip} para {dst\_ip}”  
* NETWORK\_INTRUSION:  
   “Assinatura IPS {signature\_id} acionada entre {src\_ip} e {dst\_ip}:{dst\_port}”  
* MALWARE\_EXECUTION:  
   “Execução suspeita em {asset\_host} com indicador {file\_hash ou process\_name}”  
* ENDPOINT\_BEHAVIOR:  
   “Comportamento suspeito em endpoint {asset\_host}”  
* DATA\_EXFIL:  
   “Possível exfiltração associada a {asset\_host ou user}”

---

## **9\. Onde entra IA no v1 (sem decidir correlação)**

A IA não decide abrir incidente no v1. Ela entra após o incidente existir para:

* gerar summary em 5 linhas  
* gerar hypotheses (2 a 3 possibilidades)  
* gerar recommended\_actions (3 a 5 passos)  
* opcional: mapear tags MITRE (best effort)

Fallback obrigatório: se IA falhar, incidente permanece com template e evidência, sem bloquear UI.

---

## **10\. Observabilidade e debug (obrigatório no v1)**

Para cada incidente, registrar:

* corr\_key  
* merge\_key  
* window\_start, window\_end  
* raw\_event\_count  
* dedup\_dropped\_count  
* sources\_involved  
* why\_merged (motivo, regra que bateu)  
* why\_severity (de onde veio a severidade final)

Isso é essencial para depurar casos como “por que abriu 10 incidentes em vez de 1”.

---

## **11\. Critérios de sucesso do v1**

* Redução de ruído: 1000 eventos de firewall em 1h viram 1 a 3 incidentes, não 100\.  
* Consistência: recarregar a mesma janela não cria duplicatas.  
* Correlação multi-fonte: pelo menos 1 caso real de firewall \+ EDR fundido corretamente.  
* Debug fácil: dado um incidente, o dev explica em 1 minuto por que ele existe.

