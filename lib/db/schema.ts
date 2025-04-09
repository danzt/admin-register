import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  cedula: text('cedula').notNull().unique(),
  nombres: text('nombres').notNull(),
  apellidos: text('apellidos').notNull(),
  telefono: text('telefono').notNull(),
  direccion: text('direccion').notNull(),
  correo: text('correo').notNull().unique(),
  fechaBautizo: timestamp('fecha_bautizo'),
  whatsapp: boolean('whatsapp').default(false),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});