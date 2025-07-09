import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  barbershopName: varchar("barbershop_name"),
  phone: varchar("phone"),
  address: text("address"),
  subdomain: varchar("subdomain").unique(),
  primaryColor: varchar("primary_color").default("#3b82f6"),
  secondaryColor: varchar("secondary_color").default("#1e40af"),
  bookingStyle: varchar("booking_style").default("both"), // appointment, walk-in, both
  logoUrl: varchar("logo_url"),
  businessHours: jsonb("business_hours"),
  isOnboarded: boolean("is_onboarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  notes: text("notes"),
  preferredBarber: varchar("preferred_barber"),
  visitCount: integer("visit_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  barber: varchar("barber"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Queue table
export const queue = pgTable("queue", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  barber: varchar("barber"),
  position: integer("position").notNull(),
  status: varchar("status").default("waiting"), // waiting, in_progress, completed
  estimatedWaitTime: integer("estimated_wait_time"), // in minutes
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gallery table
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  category: varchar("category"), // haircut, beard, styling, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table for POS
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // cash, card, digital
  status: varchar("status").default("completed"), // pending, completed, refunded
  createdAt: timestamp("created_at").defaultNow(),
});

// Transaction items
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Barbers table
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  specialties: text("specialties").array().default([]),
  bio: text("bio"),
  experience: integer("experience"), // years of experience
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  services: many(services),
  appointments: many(appointments),
  queue: many(queue),
  reviews: many(reviews),
  gallery: many(gallery),
  transactions: many(transactions),
  barbers: many(barbers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  appointments: many(appointments),
  queue: many(queue),
  reviews: many(reviews),
  transactions: many(transactions),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  user: one(users, { fields: [services.userId], references: [users.id] }),
  appointments: many(appointments),
  queue: many(queue),
  transactionItems: many(transactionItems),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
  reviews: many(reviews),
  transactions: many(transactions),
}));

export const queueRelations = relations(queue, ({ one }) => ({
  user: one(users, { fields: [queue.userId], references: [users.id] }),
  customer: one(customers, { fields: [queue.customerId], references: [customers.id] }),
  service: one(services, { fields: [queue.serviceId], references: [services.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  customer: one(customers, { fields: [reviews.customerId], references: [customers.id] }),
  appointment: one(appointments, { fields: [reviews.appointmentId], references: [appointments.id] }),
}));

export const galleryRelations = relations(gallery, ({ one }) => ({
  user: one(users, { fields: [gallery.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  customer: one(customers, { fields: [transactions.customerId], references: [customers.id] }),
  appointment: one(appointments, { fields: [transactions.appointmentId], references: [appointments.id] }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionItems.transactionId], references: [transactions.id] }),
  service: one(services, { fields: [transactionItems.serviceId], references: [services.id] }),
}));

export const barbersRelations = relations(barbers, ({ one }) => ({
  user: one(users, { fields: [barbers.userId], references: [users.id] }),
}));

// Zod schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, userId: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export const insertQueueSchema = createInsertSchema(queue).omit({ id: true, userId: true, joinedAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, userId: true, createdAt: true });
export const insertGallerySchema = createInsertSchema(gallery).omit({ id: true, userId: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, userId: true, createdAt: true });
export const insertBarberSchema = createInsertSchema(barbers).omit({ id: true, userId: true, createdAt: true, updatedAt: true });

// Onboarding schema
export const onboardingSchema = z.object({
  barbershopName: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  bookingStyle: z.enum(["appointment", "walk-in", "both"]),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  logoUrl: z.string().optional(),
  businessHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  }),
  barbers: z.array(z.object({
    name: z.string().min(1, "Barber name is required"),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    specialties: z.array(z.string()).default([]),
    bio: z.string().optional(),
    experience: z.number().optional(),
  })).min(1, "At least one barber is required"),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Queue = typeof queue.$inferSelect;
export type InsertQueue = z.infer<typeof insertQueueSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;
