import { authService } from '../services/auth.service';
import { UserModel } from '../models/User';

describe('AuthService', () => {
    describe('register', () => {
        it('should register a new user', async () => {
            const input = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                phone: '+77001234567',
            };

            const result = await authService.register(input);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe(input.email);
            expect(result.user.username).toBe(input.username);
            expect(result.user.role).toBe('CLIENT');
        });

        it('should throw error if email already exists', async () => {
            const input = {
                email: 'duplicate@example.com',
                username: 'user1',
                password: 'password123',
            };

            await authService.register(input);

            await expect(
                authService.register({ ...input, username: 'user2' })
            ).rejects.toThrow();
        });

        it('should throw error if username already exists', async () => {
            const input = {
                email: 'user1@example.com',
                username: 'duplicate',
                password: 'password123',
            };

            await authService.register(input);

            await expect(
                authService.register({ ...input, email: 'user2@example.com' })
            ).rejects.toThrow();
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            await authService.register({
                email: 'login@example.com',
                username: 'loginuser',
                password: 'password123',
            });
        });

        it('should login with correct credentials', async () => {
            const result = await authService.login({
                email: 'login@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe('login@example.com');
        });

        it('should throw error with incorrect password', async () => {
            await expect(
                authService.login({
                    email: 'login@example.com',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow();
        });

        it('should throw error with non-existent email', async () => {
            await expect(
                authService.login({
                    email: 'notfound@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow();
        });
    });
});