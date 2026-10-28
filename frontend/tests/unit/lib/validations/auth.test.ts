import { describe, expect, it } from 'vitest'
import { loginSchema, resetPasswordSchema, signupSchema } from '@/lib/validations/auth'

const validSignup = {
  displayName: 'Sam Lee',
  email: 'sam@example.com',
  password: 'Password1',
  confirmPassword: 'Password1',
}

const messageFor = (
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string
) => result.error?.issues.find((i) => i.path[0] === field)?.message

describe('auth schemas', () => {
  it('accepts valid credentials and a valid signup', () => {
    expect(loginSchema.safeParse({ email: 'sam@example.com', password: 'x' }).success).toBe(true)
    expect(signupSchema.safeParse(validSignup).success).toBe(true)
  })

  it('rejects an invalid email with the friendly message on every schema that has one', () => {
    const expected = 'Please enter a valid email address'
    expect(messageFor(loginSchema.safeParse({ email: 'nope', password: 'x' }), 'email')).toBe(
      expected
    )
    expect(messageFor(resetPasswordSchema.safeParse({ email: 'nope' }), 'email')).toBe(expected)
    expect(messageFor(signupSchema.safeParse({ ...validSignup, email: 'nope' }), 'email')).toBe(
      expected
    )
  })

  it('enforces the password rules', () => {
    const msg = (password: string) =>
      messageFor(
        signupSchema.safeParse({ ...validSignup, password, confirmPassword: password }),
        'password'
      )
    expect(msg('Short1')).toBe('Password must be at least 8 characters')
    expect(msg('lowercase1')).toBe('Password must contain at least one uppercase letter')
    expect(msg('NoNumbers')).toBe('Password must contain at least one number')
  })

  it('reports mismatched passwords on confirmPassword', () => {
    const result = signupSchema.safeParse({ ...validSignup, confirmPassword: 'Different1' })
    expect(messageFor(result, 'confirmPassword')).toBe('Passwords do not match')
  })
})
