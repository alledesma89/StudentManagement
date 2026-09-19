import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from '@mui/icons-material';
import { Paper, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { parseISO } from 'date-fns';

import { PageContentHeader } from '@/components/page-content-header';
import { BasicInformation } from '../forms/basic-information';
import { AcademicInformation } from '../forms/academic-information';
import { ParentsAndGuardianInformation } from '../forms/parents-and-guardian-information';
import { AddressInformation } from '../forms/address-information';
import { OtherInformation } from '../forms/other-information';
import { getErrorMsg } from '@/utils/helpers/get-error-message';
import { StudentProps } from '../../types';
import { studentFormInitialState } from '../../reducer/student-form-reducer';
import { StudentSchema } from '../../types/student-schema';
import { useGetStudentDetail } from '../../hooks';
import { useUpdateStudentMutation } from '../../api/student-api';

import { API_DATE_FORMAT, getFormattedDate } from '@/utils/helpers/date';

type StudentAccountEditProps = {
  heading: string;
  id?: string;
  redirectPath: string;
};

export const StudentAccountEdit: React.FC<StudentAccountEditProps> = ({
  id,
  redirectPath,
  heading
}) => {
  const methods = useForm<StudentProps>({
    defaultValues: studentFormInitialState,
    resolver: zodResolver(StudentSchema)
  });
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const navigate = useNavigate();

  const studentDetail = useGetStudentDetail(id);

  React.useEffect(() => {
    if (studentDetail) {
      const formattedValues: Record<string, any> = {};
      for (const [key, value] of Object.entries(studentDetail)) {
        if (['admissionDate', 'dob'].includes(key)) {
          formattedValues[key] =
            value && typeof value === 'string' ? parseISO(value) : (value ?? null);
        } else if (typeof value === 'boolean') {
          formattedValues[key] = value;
        } else {
          formattedValues[key] = value ?? '';
        }
      }
      methods.reset(formattedValues as StudentProps);
    }
  }, [studentDetail, methods]);

  const onUpdate = async (data: StudentProps) => {
    try {
      const { dob, admissionDate, ...rest } = data;
      const payload = {
        ...rest,
        id: Number(id!),
        dob: dob ? getFormattedDate(dob, API_DATE_FORMAT) : null,
        admissionDate: admissionDate ? getFormattedDate(admissionDate, API_DATE_FORMAT) : null
      };

      const result = await updateStudent(payload).unwrap();
      toast.info(result.message);
      navigate(redirectPath);
    } catch (error) {
      const { message } = getErrorMsg(error as FetchBaseQueryError | SerializedError);
      toast.error(message);
    }
  };

  return (
    <>
      <PageContentHeader icon={<Edit sx={{ mr: 1 }} />} heading={heading} />
      <Paper sx={{ p: 3 }}>
        <FormProvider {...methods}>
          <BasicInformation />

          <hr />
          <AcademicInformation />

          <hr />
          <ParentsAndGuardianInformation />

          <hr />
          <AddressInformation />

          <hr />
          <OtherInformation />
        </FormProvider>
        <hr />
        <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
          <LoadingButton
            loading={isLoading}
            size='small'
            variant='contained'
            color='primary'
            onClick={methods.handleSubmit(onUpdate)}
          >
            Save
          </LoadingButton>
        </Stack>
      </Paper>
    </>
  );
};
