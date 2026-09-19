import { z } from 'zod';

export const StaffFilterSchema = z
  .object({
    roleId: z.string(),
    staffId: z.string(),
    staffName: z.string()
  })
  .partial();

export const BasicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.number().optional().nullable(),
  roleName: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().min(1, 'Email is required'),
  dob: z.union([z.date(), z.string()]).optional().nullable(),
  joinDate: z.union([z.date(), z.string()]).optional().nullable(),
  qualification: z.string().optional().nullable(),
  experience: z.string().optional().nullable()
});
export const AddressInfoSchema = z.object({
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable()
});
export const ParentsInfoSchema = z.object({
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable()
});
export const OtherInfoSchema = z.object({
  reporterId: z.number().optional().nullable(),
  systemAccess: z.boolean().optional(),
  reporterName: z.string().optional().nullable()
});
export const StaffFormSchema = BasicInfoSchema.extend(AddressInfoSchema.shape)
  .extend(ParentsInfoSchema.shape)
  .extend(OtherInfoSchema.shape);
