import { z } from 'zod';

/**
 * Validation schemas for Ágora Mujeres
 * Using Zod for runtime type checking and validation
 */

// Emotional state validation
export const EmotionalStateSchema = z.object({
  calma: z.number().min(0).max(10).optional(),
  fatiga: z.number().min(0).max(10).optional(),
  niebla_mental: z.number().min(0).max(10).optional(),
  dolor_difuso: z.number().min(0).max(10).optional(),
  gratitud: z.number().min(0).max(10).optional(),
  tension: z.number().min(0).max(10).optional(),
  saturada: z.number().min(0).max(10).optional(),
  desconectada: z.number().min(0).max(10).optional(),
  sensible: z.number().min(0).max(10).optional(),
  abrumada: z.number().min(0).max(10).optional(),
  vulnerable: z.number().min(0).max(10).optional(),
  tranquila: z.number().min(0).max(10).optional(),
  energia: z.number().min(0).max(10).optional(),
});

export type EmotionalState = z.infer<typeof EmotionalStateSchema>;

// Physical state validation
export const PhysicalStateSchema = z.object({
  nivel_dolor: z.number().min(0).max(10),
  energia: z.number().min(0).max(10),
  sensibilidad: z.number().min(0).max(10),
});

export type PhysicalState = z.infer<typeof PhysicalStateSchema>;

// Diary entry validation
export const DiaryEntrySchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  texto: z.string().max(5000, 'Entry cannot exceed 5000 characters').optional(),
  emotional_state: EmotionalStateSchema,
  physical_state: PhysicalStateSchema.optional(),
  weather: z.object({}).optional(),
});

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;

// Chat message validation
export const ChatMessageSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long (max 5000 characters)'),
  conversation_id: z.string().optional(),
  language: z.enum(['es', 'en']).default('es'),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Subscription validation
export const SubscriptionSchema = z.object({
  device_id: z.string().min(1),
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Cycle entry validation
export const CycleEntrySchema = z.object({
  device_id: z.string().min(1),
  start_date: z.string().date('Invalid date format'),
  end_date: z.string().date('Invalid date format').optional(),
  notes: z.string().max(1000).optional(),
});

export type CycleEntry = z.infer<typeof CycleEntrySchema>;

// Monthly pain record validation
export const MonthlyPainRecordSchema = z.object({
  device_id: z.string().min(1),
  records: z.array(
    z.object({
      date: z.string().date('Invalid date format'),
      intensity: z.number().min(0).max(10),
      notes: z.string().max(500).optional(),
    })
  ),
  cycle_start_date: z.string().date('Invalid date format'),
});

export type MonthlyPainRecord = z.infer<typeof MonthlyPainRecordSchema>;

// Admin verification validation
export const AdminVerifySchema = z.object({
  device_id: z.string().min(1),
  code: z.string().min(4, 'Admin code must be at least 4 characters'),
});

export type AdminVerify = z.infer<typeof AdminVerifySchema>;

/**
 * Utility function to validate and parse data
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('[Validation] Error:', messages);
      return { success: false, error: messages };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};
