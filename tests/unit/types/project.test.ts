import { describe, it, expect } from 'vitest'
import {
  founderSchema,
  teamMemberSchema,
  budgetItemSchema,
  milestoneSchema,
  budgetCategories,
  currencies,
  timelineQuarters,
  milestoneStatuses,
  wizardSteps,
} from '@/types/project'

describe('Project Types and Schemas', () => {
  describe('founderSchema', () => {
    it('should validate a valid founder', () => {
      const validFounder = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        role: 'CEO',
        equity_percentage: 30,
        linkedin_url: 'https://linkedin.com/in/johndoe',
        email: 'john@example.com',
        bio: 'Experienced entrepreneur',
        photo_url: 'https://example.com/photo.jpg',
        order_index: 0,
      }

      const result = founderSchema.safeParse(validFounder)
      expect(result.success).toBe(true)
    })

    it('should require name', () => {
      const invalidFounder = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'CEO',
      }

      const result = founderSchema.safeParse(invalidFounder)
      expect(result.success).toBe(false)
    })

    it('should require role', () => {
      const invalidFounder = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
      }

      const result = founderSchema.safeParse(invalidFounder)
      expect(result.success).toBe(false)
    })

    it('should validate equity_percentage range', () => {
      const invalidEquity = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        role: 'CEO',
        equity_percentage: 150, // Invalid - over 100
      }

      const result = founderSchema.safeParse(invalidEquity)
      expect(result.success).toBe(false)
    })

    it('should accept null equity_percentage', () => {
      const validFounder = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        role: 'CEO',
        equity_percentage: null,
      }

      const result = founderSchema.safeParse(validFounder)
      expect(result.success).toBe(true)
    })

    it('should validate email format', () => {
      const invalidEmail = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        role: 'CEO',
        email: 'not-an-email',
      }

      const result = founderSchema.safeParse(invalidEmail)
      expect(result.success).toBe(false)
    })
  })

  describe('teamMemberSchema', () => {
    it('should validate a valid team member', () => {
      const validMember = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Smith',
        role: 'Software Engineer',
        department: 'engineering',
        start_date: '2024-01-15',
        skills: ['TypeScript', 'React', 'Node.js'],
        linkedin_url: 'https://linkedin.com/in/janesmith',
        bio: 'Full-stack developer',
        is_active: true,
        order_index: 0,
      }

      const result = teamMemberSchema.safeParse(validMember)
      expect(result.success).toBe(true)
    })

    it('should require name and role', () => {
      const invalidMember = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = teamMemberSchema.safeParse(invalidMember)
      expect(result.success).toBe(false)
    })

    it('should default skills to empty array', () => {
      const memberWithoutSkills = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Smith',
        role: 'Designer',
      }

      const result = teamMemberSchema.safeParse(memberWithoutSkills)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skills).toEqual([])
      }
    })

    it('should default is_active to true', () => {
      const member = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Smith',
        role: 'Designer',
      }

      const result = teamMemberSchema.safeParse(member)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })
  })

  describe('budgetItemSchema', () => {
    it('should validate a valid budget item', () => {
      const validItem = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'personnel',
        description: 'Developer salaries',
        amount: 50000,
        currency: 'USD',
        justification: 'Need to hire 2 developers',
        timeline_quarter: 'Q1',
        is_recurring: true,
        order_index: 0,
      }

      const result = budgetItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should require positive amount', () => {
      const invalidItem = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'equipment',
        description: 'Laptops',
        amount: -1000,
      }

      const result = budgetItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('should require valid category', () => {
      const invalidCategory = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'invalid_category',
        description: 'Test',
        amount: 1000,
      }

      const result = budgetItemSchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })

    it('should default currency to USD', () => {
      const item = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'software',
        description: 'License fees',
        amount: 500,
      }

      const result = budgetItemSchema.safeParse(item)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
      }
    })
  })

  describe('milestoneSchema', () => {
    it('should validate a valid milestone', () => {
      const validMilestone = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'MVP Launch',
        description: 'Launch minimum viable product',
        target_date: '2024-06-30',
        status: 'in_progress',
        deliverables: ['Feature A', 'Feature B', 'Documentation'],
        dependencies: [],
        completion_percentage: 45,
        order_index: 0,
      }

      const result = milestoneSchema.safeParse(validMilestone)
      expect(result.success).toBe(true)
    })

    it('should require title and target_date', () => {
      const invalidMilestone = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = milestoneSchema.safeParse(invalidMilestone)
      expect(result.success).toBe(false)
    })

    it('should require valid status', () => {
      const invalidStatus = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        target_date: '2024-06-30',
        status: 'invalid_status',
      }

      const result = milestoneSchema.safeParse(invalidStatus)
      expect(result.success).toBe(false)
    })

    it('should validate completion_percentage range', () => {
      const invalidPercentage = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        target_date: '2024-06-30',
        completion_percentage: 150,
      }

      const result = milestoneSchema.safeParse(invalidPercentage)
      expect(result.success).toBe(false)
    })

    it('should default status to pending', () => {
      const milestone = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        target_date: '2024-06-30',
      }

      const result = milestoneSchema.safeParse(milestone)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
      }
    })
  })

  describe('Constants', () => {
    it('should have all budget categories', () => {
      expect(budgetCategories).toContain('personnel')
      expect(budgetCategories).toContain('equipment')
      expect(budgetCategories).toContain('software')
      expect(budgetCategories).toContain('marketing')
      expect(budgetCategories).toContain('contingency')
      expect(budgetCategories.length).toBe(13)
    })

    it('should have all currencies', () => {
      expect(currencies).toContain('USD')
      expect(currencies).toContain('EUR')
      expect(currencies).toContain('CLP')
      expect(currencies).toContain('MXN')
      expect(currencies.length).toBe(8)
    })

    it('should have all timeline quarters', () => {
      expect(timelineQuarters).toContain('Q1')
      expect(timelineQuarters).toContain('Q2')
      expect(timelineQuarters).toContain('Q3')
      expect(timelineQuarters).toContain('Q4')
      expect(timelineQuarters).toContain('Q1-Q4')
      expect(timelineQuarters.length).toBe(8)
    })

    it('should have all milestone statuses', () => {
      expect(milestoneStatuses).toContain('pending')
      expect(milestoneStatuses).toContain('in_progress')
      expect(milestoneStatuses).toContain('completed')
      expect(milestoneStatuses).toContain('delayed')
      expect(milestoneStatuses).toContain('cancelled')
      expect(milestoneStatuses.length).toBe(5)
    })

    it('should have all wizard steps', () => {
      expect(wizardSteps).toContain('basic')
      expect(wizardSteps).toContain('company')
      expect(wizardSteps).toContain('team')
      expect(wizardSteps).toContain('budget')
      expect(wizardSteps).toContain('milestones')
      expect(wizardSteps).toContain('review')
      expect(wizardSteps.length).toBe(6)
    })
  })
})
