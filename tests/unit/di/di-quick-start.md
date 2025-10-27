# DI Quick Start Guide - bun-tts

Guia rápido de como usar Dependency Injection nos testes do projeto bun-tts.

## 🚀 Como Começar

### 1. DI Manual (Simples e Recomendado para Testes)

```typescript
import { ConfigManager } from '../../../src/config';
import { Logger } from '../../../src/utils/logger';

describe('SeuTeste', () => {
  it('deve usar DI manual', async () => {
    // Criar dependências manualmente
    const configManager = new ConfigManager();
    const logger = new Logger();

    // Criar seu componente com dependências injetadas
    const seuComponente = new SeuComponente(configManager, logger);

    // Testar
    const resultado = await seuComponente.executar();
    expect(resultado).toBeDefined();
  });
});
```

### 2. Mock de Dependências

```typescript
describe('Teste com Mocks', () => {
  it('deve usar mocks', async () => {
    // Criar mocks
    const mockConfigManager = {
      loadConfig: jest.fn().mockResolvedValue({
        success: true,
        data: { ttsEngine: 'mock-engine' },
      }),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    // Injetar mocks
    const componente = new SeuComponente(mockConfigManager as any, mockLogger as any);

    // Testar
    await componente.executar();

    // Verificar interações
    expect(mockConfigManager.loadConfig).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
```

### 3. Factory Pattern para Reutilização

```typescript
class TestFactory {
  static createComponent(configManager?: ConfigManager, logger?: Logger): SeuComponente {
    return new SeuComponente(configManager || new ConfigManager(), logger || new Logger());
  }

  static createMockComponent(mockConfigManager?: any, mockLogger?: any): SeuComponente {
    return new SeuComponente(
      mockConfigManager || {
        loadConfig: jest.fn().mockResolvedValue({
          success: true,
          data: { ttsEngine: 'mock-engine' },
        }),
      },
      mockLogger || {
        info: jest.fn(),
        error: jest.fn(),
      }
    );
  }
}

describe('Teste com Factory', () => {
  it('deve usar factory para criar componentes', async () => {
    const componente = TestFactory.createMockComponent();
    const resultado = await componente.executar();

    expect(resultado.success).toBe(true);
  });
});
```

## 📁 Estrutura de Arquivos de Teste

```
tests/unit/
├── config/
│   └── config-manager-di.test.ts     # Testes do ConfigManager com DI
├── commands/
│   ├── help-command.test.ts          # Testes do HelpCommand
│   └── config-command.test.ts        # Testes do ConfigCommand
├── di/
│   ├── simple-di-example.test.ts      # Exemplos de DI
│   └── test-utils.ts                 # Utilidades de teste (opcional)
└── di-quick-start.md                 # Este guia
```

## ✅ Exemplos Práticos

### Teste de ConfigManager

```typescript
describe('ConfigManager DI', () => {
  it('deve carregar configuração padrão', async () => {
    const configManager = new ConfigManager();
    const result = await configManager.loadConfig();

    expect(result.success).toBe(true);
    expect(result.data?.ttsEngine).toBe('kokoro');
  });

  it('deve aceitar configuração customizada', async () => {
    const configManager = new ConfigManager();
    const result = await configManager.loadConfig({
      defaults: { ttsEngine: 'chatterbox' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.ttsEngine).toBe('chatterbox');
  });
});
```

### Teste de Componente com Logger

```typescript
describe('Componente com Logger', () => {
  it('deve loggar mensagens', () => {
    const mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const componente = new SeuComponente(new ConfigManager(), mockLogger as any);
    componente.executarAlgo();

    expect(mockLogger.info).toHaveBeenCalled();
  });
});
```

### Teste de Integração

```typescript
describe('Integração ConfigManager + Logger', () => {
  it('deve funcionar junto', async () => {
    const configManager = new ConfigManager();
    const logger = new Logger();

    const componente = new SeuComponente(configManager, logger);
    const resultado = await componente.executar();

    expect(resultado.success).toBe(true);
    expect(configManager.getConfig()).toBeDefined();
  });
});
```

## 🎯 Boas Práticas

### 1. Mantenha Testes Simples

```typescript
// ✅ Bom - Simples e direto
it('deve carregar configuração', async () => {
  const configManager = new ConfigManager();
  const result = await configManager.loadConfig();
  expect(result.success).toBe(true);
});

// ❌ Ruim - Complicado demais
it('deve carregar configuração com setup complexo', async () => {
  // Setup complexo desnecessário...
});
```

### 2. Use Mocks Apenas Quando Necessário

```typescript
// ✅ Use dependências reais quando possível
it('deve funcionar com dependências reais', async () => {
  const configManager = new ConfigManager();
  const logger = new Logger();
  const componente = new SeuComponente(configManager, logger);
  // ...
});

// ❌ Não abuse de mocks
it('deve funcionar com tudo mockado', async () => {
  const mockConfig = { loadConfig: jest.fn() };
  const mockLogger = { info: jest.fn() };
  // Use apenas quando realmente necessário
});
```

### 3. Teste Comportamento, Não Implementação

```typescript
// ✅ Teste o comportamento
it('deve processar documento com sucesso', async () => {
  const componente = new DocumentProcessor(configManager, logger);
  const resultado = await componente.processar('test.md');
  expect(resultado.success).toBe(true);
});

// ❌ Não teste detalhes da implementação
it('deve chamar loadConfig exatamente 1 vez', async () => {
  // Muito específico e frágil
});
```

## 🔧 Como Adaptar Testes Existentes

### Antes (sem DI):

```typescript
describe('ComandoAntigo', () => {
  it('deve executar', async () => {
    const comando = new ComandoAntigo(); // Singleton interno
    await comando.executar();
    // Hard de testar...
  });
});
```

### Depois (com DI):

```typescript
describe('ComandoComDI', () => {
  it('deve executar com dependências injetadas', async () => {
    const configManager = new ConfigManager();
    const logger = new Logger();
    const comando = new ComandoComDI(configManager, logger);

    await comando.executar();
    // Fácil de testar e mockar!
  });
});
```

## 📚 Recursos Adicionais

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Bun Testing**: https://bun.sh/docs/cli/test
- **DI Patterns**: https://martinfowler.com/articles/injection.html

---

## 🎉 Resumo

1. **DI Manual** é suficiente para a maioria dos testes
2. **Use construtores** para injetar dependências
3. **Mock dependências** apenas quando necessário
4. **Teste comportamento**, não implementação
5. **Mantenha testes simples** e legíveis

Com essa abordagem, seus testes serão mais robustos, fáceis de manter e rápidos de executar!
