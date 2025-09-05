import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// Definir el enum de roles
export const roleEnum = pgEnum('role', ['admin', 'staff', 'usuario'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  idNumber: text('id_number').notNull().unique(),
  firstNames: text('first_names').notNull(),
  lastNames: text('last_names').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  email: text('email').notNull().unique(),
  baptismDate: timestamp('baptism_date'),
  whatsapp: boolean('whatsapp').default(false),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').default('usuario').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Tabla para definir permisos específicos por rol
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Tabla para relacionar roles con permisos
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  role: roleEnum('role').notNull(),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id),
  createdAt: timestamp('created_at').defaultNow(),
})
