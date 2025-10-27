# Product Brief - bun-tts

**Date:** 2025-10-26
**Author:** Eduardo Menoncello
**Version:** 1.0
**Project Level:** 2 (Medium Project - Multiple Epics)

---

## Executive Summary

**bun-tts** é uma ferramenta CLI/TUI profissional para criação de audiobooks a partir de documentos digitais, utilizando engines TTS open-source (Kokoro, Chatterbox) com sistema adaptável para APIs externas. O projeto democratiza a produção de audiobooks oferecendo controle granular sobre pronúncias, emoções e estrutura do conteúdo, funcionando completamente offline enquanto mantém flexibilidade para integrações futuras.

---

## Problem Statement

### Current State

Criar audiobooks a partir de documentos existentes é um processo manualmente intensivo que requer:

- Ferramentas múltiplas para diferentes formatos de arquivo (MD, PDF, EPUB)
- Processamento manual de estruturação de conteúdo
- Controle limitado sobre pronúncia e emoções no TTS
- Falta de visibilidade granular do processo de conversão
- Dependência de APIs pagas e serviços online

### Impact

Usuários que precisam converter documentos em áudio perdem tempo significativo em processamento manual, enfrentam inconsistências na qualidade do áudio, têm controle limitado sobre aspectos essenciais como pronúncia de termos técnicos e emoções apropriadas para cada contexto, além de custos recorrentes com APIs TTS.

### Why Now

Com avanços em TTS open-source (Kokoro, Chatterbox) e crescente demanda por conteúdo em áudio (audiobooks, podcasts, acessibilidade), existe uma oportunidade clara para uma ferramenta especializada independente que ofereça controle profissional sobre o processo de criação de audiobooks sem custos recorrentes.

---

## Proposed Solution

**bun-tts** é uma ferramenta CLI/TUI poderosa para criação profissional de audiobooks a partir de documentos digitais.

### Core Approach

- Processamento inteligente de múltiplos formatos (MD, PDF, EPUB)
- Análise estrutural automática (capítulos → parágrafos → frases)
- **Sistema Híbrido TTS:** Adaptadores para engines open-source + APIs externas
- Sistema avançado de personalização (pronúncias, emoções)
- Interface dual: CLI para automação e TUI para controle visual

### Key Differentiators

- **Arquitetura de TTS Adapter:** Suporte nativo para engines open-source (Kokoro, Chatterbox) com path para APIs externas
- Processamento em lote com controle individual de cada frase
- Sistema de pronúncias customizadas para termos específicos
- Motor de emoções (manual, automático com IA, ou desabilitado)
- Interface TUI para gerenciamento visual do processo
- **Independente de API:** Funciona completamente offline com engines open-source
- **Cross-platform:** Windows, macOS, Linux

---

## Target Users

### Primary User Segment

**Content Creators & Technical Authors**

- Profissionais técnicos que documentam em MD/PDF e necessitam versões em áudio
- Criadores de conteúdo educacional transformando materiais didáticos
- Autores independentes publicando audiobooks

**Current Methods:** TTS online com controle limitado, gravação manual (demorada e cara), múltiplas ferramentas para diferentes formatos

**Pain Points:** Falta de controle granular, qualidade inconsistente, workflows complexos, custos recorrentes

**Goals:** Criar audiobooks de alta qualidade eficientemente, manter controle sobre pronúncias e tom, automatizar conversão em lote

### Secondary User Segment

**Developers & Accessibility Professionals**

- Developers integrando audiobooks em sistemas
- Accessibility professionals criando conteúdo para usuários com deficiências visuais
- Publishers convertendo catálogos existentes

---

## Goals and Success Metrics

### Business Objectives

- Estabelecer bun-tts como ferramenta padrão para criação de audiobooks técnicos/educacionais
- Criar comunidade open-source em torno do projeto
- Gerar oportunidades de consultoria e serviços premium

### User Success Metrics

- Tempo médio de conversão por documento < 60% do tempo manual
- Taxa de sucesso de processamento > 95%
- Satisfação com qualidade de áudio (NPS > 40)
- Adoção offline sem dependências externas

### Key Performance Indicators

- Downloads e utilização ativa da CLI
- Contribuições para o repositório open-source
- Taxa de adoção entre comunidades técnicas
- Métricas de qualidade: precisão de pronúncia, naturalidade da emoção

---

## MVP Scope

### Core Features (Must-Have)

1. **Parser Multi-formato:** MD, PDF, EPUB com estruturação automática
2. **TTS Adapter System:** Implementação com Kokoro e Chatterbox
3. **Motor TTS:** Processamento frase por frase com concatenação
4. **CLI Interface:** Comandos básicos para conversão
5. **Sistema de Pronúncias:** Cadastro e aplicação de pronúncias customizadas
6. **TUI Básica:** Visualização de estrutura e progresso

### Out of Scope (v2+)

- APIs TTS premium (vão para sistema de adapters)
- Interface web completa
- Integração com plataformas de distribuição
- Edição avançada de áudio
- Colaboração multi-usuário
- Cloud processing

### MVP Success Criteria

- Converter documentos completos usando engines open-source
- Processar 1000+ páginas sem falhas offline
- Sistema de pronúncias funcionando para termos técnicos
- Switch entre Kokoro e Chatterbox transparente para usuário

---

## Post-MVP Vision

### Phase 2 Features

- Motor de emoções com IA para análise automática de sentimento
- Processamento paralelo para performance otimizada
- TTS Adapter system para APIs externas (OpenAI, Google, Amazon)
- Exportação em múltiplos formatos de áudio
- Sistema de plugins para extensões

