# Makefile for HireSphere Monorepo

.PHONY: setup dev build db-up db-migrate

# The "One-Command" Setup
setup:
	@echo "🚀 Starting HireSphere Setup..."
	pnpm install
	cp .env.example .env || true
	docker-compose up -d
	@echo "⏳ Waiting for Database to be ready..."
	sleep 5
	pnpm prisma:generate
	pnpm prisma:push
	pnpm prepare
	@echo "✅ Setup Complete! Run 'pnpm start:api' to begin."

# Database Management
db-up:
	docker-compose up -d

db-migrate:
	pnpm prisma:push

# Development
dev:
	pnpm start:api

# Validation
check:
	pnpm lint
	pnpm check:circular
	pnpm test:all