import { z } from 'zod';

export const StudentFilterSchema = z.object({
  class: z.string().optional(),
  section: z.string().optional(),
  name: z.string().optional(),
  roll: z.string().optional()
});

export const BasicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.string().optional().nullable(),
  dob: z.union([z.date(), z.string()]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().min(1, 'Email is required')
});

export const AcademicInfoSchema = z.object({
  class: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  roll: z.string().optional().nullable(),
  admissionDate: z.union([z.date(), z.string()]).optional().nullable()
});

export const AddressInfoSchema = z.object({
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable()
});

export const ParentsAndGuardianInfoSchema = z.object({
  fatherName: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  relationOfGuardian: z.string().optional().nullable()
});

export const OtherInfoSchema = z.object({
  systemAccess: z.boolean().optional()
});

export const StudentSchema = BasicInfoSchema.extend(AcademicInfoSchema.shape)
  .extend(AddressInfoSchema.shape)
  .extend(ParentsAndGuardianInfoSchema.shape)
  .extend(OtherInfoSchema.shape);

