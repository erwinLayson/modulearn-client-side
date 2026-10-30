import { registerSchool, type RegisterSchoolPayload, type RegisterSchoolResponse } from "../api/schools";
import { getApiErrorMessage } from "../api/client";

export interface SchoolRegistrationForm {
  school_name: string;
  school_id: string;
  school_level: string;
  school_email: string;
  address: string;
  region: string;
  province: string;
  city: string;
  contact_number: string;
  school_logo: string;
  school_admin: string;
  academic_system: string;
  period_count: string;
}

export const initialRegistrationForm: SchoolRegistrationForm = {
  school_name: "",
  school_id: "",
  school_level: "",
  school_email: "",
  address: "",
  region: "",
  province: "",
  city: "",
  contact_number: "",
  school_logo: "",
  school_admin: "",
  academic_system: "quarter",
  period_count: "4",
};

export const schoolLevels = [
  { value: "1", label: "Elementary School" },
  { value: "2", label: "Junior High School" },
  { value: "3", label: "Senior High School" },
  { value: "4", label: "College & University" },
];

export async function submitSchoolRegistration(
  form: SchoolRegistrationForm
): Promise<RegisterSchoolResponse> {
  const payload: RegisterSchoolPayload = {
    school_name: form.school_name,
    school_id: Number(form.school_id),
    school_level: Number(form.school_level),
    school_email: form.school_email,
    address: form.address,
    region: form.region,
    province: form.province,
    city: form.city,
    contact_number: form.contact_number,
    school_logo: form.school_logo,
    school_admin: form.school_admin,
  };
  const { data } = await registerSchool(payload);
  return data;
}

export { getApiErrorMessage };
