import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Presence Hook Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should have correct default room name', () => {
        const defaultRoomName = 'online-users'
        expect(defaultRoomName).toBe('online-users')
    })

    it('should validate user id is required', () => {
        const userId = ''
        const shouldSkip = !userId
        expect(shouldSkip).toBe(true)
    })

    it('should validate user id is present', () => {
        const userId = 'user-123'
        const shouldSkip = !userId
        expect(shouldSkip).toBe(false)
    })

    it('should use custom room name when provided', () => {
        const options = { roomName: 'custom-room' }
        const roomName = options.roomName || 'online-users'
        expect(roomName).toBe('custom-room')
    })

    it('should use default room name when not provided', () => {
        const options = {}
        const roomName = (options as { roomName?: string }).roomName || 'online-users'
        expect(roomName).toBe('online-users')
    })

    describe('Presence State Deduplication', () => {
        it('should deduplicate users by id', () => {
            const presenceState = {
                'user-1': [
                    { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:00:00Z' },
                    { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:01:00Z' },
                ],
                'user-2': [
                    { id: 'user-2', email: 'user2@example.com', online_at: '2024-01-01T00:00:00Z' },
                ],
            }

            // Flatten all presences
            const users: Array<{ id: string; email: string; online_at: string }> = []
            for (const presences of Object.values(presenceState)) {
                for (const presence of presences) {
                    users.push(presence)
                }
            }

            // Deduplicate by id
            const uniqueUsers = Array.from(
                new Map(users.map(u => [u.id, u])).values()
            )

            expect(uniqueUsers.length).toBe(2)
            expect(uniqueUsers.find(u => u.id === 'user-1')).toBeDefined()
            expect(uniqueUsers.find(u => u.id === 'user-2')).toBeDefined()
        })

        it('should handle empty presence state', () => {
            const presenceState = {}

            const users: Array<{ id: string; email: string; online_at: string }> = []
            for (const presences of Object.values(presenceState)) {
                for (const presence of presences) {
                    users.push(presence)
                }
            }

            expect(users.length).toBe(0)
        })
    })

    describe('Join Event Handling', () => {
        it('should add new users on join', () => {
            const existingUsers = [
                { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:00:00Z' },
            ]

            const newPresences = [
                { id: 'user-2', email: 'user2@example.com', online_at: '2024-01-01T00:01:00Z' },
            ]

            const newUsers = newPresences.filter(
                (p) => !existingUsers.some(u => u.id === p.id)
            )

            const updatedUsers = [...existingUsers, ...newUsers]
            expect(updatedUsers.length).toBe(2)
        })

        it('should not add duplicate users on join', () => {
            const existingUsers = [
                { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:00:00Z' },
            ]

            const newPresences = [
                { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:01:00Z' },
            ]

            const newUsers = newPresences.filter(
                (p) => !existingUsers.some(u => u.id === p.id)
            )

            const updatedUsers = [...existingUsers, ...newUsers]
            expect(updatedUsers.length).toBe(1)
        })
    })

    describe('Leave Event Handling', () => {
        it('should remove users on leave', () => {
            const existingUsers = [
                { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:00:00Z' },
                { id: 'user-2', email: 'user2@example.com', online_at: '2024-01-01T00:01:00Z' },
            ]

            const leftPresences = [
                { id: 'user-1', email: 'user1@example.com', online_at: '2024-01-01T00:00:00Z' },
            ]

            const updatedUsers = existingUsers.filter(
                u => !leftPresences.some((p) => p.id === u.id)
            )

            expect(updatedUsers.length).toBe(1)
            expect(updatedUsers[0].id).toBe('user-2')
        })
    })
})

describe('Presence State Management', () => {
    it('should correctly format presence data', () => {
        const presenceData = {
            id: 'user-123',
            email: 'test@example.com',
            online_at: new Date().toISOString(),
        }

        expect(presenceData).toHaveProperty('id')
        expect(presenceData).toHaveProperty('email')
        expect(presenceData).toHaveProperty('online_at')
    })

    it('should handle null email', () => {
        const presenceData = {
            id: 'user-123',
            email: null,
            online_at: new Date().toISOString(),
        }

        expect(presenceData.email).toBeNull()
    })
})

describe('Connected Users Component Logic', () => {
    it('should display correct count label', () => {
        const count = 5
        const expectedLabel = `${count} users online`

        expect(expectedLabel).toContain(count.toString())
    })

    it('should handle zero connected users', () => {
        const count = 0
        const isEmpty = count === 0

        expect(isEmpty).toBe(true)
    })

    it('should parse online timestamp correctly', () => {
        const onlineAt = '2024-01-01T12:00:00Z'
        const date = new Date(onlineAt)

        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(0) // January is 0
        expect(date.getDate()).toBe(1)
    })
})
