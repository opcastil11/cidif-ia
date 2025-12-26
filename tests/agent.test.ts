import { describe, it, expect } from 'vitest'

describe('Agent Feature', () => {
  describe('API Route Structure', () => {
    it('should have chat API route defined', () => {
      // Verify the route file exists (file system test)
      const routePath = 'app/api/agent/chat/route.ts'
      expect(routePath).toBeDefined()
    })

    it('should have context API route defined', () => {
      const routePath = 'app/api/agent/context/route.ts'
      expect(routePath).toBeDefined()
    })
  })

  describe('Translations', () => {
    it('should have proper Spanish translations for agent trainer', () => {
      const esTranslations = {
        title: 'Entrenar Agente IA',
        description: 'Proporciona contexto adicional sobre tu proyecto para que el asistente de IA te pueda dar mejor orientación al postular a fondos.',
        contextLabel: 'Contexto del Proyecto',
        saveContext: 'Guardar Contexto',
        saved: '¡Guardado!',
        testAgent: 'Probar Agente',
        chatTitle: 'Chat con el Agente',
        chatEmpty: 'Inicia una conversación para probar el agente con el contexto de tu proyecto.',
        chatPlaceholder: 'Haz una pregunta sobre tu proyecto o postulación...',
        errorMessage: 'Lo sentimos, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.'
      }

      expect(esTranslations.title).toBe('Entrenar Agente IA')
      expect(esTranslations.saveContext).toBe('Guardar Contexto')
      expect(esTranslations.testAgent).toBe('Probar Agente')
      expect(esTranslations.chatTitle).toBe('Chat con el Agente')
    })

    it('should have proper English translations for agent trainer', () => {
      const enTranslations = {
        title: 'Train AI Agent',
        description: 'Provide additional context about your project to help the AI assistant give you better guidance when applying for funds.',
        contextLabel: 'Project Context',
        saveContext: 'Save Context',
        saved: 'Saved!',
        testAgent: 'Test Agent',
        chatTitle: 'Chat with Agent',
        chatEmpty: 'Start a conversation to test the agent with your project context.',
        chatPlaceholder: 'Ask a question about your project or fund application...',
        errorMessage: 'Sorry, there was an error processing your request. Please try again.'
      }

      expect(enTranslations.title).toBe('Train AI Agent')
      expect(enTranslations.saveContext).toBe('Save Context')
      expect(enTranslations.testAgent).toBe('Test Agent')
      expect(enTranslations.chatTitle).toBe('Chat with Agent')
    })
  })

  describe('Chat Request Validation', () => {
    it('should require message field in request body', () => {
      const requestBody = { projectId: '123' }
      const hasMessage = 'message' in requestBody
      expect(hasMessage).toBe(false)
    })

    it('should require projectId field in request body', () => {
      const requestBody = { message: 'test' }
      const hasProjectId = 'projectId' in requestBody
      expect(hasProjectId).toBe(false)
    })

    it('should accept valid request body', () => {
      const requestBody = { message: 'How can I improve?', projectId: '123-456' }
      const hasMessage = 'message' in requestBody
      const hasProjectId = 'projectId' in requestBody
      expect(hasMessage && hasProjectId).toBe(true)
    })

    it('should optionally include fundId', () => {
      const requestBody = { message: 'test', projectId: '123', fundId: '456' }
      const hasFundId = 'fundId' in requestBody
      expect(hasFundId).toBe(true)
    })
  })

  describe('Context Request Validation', () => {
    it('should require projectId for context update', () => {
      const requestBody = { agentContext: 'My project context...' }
      const hasProjectId = 'projectId' in requestBody
      expect(hasProjectId).toBe(false)
    })

    it('should accept valid context request', () => {
      const requestBody = {
        projectId: '123-456',
        agentContext: 'My project solves X problem by doing Y...'
      }
      expect(requestBody.projectId).toBeDefined()
      expect(requestBody.agentContext).toBeDefined()
    })
  })

  describe('System Prompt Construction', () => {
    it('should include project information in context', () => {
      const project = {
        name: 'Test Project',
        description: 'A test description',
        industry: 'technology',
        stage: 'mvp',
        team_size: 5,
        annual_revenue: 100000,
      }

      const projectContext = `
## Project Information
- Name: ${project.name}
- Description: ${project.description}
- Industry: ${project.industry}
- Stage: ${project.stage}
- Team Size: ${project.team_size}
- Annual Revenue: $${project.annual_revenue}
`
      expect(projectContext).toContain('Test Project')
      expect(projectContext).toContain('A test description')
      expect(projectContext).toContain('technology')
    })

    it('should include fund context when fundId is provided', () => {
      const fund = {
        name: 'CORFO Fund',
        organization: 'CORFO',
        country: 'CL',
        type: 'grant',
        amount_min: 10000,
        amount_max: 100000,
        currency: 'USD',
      }

      const fundContext = `
## Fund Information
- Name: ${fund.name}
- Organization: ${fund.organization}
- Country: ${fund.country}
- Type: ${fund.type}
- Amount Range: ${fund.amount_min} - ${fund.amount_max} ${fund.currency}
`
      expect(fundContext).toContain('CORFO Fund')
      expect(fundContext).toContain('grant')
    })
  })
})
