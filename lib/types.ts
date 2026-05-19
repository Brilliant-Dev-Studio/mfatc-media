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
  fatherName: string;
  motherName: string;
  stageName: string;
  age: number;
  birthday: string;
  address: string;
  aboutYourself: string;
  facebookLink: string;
  phoneNo: string;
  viberNo: string;
  lifeGoal: string;
  admiredArtist: string;
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
