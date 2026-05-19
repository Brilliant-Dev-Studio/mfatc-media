export type ExperienceEntry = {
  title: string;
  organization: string;
  period: string;
  description: string;
};

export type Submission = {
  id: string;
  createdAt: string;
  name: string;
  age: number;
  birthday: string;
  aboutYourself: string;
  facebookLink: string;
  viberNo: string;
  nrcFront: string;
  nrcBack: string;
  portraits: string[];
  artStatement: string;
  experience: ExperienceEntry[];
};

export type SubmissionInput = Omit<Submission, "id" | "createdAt">;

export type SubmissionListResponse = {
  items: Submission[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminUser = { username: string };
