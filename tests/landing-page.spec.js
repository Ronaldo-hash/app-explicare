// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {

    test('should load the landing page successfully', async ({ page }) => {
        await page.goto('/');

        // Verifica se o título principal está visível
        await expect(page.locator('h1')).toContainText('Explicado');

        // Verifica se o botão principal de login está presente (top right link)
        await expect(page.locator('a:has-text("Entrar")')).toBeVisible();
    });

    test('should navigate to login page when clicking "Entrar"', async ({ page }) => {
        await page.goto('/');

        // Clica no link "Entrar"
        const loginButton = page.locator('a:has-text("Entrar")');
        await expect(loginButton).toBeVisible();
        await loginButton.click();

        // Verifica se redirecionou para /login
        await page.waitForURL('**/login');
        await expect(page.locator('h2')).toContainText('Acesso');
    });

    test('should have a working FAQ section', async ({ page }) => {
        await page.goto('/');

        // Procura a seção de FAQ
        const faqSection = page.locator('text=Como podemos ajudar?');
        await expect(faqSection).toBeVisible();

        // Verifica se a primeira pergunta está visível
        const firstQuestion = page.locator('text=Como o Explicare funciona na prática?');
        await expect(firstQuestion).toBeVisible();
    });

    test('should have a floating WhatsApp button with correct link', async ({ page }) => {
        await page.goto('/');

        // Procura pelo botão do WhatsApp pelo link fornecido e label
        const whatsappButton = page.locator('a[aria-label="Fale conosco no WhatsApp"]');
        await expect(whatsappButton).toBeVisible();

        // Opcional: testar que ele tenta abrir em uma nova aba (_blank)
        await expect(whatsappButton).toHaveAttribute('target', '_blank');
    });

});
