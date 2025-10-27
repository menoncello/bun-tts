# DI Testing Guide - bun-tts

Este guia mostra como usar Dependency Injection (DI) nos testes do projeto bun-tts para melhorar a
testabilidade e permitir mocking de dependências.

## 📋 Índice

1. [Configuração Básica](#configuração-básica)
2. [Testes Unitários com Mocks](#testes-unitários-com-mocks)
3. [Testes de Integração](#testes-de-integração)
4. [Testando Componentes CLI](#testando-componentes-cli)
5. [Boas Práticas](#boas-práticas)
6. [Exemplos Práticos](#exemplos-práticos)

---

## 🛠️ Configuração Básica

### Importar Utilidades de Teste DI

```typescript
import {
  createTestContainer, // Container com dependências reais
  createMockTestContainer, // Container com mocks
  createMockLogger, // Mock de Logger
  createMockConfigManager, // Mock de ConfigManager
  resolveFromContainer, // Resolver dependências
  createTestCliContext, // Criar contexto CLI para testes
  resetContainerMocks, // Resetar mocks
} from '../di/test-utils';
```

### Estrutura Básica de um Teste com DI

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { createMockTestContainer, createMockLogger } from '../di/test-utils';

describe('SeuComponente com DI', () => {
  let mockLogger: any;
  let seuComponente: SeuComponente;

  beforeEach(() => {
    // 1. Criar mocks das dependências
    mockLogger = createMockLogger();

    // 2. Criar container de teste com mocks
    const testContainer = createMockTestContainer({ logger: mockLogger });

    // 3. Resolver o componente do container
    seuComponente = testContainer.resolve<SeuComponente>('seuComponente');
  });

  // Seus testes aqui...
});
```

---

## 🧪 Testes Unitários com Mocks

### Mock de Logger

```typescript
import { createMockLogger } from '../di/test-utils';

describe('Componente com Logger Mockado', () => {
  let mockLogger: any;
  let componente: SeuComponente;

  beforeEach(() => {
    mockLogger = createMockLogger();
    // Configurar comportamento esperado
    mockLogger.info.mockReturnValue(undefined);

    const testContainer = createMockTestContainer({ logger: mockLogger });
    componente = testContainer.resolve<SeuComponente>('seuComponente');
  });

  it('deve logar informação quando executar ação', async () => {
    await componente.executarAcao();

    // Verificar se logger foi chamado corretamente
    expect(mockLogger.info).toHaveBeenCalledWith('Ação executada com sucesso', {
      operation: 'acao',
    });
  });

  it('deve logar erro quando falhar', async () => {
    const erro = new Error('Falha simulada');
    mockLogger.info.mockImplementation(() => {
      throw erro;
    });

    await expect(componente.executarAcao()).rejects.toThrow('Falha simulada');

    expect(mockLogger.error).toHaveBeenCalledWith('Erro ao executar ação', erro);
  });
});
```

### Mock de ConfigManager

```typescript
import { createMockConfigManager } from '../di/test-utils';

describe('Componente com ConfigManager Mockado', () => {
  let mockConfigManager: any;
  let componente: SeuComponente;

  beforeEach(() => {
    mockConfigManager = createMockConfigManager();

    // Configurar mock para retornar configuração específica
    mockConfigManager.loadConfig.mockResolvedValue({
      success: true,
      data: { ttsEngine: 'kokoro', outputFormat: 'mp3' },
    });

    const testContainer = createMockTestContainer({
      configManager: mockConfigManager,
    });
    componente = testContainer.resolve<SeuComponente>('seuComponente');
  });

  it('deve carregar configuração ao inicializar', async () => {
    await componente.inicializar();

    expect(mockConfigManager.loadConfig).toHaveBeenCalledTimes(1);
  });

  it('deve usar configuração carregada', async () => {
    await componente.inicializar();
    const resultado = componente.getConfiguracaoAtual();

    expect(resultado.ttsEngine).toBe('kokoro');
  });
});
```

---

## 🔗 Testes de Integração

### Container com Dependências Reais

```typescript
import { createTestContainer } from '../di/test-utils';

describe('Integração entre Componentes', () => {
  let testContainer: AwilixContainer;
  let configManager: ConfigManager;
  let logger: Logger;

  beforeEach(() => {
    // Criar container com dependências reais
    testContainer = createTestContainer();

    // Resolver dependências reais
    configManager = testContainer.resolve<ConfigManager>('configManager');
    logger = testContainer.resolve<Logger>('logger');
  });

  it('deve integrar ConfigManager e Logger corretamente', async () => {
    // Carregar configuração real
    const configResult = await configManager.loadConfig();

    expect(configResult.success).toBe(true);

    // Logger real deve funcionar
    logger.info('Teste de integração', { config: configResult.data });

    // Verificar que ambos funcionam juntos
    expect(configResult.data).toBeDefined();
  });

  it('deve manter singleton behavior em integração', async () => {
    const config1 = testContainer.resolve<ConfigManager>('configManager');
    const config2 = testContainer.resolve<ConfigManager>('configManager');

    // Devem ser a mesma instância (singleton)
    expect(config1).toBe(config2);

    // Estado deve ser compartilhado
    await config1.loadConfig({ defaults: { ttsEngine: 'chatterbox' } });
    const configFromSecond = config2.getConfig();

    expect(configFromSecond?.ttsEngine).toBe('chatterbox');
  });
});
```

---

## 🖥️ Testando Componentes CLI

### Comando com DI

```typescript
import { HelpCommand } from '../../../src/cli/commands/HelpCommand';
import { createMockTestContainer, createTestCliContext } from '../di/test-utils';

describe('HelpCommand com DI', () => {
  let helpCommand: HelpCommand;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    const testContainer = createMockTestContainer({ logger: mockLogger });
    helpCommand = testContainer.resolve<HelpCommand>('helpCommand');
  });

  it('deve executar com contexto CLI mockado', async () => {
    const cliContext = createTestCliContext({
      flags: { verbose: true },
      inputFile: 'test.md',
    });

    await helpCommand.execute(cliContext);

    expect(mockLogger.info).toHaveBeenCalledWith('Help command executed');
    expect(mockLogger.debug).toHaveBeenCalledWith('Help command executed with verbose information');
  });

  it('deve lidar com diferentes contextos CLI', async () => {
    const contexts = [
      createTestCliContext({ flags: { verbose: false } }),
      createTestCliContext({ flags: { verbose: true } }),
      createTestCliContext({ args: ['extra'] }),
    ];

    for (const context of contexts) {
      await expect(helpCommand.execute(context)).resolves.not.toThrow();
    }

    expect(mockLogger.info).toHaveBeenCalledTimes(3);
  });
});
```

### Testando Fluxos Complexos

```typescript
describe('ConvertCommand com fluxo completo', () => {
  let convertCommand: ConvertCommand;
  let mockLogger: any;
  let mockConfigManager: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfigManager = createMockConfigManager();

    // Configurar comportamento complexo
    mockConfigManager.loadConfig.mockImplementation(async (options) => {
      if (options.configPath) {
        return { success: false, error: new Error('File not found') };
      }
      return { success: true, data: { ttsEngine: 'kokoro' } };
    });

    const testContainer = createMockTestContainer({
      logger: mockLogger,
      configManager: mockConfigManager,
    });
    convertCommand = testContainer.resolve<ConvertCommand>('convertCommand');
  });

  it('deve lidar com sucesso e falha de configuração', async () => {
    // Teste com sucesso (sem config file)
    const contextSuccess = createTestCliContext();
    await convertCommand.execute(contextSuccess);

    expect(mockConfigManager.loadConfig).toHaveBeenCalledWith({});
    expect(mockLogger.info).toHaveBeenCalledWith('Convert command started');

    // Resetar mocks
    mockConfigManager.loadConfig.mockClear();
    mockLogger.info.mockClear();

    // Teste com falha (com config file inválido)
    const contextFail = createTestCliContext({
      flags: { config: 'invalid.json' },
    });
    await convertCommand.execute(contextFail);

    expect(mockConfigManager.loadConfig).toHaveBeenCalledWith({
      configPath: 'invalid.json',
    });
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
```

---

## ✅ Boas Práticas

### 1. Isolamento de Testes

```typescript
describe('Componente Isolado', () => {
  beforeEach(() => {
    // Criar container isolado para cada teste
    jest.clearAllMocks();
  });

  it('deve ser independente de outros testes', () => {
    // Teste não deve depender de estado de outros testes
  });
});
```

### 2. Nomenclatura Clara

```typescript
describe('HelpCommand com DI', () => {
  describe('execute()', () => {
    it('deve exibir help com verbose quando flag verbose=true', async () => {
      // Nome claro do teste
    });
  });
});
```

### 3. Configuração Reutilizável

```typescript
// Criar helper para configuração comum
const setupCommandTest = (mocks = {}) => {
  const defaultMocks = {
    logger: createMockLogger(),
    configManager: createMockConfigManager(),
  };

  const testContainer = createMockTestContainer({ ...defaultMocks, ...mocks });
  return testContainer.resolve<ConvertCommand>('convertCommand');
};
```

### 4. Verificação Completa

```typescript
it('deve verificar todas as interações', async () => {
  await componente.executar();

  // Verificar chamadas aos mocks
  expect(mockLogger.info).toHaveBeenCalledTimes(1);
  expect(mockLogger.info).toHaveBeenCalledWith(
    'Operação executada',
    expect.objectContaining({ operation: 'test' })
  );

  // Verificar que outros métodos não foram chamados
  expect(mockLogger.error).not.toHaveBeenCalled();
});
```

---

## 🚀 Exemplos Práticos

### Teste Completo: ConfigCommand

```typescript
import { ConfigCommand } from '../../../src/cli/commands/ConfigCommand';
import { createMockTestContainer, createTestCliContext } from '../di/test-utils';

describe('ConfigCommand - Exemplo Completo', () => {
  let configCommand: ConfigCommand;
  let mockLogger: any;
  let mockConfigManager: any;

  beforeEach(() => {
    // Setup completo com mocks configurados
    mockLogger = createMockLogger();
    mockConfigManager = createMockConfigManager();

    mockConfigManager.loadConfig.mockResolvedValue({
      success: true,
      data: { ttsEngine: 'kokoro', outputFormat: 'mp3' },
    });
    mockConfigManager.createSampleConfig.mockReturnValue('# Sample Config');

    const testContainer = createMockTestContainer({
      logger: mockLogger,
      configManager: mockConfigManager,
    });
    configCommand = testContainer.resolve<ConfigCommand>('configCommand');
  });

  describe('fluxo show', () => {
    it('deve exibir configuração atual', async () => {
      const context = createTestCliContext({ args: ['show'] });

      await configCommand.execute(context);

      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith({});
      expect(mockLogger.info).toHaveBeenCalledWith('Configuration displayed successfully');
    });
  });

  describe('fluxo sample', () => {
    it('deve gerar configuração de exemplo', async () => {
      const context = createTestCliContext({ args: ['sample'] });

      await configCommand.execute(context);

      expect(mockConfigManager.createSampleConfig).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Sample configuration displayed');
    });
  });

  describe('fluxo validate', () => {
    it('deve validar arquivo de configuração', async () => {
      const context = createTestCliContext({
        args: ['validate'],
        flags: { config: 'test.json' },
      });

      await configCommand.execute(context);

      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith({
        configPath: 'test.json',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Configuration validation successful', {
        configPath: 'test.json',
      });
    });
  });

  describe('tratamento de erros', () => {
    it('deve lidar com ação desconhecida', async () => {
      const context = createTestCliContext({ args: ['unknown'] });

      await configCommand.execute(context);

      expect(mockLogger.error).toHaveBeenCalledWith('Unknown config action', {
        action: 'unknown',
      });
    });
  });
});
```

### Teste de Componente com Múltiplas Dependências

```typescript
describe('Componente com Múltiplas Dependências', () => {
  let componente: ComponenteComplexo;
  let mocks: {
    logger: any;
    configManager: any;
    outroServico: any;
  };

  beforeEach(() => {
    // Setup de múltiplos mocks
    mocks = {
      logger: createMockLogger(),
      configManager: createMockConfigManager(),
      outroServico: {
        processar: jest.fn().mockResolvedValue({ success: true }),
      },
    };

    const testContainer = createMockTestContainer(mocks);
    componente = testContainer.resolve<ComponenteComplexo>('componenteComplexo');
  });

  it('deve usar todas as dependências corretamente', async () => {
    const resultado = await componente.executarWorkflow();

    // Verificar que todas as dependências foram usadas
    expect(mocks.configManager.loadConfig).toHaveBeenCalled();
    expect(mocks.outroServico.processar).toHaveBeenCalled();
    expect(mocks.logger.info).toHaveBeenCalled();

    expect(resultado).toBeDefined();
  });
});
```

---

## 📝 Resumo

### ✅ Benefícios do DI nos Testes:

1. **Isolamento** - Cada teste usa suas próprias dependências mockadas
2. **Controlabilidade** - Comportamento das dependências pode ser controlado
3. **Observabilidade** - Interações podem ser verificadas
4. **Reutilização** - Mocks podem ser reutilizados entre testes
5. **Testabilidade** - Componentes se tornam fáceis de testar

### 🎯 Padrões Recomendados:

1. **Usar `createMockTestContainer`** para testes unitários
2. **Usar `createTestContainer`** para testes de integração
3. **Criar mocks específicos** para cada cenário de teste
4. **Verificar todas as interações** importantes
5. **Manter testes isolados** e independentes

Com essa abordagem, seus testes serão mais robustos, maintaináveis e fáceis de entender!
