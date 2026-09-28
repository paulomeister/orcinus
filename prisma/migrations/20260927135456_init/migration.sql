-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('llamada', 'ticket');

-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('abierta', 'en_progreso', 'resuelta');

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "type" "InteractionType" NOT NULL,
    "status" "InteractionStatus" NOT NULL DEFAULT 'abierta',
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE INDEX "idx_interactions_opened_at" ON "interactions"("opened_at");

-- CreateIndex
CREATE INDEX "idx_interactions_agent_opened_at" ON "interactions"("agent_id", "opened_at");

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