### Long-term Vision (1-2 years)

- Plataforma completa de produção de conteúdo em áudio
- Marketplace de vozes e configurações
- Serviço cloud para processamento em larga escala
- Ferramentas colaborativas para equipes

### Expansion Opportunities

- Segmento corporativo (documentação interna)
- Mercado educacional (material didático)
- Acessibilidade (conteúdo para deficiências visuais)

---

## Financial Impact and Strategic Alignment

### Financial Impact

- **Development Investment:** **Zero** - 100% open-source
- **Operational Costs:** Mínimos (hospedagem, domínio)
- **Revenue Potential:** Serviços premium, suporte empresarial, features avançadas
- **Cost Savings:** **95%+** vs gravação profissional + sem custos de API
- **Break-even Timeline:** **Imediato** - modelo de negócio baseado em serviços, não em custos

### Strategic Value

- **Liderança Técnica:** Primeira ferramenta CLI profissional com TTS open-source
- **Contribuição Open-Source:** Referência em adaptação TTS
- **Independência Tecnológica:** Sem dependências críticas de terceiros
- **Oportunidades de Consultoria:** Implementação enterprise de sistemas TTS

### Strategic Initiatives Supported

- Democratização de ferramentas de produção de conteúdo
- Acessibilidade digital e inclusão
- Automação de workflows técnicos
- Fortalecimento ecossistema open-source

---

## Technical Considerations

### Platform Requirements

- **Primary:** CLI tool (cross-platform: Windows, macOS, Linux)
- **Secondary:** TUI interface para controle visual
- **Performance:** Processamento local com otimização de memória
- **Accessibility:** Suporte completo a screen readers
- **Offline Capability:** Funcionamento completo sem internet

### Technology Preferences

- **Language:** Bun (performance e ecossistema TypeScript)
- **Parsing:** Bibliotecas especializadas por formato
- **TTS Architecture:**
  - **TTS Adapter System:** Interface unificada para múltiplas engines
  - **Open-Source First:** Kokoro-js, Chatterbox-js como engines primárias
  - **API Integration:** OpenAI TTS, Google Cloud, Amazon Polly (opcionais)
- **TUI Framework:** React/Ink ou similar para CLI interativa

### Architecture Considerations

- **TTS Adapter Pattern:**
  ```typescript
  interface ITTSAdapter {
    synthesize(text: string, options: TTSOptions): Promise<AudioBuffer>;
    getSupportedVoices(): Voice[];
    getCapabilities(): TTSCapabilities;
  }
  ```
- Pipeline modular: Input → Parse → Structure → TTS Adapter → Concatenate → Output
- **Plugin System:** Para engines TTS customizadas
- Cache inteligente para reprocessamento rápido
- Sistema de configuração extensível

### TTS Implementation Strategy

- **Fase 1:** Implementação completa com Kokoro e Chatterbox
- **Fase 2:** TTS Adapter system para APIs externas
- **Fase 3:** Plugin marketplace para engines customizadas

---

## Constraints and Assumptions

### Constraints

- **Budget:** Desenvolvimento open-source com recursos limitados
- **Timeline:** MVP em 2-3 meses com recursos dedicados
- **Team:** Pequeno time técnico (1-3 desenvolvedores)
- **Technical:** Qualidade das engines open-source vs APIs comerciais

### Key Assumptions

- Usuários têm conforto com interfaces CLI
- Documentos de entrada têm estrutura razoável
- Engines open-source manterão qualidade e desenvolvimento
- Comunidade open-source contribuirá com melhorias

---

## Key Risks and Open Questions

### Key Risks

- **Quality Consistency:** Manter padrão de áudio através de diferentes conteúdos com engines open-source
- **Complexity Balance:** Manter ferramenta poderosa mas acessível
- **Performance:** Processamento de documentos grandes localmente

### Open Questions

- Qual faixa de preço ideal para serviços premium?
- Como priorizar features pós-MVP baseado em feedback?
- Quais engines TTS adicionais implementar primeiro?

### Research Areas

- Análise comparativa de qualidade entre engines TTS
- Validação de necessidade de emoções com usuários-alvo
- Testes de performance com documentos grandes

---

## Supporting Materials

### Research Summary

- Mercado de TTS open-source em crescimento acelerado
- Demanda crescente por ferramentas CLI de alta qualidade
- Necessidade comprovada de soluções offline para conteúdo técnico

### Stakeholder Input

- Comunidade open-source engajada com projetos TTS
- Content creators demandando mais controle sobre processo
- Enterprise interest em soluções self-hosted

### References

- Kokoro-js Documentation
- Chatterbox-js Repository
- TTS Adapter Pattern Research
- CLI Best Practices Documentation

---

## Next Steps

### Immediate Actions (PM-TODO)

1. **Create PRD:** Transformar este brief em Product Requirements Document detalhado
2. **Technical Architecture:** Desenvolver especificação técnica do TTS Adapter system
3. **UI/UX Design:** Design da interface TUI e experiência do usuário CLI
4. **Development Planning:** Criar roadmap e milestones para MVP

### Handoff to PM

Este brief serve como base estratégica para desenvolvimento do PRD. PM deve detalhar:

- Epic breakdown para features específicas
- User stories detalhadas para cada segmento
- Technical specifications para arquitetura
- Development timeline e resource allocation

---

**Document Status:** ✅ Complete
**Ready for PRD Development:** ✅
**Next Agent:** Product Manager (PM)
**Next Command:** prd

---

_Last Updated: 2025-10-26_
