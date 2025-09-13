import { User } from '../mongo/models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
