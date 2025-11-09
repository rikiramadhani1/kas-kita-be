export enum Role {
  Member = 'member',
  Admin = 'admin',
  Bendahara = 'bendahara',
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  created_at: Date;
}
