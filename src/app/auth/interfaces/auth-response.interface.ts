import { User } from "./user.interface";

export interface AuthREsponse {
  user:  User;
  token: string;
}
