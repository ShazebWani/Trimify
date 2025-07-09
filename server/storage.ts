import {
  users,
  customers,
  services,
  appointments,
  queue,
  reviews,
  gallery,
  transactions,
  transactionItems,
  barbers,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type Service,
  type InsertService,
  type Appointment,
  type InsertAppointment,
  type Queue,
  type InsertQueue,
  type Review,
  type InsertReview,
  type Gallery,
  type InsertGallery,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type Barber,
  type InsertBarber,
  type OnboardingData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Customer operations
  getCustomers(userId: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer, userId: string): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Service operations
  getServices(userId: string): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService, userId: string): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Appointment operations
  getAppointments(userId: string): Promise<Appointment[]>;
  getTodaysAppointments(userId: string): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment, userId: string): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  // Queue operations
  getQueue(userId: string): Promise<Queue[]>;
  addToQueue(queueItem: InsertQueue, userId: string): Promise<Queue>;
  updateQueuePosition(id: number, position: number): Promise<Queue>;
  updateQueueStatus(id: number, status: string): Promise<Queue>;
  removeFromQueue(id: number): Promise<void>;

  // Review operations
  getReviews(userId: string): Promise<Review[]>;
  getRecentReviews(userId: string, limit: number): Promise<Review[]>;
  createReview(review: InsertReview, userId: string): Promise<Review>;

  // Gallery operations
  getGallery(userId: string): Promise<Gallery[]>;
  createGalleryItem(item: InsertGallery, userId: string): Promise<Gallery>;
  updateGalleryItem(id: number, item: Partial<InsertGallery>): Promise<Gallery>;
  deleteGalleryItem(id: number): Promise<void>;

  // Transaction operations
  getTransactions(userId: string): Promise<Transaction[]>;
  getTodaysTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction, userId: string): Promise<Transaction>;
  
  // Analytics operations
  getDashboardStats(userId: string): Promise<{
    todayQueueCount: number;
    todayAppointmentCount: number;
    averageWaitTime: number;
    todayRevenue: number;
  }>;

  // Barber operations
  getBarbers(userId: string): Promise<Barber[]>;
  getBarber(id: number): Promise<Barber | undefined>;
  createBarber(barber: InsertBarber, userId: string): Promise<Barber>;
  updateBarber(id: number, barber: Partial<InsertBarber>): Promise<Barber>;
  deleteBarber(id: number): Promise<void>;

  // Onboarding operations
  completeOnboarding(userId: string, data: OnboardingData): Promise<User>;
  generateSubdomain(businessName: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(userId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer, userId: string): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values({ ...customer, userId })
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Service operations
  async getServices(userId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.userId, userId), eq(services.isActive, true)))
      .orderBy(asc(services.name));
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService, userId: string): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values({ ...service, userId })
      .returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Appointment operations
  async getAppointments(userId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.startTime));
  }

  async getTodaysAppointments(userId: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        eq(appointments.startTime, today),
        eq(appointments.startTime, tomorrow)
      ))
      .orderBy(asc(appointments.startTime));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment, userId: string): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values({ ...appointment, userId })
      .returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Queue operations
  async getQueue(userId: string): Promise<Queue[]> {
    return await db
      .select()
      .from(queue)
      .where(eq(queue.userId, userId))
      .orderBy(asc(queue.position));
  }

  async addToQueue(queueItem: InsertQueue, userId: string): Promise<Queue> {
    const [newQueueItem] = await db
      .insert(queue)
      .values({ ...queueItem, userId })
      .returning();
    return newQueueItem;
  }

  async updateQueuePosition(id: number, position: number): Promise<Queue> {
    const [updatedQueueItem] = await db
      .update(queue)
      .set({ position, updatedAt: new Date() })
      .where(eq(queue.id, id))
      .returning();
    return updatedQueueItem;
  }

  async updateQueueStatus(id: number, status: string): Promise<Queue> {
    const [updatedQueueItem] = await db
      .update(queue)
      .set({ status, updatedAt: new Date() })
      .where(eq(queue.id, id))
      .returning();
    return updatedQueueItem;
  }

  async removeFromQueue(id: number): Promise<void> {
    await db.delete(queue).where(eq(queue.id, id));
  }

  // Review operations
  async getReviews(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getRecentReviews(userId: string, limit: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  }

  async createReview(review: InsertReview, userId: string): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({ ...review, userId })
      .returning();
    return newReview;
  }

  // Gallery operations
  async getGallery(userId: string): Promise<Gallery[]> {
    return await db
      .select()
      .from(gallery)
      .where(and(eq(gallery.userId, userId), eq(gallery.isActive, true)))
      .orderBy(desc(gallery.createdAt));
  }

  async createGalleryItem(item: InsertGallery, userId: string): Promise<Gallery> {
    const [newItem] = await db
      .insert(gallery)
      .values({ ...item, userId })
      .returning();
    return newItem;
  }

  async updateGalleryItem(id: number, item: Partial<InsertGallery>): Promise<Gallery> {
    const [updatedItem] = await db
      .update(gallery)
      .set(item)
      .where(eq(gallery.id, id))
      .returning();
    return updatedItem;
  }

  async deleteGalleryItem(id: number): Promise<void> {
    await db.update(gallery).set({ isActive: false }).where(eq(gallery.id, id));
  }

  // Transaction operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTodaysTransactions(userId: string): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.createdAt, today),
        eq(transactions.createdAt, tomorrow)
      ))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction, userId: string): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({ ...transaction, userId })
      .returning();
    return newTransaction;
  }

  // Analytics operations
  async getDashboardStats(userId: string): Promise<{
    todayQueueCount: number;
    todayAppointmentCount: number;
    averageWaitTime: number;
    todayRevenue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's queue count
    const [queueCount] = await db
      .select({ count: count() })
      .from(queue)
      .where(eq(queue.userId, userId));

    // Get today's appointments count
    const [appointmentCount] = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        eq(appointments.startTime, today),
        eq(appointments.startTime, tomorrow)
      ));

    // Get average wait time (simplified calculation)
    const queueItems = await db
      .select()
      .from(queue)
      .where(eq(queue.userId, userId));
    
    const averageWaitTime = queueItems.length > 0 
      ? queueItems.reduce((sum, item) => sum + (item.estimatedWaitTime || 0), 0) / queueItems.length
      : 0;

    // Get today's revenue
    const todayTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.createdAt, today),
        eq(transactions.createdAt, tomorrow)
      ));

    const todayRevenue = todayTransactions.reduce((sum, transaction) => 
      sum + Number(transaction.total), 0);

    return {
      todayQueueCount: queueCount.count,
      todayAppointmentCount: appointmentCount.count,
      averageWaitTime: Math.round(averageWaitTime),
      todayRevenue,
    };
  }

  // Barber operations
  async getBarbers(userId: string): Promise<Barber[]> {
    return await db
      .select()
      .from(barbers)
      .where(eq(barbers.userId, userId))
      .orderBy(asc(barbers.name));
  }

  async getBarber(id: number): Promise<Barber | undefined> {
    const [barber] = await db.select().from(barbers).where(eq(barbers.id, id));
    return barber;
  }

  async createBarber(barber: InsertBarber, userId: string): Promise<Barber> {
    const [newBarber] = await db
      .insert(barbers)
      .values({ ...barber, userId })
      .returning();
    return newBarber;
  }

  async updateBarber(id: number, barber: Partial<InsertBarber>): Promise<Barber> {
    const [updatedBarber] = await db
      .update(barbers)
      .set(barber)
      .where(eq(barbers.id, id))
      .returning();
    return updatedBarber;
  }

  async deleteBarber(id: number): Promise<void> {
    await db.delete(barbers).where(eq(barbers.id, id));
  }

  // Onboarding operations
  async completeOnboarding(userId: string, data: OnboardingData): Promise<User> {
    const subdomain = await this.generateSubdomain(data.barbershopName);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        barbershopName: data.barbershopName,
        address: data.address,
        phone: data.phone,
        subdomain,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        bookingStyle: data.bookingStyle,
        logoUrl: data.logoUrl,
        businessHours: data.businessHours,
        isOnboarded: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Create barbers
    for (const barberData of data.barbers) {
      await this.createBarber(barberData, userId);
    }

    return updatedUser;
  }

  async generateSubdomain(businessName: string): Promise<string> {
    const baseSubdomain = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    
    let subdomain = baseSubdomain;
    let counter = 1;
    
    while (true) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.subdomain, subdomain));
      
      if (!existing) {
        break;
      }
      
      subdomain = `${baseSubdomain}${counter}`;
      counter++;
    }
    
    return subdomain;
  }
}

export const storage = new DatabaseStorage();
