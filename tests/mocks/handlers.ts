import { http, HttpResponse } from 'msw'

export const handlers = [
    // Supabase Auth mock
    http.get('*/auth/v1/user', () => {
        return HttpResponse.json({
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'authenticated',
        })
    }),

    // Supabase session mock
    http.get('*/auth/v1/session', () => {
        return HttpResponse.json({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: {
                id: 'test-user-id',
                email: 'test@example.com',
            },
        })
    }),

    // Example API handler for projects
    http.get('*/rest/v1/projects*', () => {
        return HttpResponse.json([
            {
                id: 'project-1',
                name: 'Test Project',
                description: 'A test project',
                industry: 'tech',
                stage: 'mvp',
            },
        ])
    }),

    // AI chat endpoint mock
    http.post('/api/ai/chat', async () => {
        return HttpResponse.json({
            message: 'This is a mock AI response for testing purposes.',
        })
    }),
]
